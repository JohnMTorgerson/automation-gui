import ThermControls from './therm_controls.mjs';

(function main() {

  setElementSizes();
  const thermCtrls = new ThermControls();

  // fetch data and save any data changes immediately on page load, and then at ten second intervals thereafter
  fetchAndSaveData();
  setInterval(fetchAndSaveData,10000);

  // set the mouse cursor to appear when moved (but ideally only when using a mouse, more on that below)
  // and then set the mouse cursor to disappear after a second or two of inactivity
  let mouseTimer;
  let mouseCounter = 0;
  document.body.addEventListener("mousemove",(e) => {
    // we want the cursor to appear when using a mouse to press control buttons
    // on the GUI, but we don't want it to appear when using the touchscreen;
    // for now, we use a counter to make the distinction (so that the cursor only appears
    // if moved enough times, as would happen with a mouse, rather than jumping as would happen with a touch event)
    // in the future, we'll consider using mozInputSource instead of a counter:
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/mozInputSource
    if (mouseCounter > 10) {
      document.body.style.cursor = "default";
    }

    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => {
      document.body.style.cursor = "none";
      mouseCounter = 0;
    },2000)

    mouseCounter++;
  });
  // reset mouseCounter when a click happens, so that incidental movement from multiple touchscreen presses doesn't make the cursor appear
  document.querySelectorAll(".button").forEach(el => {
    el.addEventListener("click",(e) => {
      mouseCounter = 0;
    });
  });


  const backgroundColor = (a) => `rgba(0,0,0,${isNaN(a) ? '1' : a})`;
  const mainColor = (a) => `rgba(50,255,50,${isNaN(a) ? '1' : a})`;
  const secondaryColor = (a) => `rgba(255,50,200,${isNaN(a) ? '.9' : a})`;
  const blueColorAC = (a) => `rgba(100,100,255,${isNaN(a) ? '.45' : a})`;

  // let numberFont = "Open24";//"Twobit";//"Orbitron";
  // let bigNumberFont = "OdysseyHalf";
  // let biggerNumberFont = "OdysseyGrad";
  const font = "AdvancedDot";
  const font1 = "MaximumSecurity";
  const font2 = "Twobit";
  const font3 = "Odyssey";
  const font4 = "DeadCRT";

  // // draw overlay, a semi-transparent graphic that lies atop the rest of the screen
  // drawOverlay();

  //=================================================//


  // dynamically load scene data from flask server
  async function fetchAndSaveData() {

    // first, if a change was made (e.g. the user changed the temp threshold through the UI)
    // since the server was last polled, we need to update the server with the changes
    // before getting updated data from it
    if (thermCtrls.changed) {
      console.log("control change occurred, sending to server to save to file...")

      // send update to server to save to file
      const fetchRequest = {
        cache: "no-cache",
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thermCtrls.data["settings"])
      }

      let response = await fetch('/thermostat_control',fetchRequest);
      if (response.ok) {
        console.log("...sent to server");
      } else {
        console.log(response.status)
      }

      // change the flag back to false
      thermCtrls.changed = false;
    }


    // then load data and settings from server
    console.log('fetching data');
    fetch('/thermostat_update')
    .then(async response => {
      if (response.ok) {
        let data = await response.json();

        updateData(data);

      } else {
        // do nothing and just wait until the next interval
        console.log(response.status)
      }
    }).catch(err => {
      console.error(err);
    });


  }

  function setElementSizes() {
    const graph = document.getElementById("graph");
    graph.width = graphWidth;
    graph.height = graphHeight;

    const tempLabels = document.getElementById("temp_labels");
    tempLabels.width = (width - graphWidth) * 0.4;
    tempLabels.height = graphHeight;

    const humLabels = document.getElementById("hum_labels");
    humLabels.width = (width - graphWidth) * 0.6;
    humLabels.height = graphHeight;

    const timeLabels = document.getElementById("time_labels");
    timeLabels.width = graphWidth;
    timeLabels.height = height - graphHeight;
  }

  // async function updateData(data) {
  window.updateData = async function (data) {
    console.log("Updating...");
    console.log(data);
    if (data.error) {
      document.getElementById('root').innerHTML = `Error fetching thermostat data: ${data.error}`;
      return;
    }

    // update thresholds on control screen
    thermCtrls.updateCtrls(data);

    // ----- x values -----
    const hoursRange = 12;
    const timeRange = 1000 * 60 * 60 * hoursRange;
    const now = new Date();//1658602343136);//1657390638260);
    const startTime = now - timeRange;

    // ----- y values -----
    // first set a range based on the thermostat settings for temp and humidity
    let maxTemp = data.settings.temp_target + 3;//81;
    let minTemp = data.settings.temp_target - data.settings.temp_hyst - 3;//74;
    let maxHum = data.settings.hum_target + 3;//41;
    let minHum = data.settings.hum_target - data.settings.hum_hyst - 3;//34;
    // then expand the ranges as needed based on the values that appear in the data in our time range
    const valuesRange = findValuesRangeInTimeRange(data.logged_sensor, startTime);
    minTemp = Math.min(minTemp, Math.floor(valuesRange.temp[0]-1));
    maxTemp = Math.max(maxTemp, Math.ceil(valuesRange.temp[1]+1));
    minHum = Math.min(minHum, Math.floor(valuesRange.humidity[0]-1));
    maxHum = Math.max(maxHum, Math.ceil(valuesRange.humidity[1]+1));
    // then save the adjusted ranges
    const tempRange = maxTemp - minTemp;
    const humRange = maxHum - minHum;


    // label styles
    const labelStyles = {
      "font" : font2,
      "fontSize" : fontSize * 1.5,
      "color" : mainColor,
      "tickWidth" : fontSize / 6,
      "tickLength" : fontSize / 3
    }

    let humStyles = {...labelStyles};
    humStyles.color = secondaryColor;
    humStyles.font = font3;
    humStyles.fontSize = humStyles.fontSize * 1.1; // adjust since we're using a different font

    const currentValueStyles = {
      "font" : font,
      "fontSize" : fontSize * 2.5,
      "tempColor" : labelStyles.color,
      "humColor" : humStyles.color
    }

    // ====== DRAW GRAPH ====== //

    const graph = document.getElementById("graph");
    const graphCtx = graph.getContext("2d");

    // draw background
    drawBG(graphCtx,graph);

    // semi-transparent pixel effect
    drawOverlay(graphCtx,graph);

    // draw event markers (such as A/C on/off)
    drawEvents(graphCtx,data.logged_sensor,startTime,timeRange)

    // draw temp and humidity threshold lines (what the thermostat is set to)
    drawThreshold(graphCtx,data.settings.hum_target,currentValueStyles.humColor(0.7),minHum,maxHum);
    drawThreshold(graphCtx,data.settings.temp_target,currentValueStyles.tempColor(0.6),minTemp,maxTemp);

    // draw sensor data
    drawSensorData(graphCtx,data.logged_sensor,startTime,timeRange,minTemp,maxTemp,minHum,maxHum);

    // draw outline
    graphCtx.strokeStyle = mainColor();
    graphCtx.lineWidth = labelStyles.tickWidth * 2;
    graphCtx.beginPath();
    graphCtx.rect(0, 0, graph.width, graph.height);
    graphCtx.stroke();


    // ====== DRAW Y (TEMPERATURE) LABELS ====== //

    const tempLabels = document.getElementById("temp_labels");
    const tempCtx = tempLabels.getContext("2d");

    drawBG(tempCtx,tempLabels);

    // draw y axis labels
    drawTempLabels(tempCtx,tempLabels,minTemp,maxTemp,labelStyles);

    // ====== DRAW Y (HUMIDITY) LABELS ====== //

    const humLabels = document.getElementById("hum_labels");
    const humCtx = humLabels.getContext("2d");

    drawBG(humCtx,humLabels);

    // draw y axis labels
    drawHumLabels(humCtx,humLabels,minHum,maxHum,humStyles);


    // ====== DRAW X LABELS ====== //

    const timeLabels = document.getElementById("time_labels");
    const timeCtx = timeLabels.getContext("2d");

    drawBG(timeCtx,timeLabels);

    // draw x axis labels
    drawTimeLabels(timeCtx,startTime,now,labelStyles);

    // ====== DRAW CURRENT VALUE LABELS ====== //
    drawCurrentValues(graphCtx,data.current,currentValueStyles);
  }





  // =================================================== //
  // =================================================== //
  // =================================================== //
  // =================================================== //
  // =================================================== //



  function findValuesRangeInTimeRange(sensorData, startTime) {
    const range = {
      temp: [Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY],
      humidity: [101, -1]
    };

    for (const key in sensorData) {
      const timestamp = parseInt(key);

      // if this entry is within the time range of the graph
      if (timestamp > startTime) {
        const temp = parseFloat(sensorData[key].temp);
        const hum = parseFloat(sensorData[key].humidity);

        if (!isNaN(temp)) {
          range.temp[0] = Math.min(range.temp[0],temp); // update minimum temp
          range.temp[1] = Math.max(range.temp[1],temp); // update maximum temp
        }
        if (!isNaN(hum)) {
          range.humidity[0] = Math.min(range.humidity[0],hum); // update minimum temp
          range.humidity[1] = Math.max(range.humidity[1],hum); // update maximum temp
        }
      }
    }

    console.log(range);

    return range;
  }


  function drawBG(ctx,canvas) {
    ctx.fillStyle = backgroundColor();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
  }

  function drawDataPoint(ctx,x,y) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI, false); // background glow
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fill();
  }

  // draw temp labels (y axis)
  function drawTempLabels(ctx, canvas, minTemp, maxTemp, styles) {
    // // start with background gradient to obscure data behind the labels
    // let gradWidth = fontSize * 6;
    // let grd = ctx.createLinearGradient(0, 0, gradWidth, 0);
    // grd.addColorStop(.3, backgroundColor(.4));
    // grd.addColorStop(1, backgroundColor(0));
    // ctx.fillStyle = grd;
    // ctx.beginPath();
    // ctx.rect(0, 0, gradWidth, graphHeight);
    // ctx.fill();

    const tempRange = maxTemp - minTemp;

    const labelModulus = tempRange > 22 ? 10 : (tempRange > 9 ? 5 : 2); // range above 22, labels every 10, 10-22, labels every 5, 9 and under, labels every 2
    const longTickMod = tempRange > 27 ? 99999999 : (tempRange > 22 ? 5 : 99999999); // range above 27, we'll use small ticks every two, so no long ticks, range 23-27, long ticks every 5, 22 and below, no long ticks
    const shortTickMod = tempRange > 37 ? 5 : (tempRange > 27 ? 2 : 1); // range above 32, ticks only every 5, above 27, every 2, otherwise, every 1;


    const relFontSize = styles.fontSize;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = styles.color();
    ctx.font = `${relFontSize}px ${styles.font}`;
    // ctx.shadowColor = backgroundColor(1);
    // ctx.shadowBlur = 20;
    ctx.strokeStyle = styles.color();
    ctx.lineWidth = styles.tickWidth;
    for (let i=minTemp+1; i<maxTemp; i++) {
      let y = (1 - (i-minTemp)/tempRange) * graphHeight;
      // let textY = y + relFontSize/2.7; // stupid adjustment for crappy font baseline

      // for(let j=0; j<1; j++) { // the loop here is just to make the shadow darker
        if(i%labelModulus === 0) { // draw numeric label
          ctx.beginPath();
          ctx.moveTo(canvas.width, y);
          ctx.lineTo(canvas.width - styles.tickLength*1.5,y);
          ctx.stroke();

          // ctx.fillText('\u2013', 0 - relFontSize/9, y); // stupid fucking line because the em-dash is barely longer than the en-dash so we have to use two en-dashes instead
          // ctx.fillText('\u2013' + i + '°', relFontSize/2, y);

          ctx.fillText(`${i}°`, 0, y);

        } else if (i%longTickMod === 0) { // draw long tick
          ctx.beginPath();
          ctx.moveTo(canvas.width, y);
          ctx.lineTo(canvas.width - (styles.tickLength*2),y);
          ctx.stroke();
        } else if (i%shortTickMod === 0) { // draw short tick
          ctx.beginPath();
          ctx.moveTo(canvas.width, y);
          ctx.lineTo(canvas.width - styles.tickLength,y);
          ctx.stroke();

          // ctx.font = `${relFontSize}px ${tempFont1}`;
          // ctx.fillText('\u2013', 0, y);
        }
      // }
    }
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = 'rgba(0,0,0,0)';
  }

  // draw humidity labels (y axis)
  function drawHumLabels(ctx, canvas, minHum, maxHum, styles) {
    const humRange = maxHum - minHum;

    const labelModulus = humRange > 22 ? 10 : (humRange > 9 ? 5 : 2); // range above 22, labels every 10, 10-22, labels every 5, 9 and under, labels every 2
    const longTickMod = humRange > 27 ? 99999999 : (humRange > 22 ? 5 : 99999999); // range above 27, we'll use small ticks every two, so no long ticks, range 23-27, long ticks every 5, 22 and below, no long ticks
    const shortTickMod = humRange > 37 ? 5 : (humRange > 27 ? 2 : 1); // range above 32, ticks only every 5, above 27, every 2, otherwise, every 1;

    const relFontSize = styles.fontSize;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = styles.color();
    ctx.strokeStyle = styles.color();
    ctx.lineWidth = styles.tickWidth;
    for (let i=minHum+1; i<maxHum; i++) {
      ctx.font = `${relFontSize}px ${styles.font}`;

      let y = (1 - (i-minHum)/humRange) * graphHeight;
      if(i%labelModulus === 0) { // draw numeric label
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(styles.tickLength*1.5,y);
        ctx.stroke();

        ctx.fillText(`${i}`, styles.tickLength*1.6, y);

        const pctFontSize = relFontSize * .6
        ctx.font = `${pctFontSize}px ${font2}`;
        ctx.fillText(`%`, canvas.width - pctFontSize, y);
      } else if (i%longTickMod === 0) { // draw long tick
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(styles.tickLength*2,y);
        ctx.stroke();
      } else if (i%shortTickMod === 0) { // draw short tick
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(styles.tickLength,y);
        ctx.stroke();
      }
    }
    ctx.textBaseline = "alphabetic";
    ctx.shadowColor = 'rgba(0,0,0,0)';
  }


  // draw time labels (x axis)
  function drawTimeLabels(ctx,startTime,now,styles) {
    const timeRange = now - startTime;
    const hoursRange = timeRange / 1000 / 60 / 60
    const relFontSize = styles.fontSize;
    const y = relFontSize;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${relFontSize}px ${styles.font}`;
    ctx.strokeStyle = styles.color();
    ctx.lineWidth = styles.tickWidth;

    for (let i=startTime; i<now; i+=1000*60) {
      const time = new Date(i);
      const minutes = time.getMinutes();
      const hours = time.getHours();
      const displayTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
      const x = graphWidth * (i-startTime) / timeRange;

      if (minutes%60==0) {
        // there's probably a better/more general way to do this, but for now...
        // if hoursRange is greater than 'a', only display time every 'b' hours
        if (
          (hoursRange < 8) ||
          (hoursRange >= 8  && hoursRange < 15 && hours%2 == 0) ||
          (hoursRange >= 15  && hoursRange <= 24 && hours%4 == 0) ||
          (hoursRange > 24 && hours%12 == 0)
        ) {
          ctx.fillStyle = styles.color();
          ctx.fillText(displayTime, x, y);
        }

        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x,styles.tickLength*2);
        ctx.stroke();
      } else if (minutes%30 == 0 && hoursRange <= 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x,styles.tickLength);
        ctx.stroke();

        // ctx.fillStyle = styles.color();
        // ctx.fillText("·"/*"|"/*"⁞"*/, x, y);
      // // } else { // display dots for all other 30 minute intervals
      // //   ctx.fillStyle = fadeStyle;
      // //   ctx.font = `${relFontSize}px ${tempFont1}`;
      // //   ctx.fillText("·", x, y);
      }
    }
  }

  // draw thermostat threshold lines
  function drawThreshold(ctx, threshold, color, minVal, maxVal) {
    ctx.lineCap = "butt";

    const y = graphHeight * (1 - (threshold - minVal) / (maxVal - minVal));
    const lineWidth = fontSize/4;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.setLineDash([lineWidth*1.5,lineWidth*2]);

    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(graphWidth, y);
    ctx.stroke();

    ctx.setLineDash([]);
  }


  function drawSensorData(ctx, sensorData, startTime, timeRange, minTemp, maxTemp, minHum, maxHum) {
    // console.log("drawSensorData...");

    const tempColor = mainColor();
    const humColor = secondaryColor();

    const tempRange = maxTemp - minTemp;
    const humRange = maxHum - minHum;
    ctx.lineCap = "round";
    ctx.lineWidth = fontSize/4;
    let xLast, tempLast, humLast;
    // let events = {}; // store event information like "[turned A/C on]";
    for (const key in sensorData) {
      const timestamp = parseInt(key);

      // if this entry is within the time range of the graph (plus a 24 hour buffer so we catch all the data on the left edge)
      if (timestamp > startTime - (1000 * 60 * 60 * 24)) {
        let time = new Date(timestamp);
        time = `${time.getHours()}:${time.getMinutes()}`;
        // console.log(`Time: ${time}`);
        const x = graphWidth * (timestamp-startTime) / timeRange;
        const temp = graphHeight * (1 - (parseFloat(sensorData[key].temp) - minTemp) / tempRange);
        const hum = graphHeight * (1 - (parseFloat(sensorData[key].humidity) - minHum) / humRange);

        if (!isNaN(temp) && !isNaN(hum)) {
          // console.log(`x:${x}, tempY:${temp}, humY:${hum}`);

          // draw hum
          ctx.strokeStyle = humColor;
          ctx.beginPath();
          if (xLast && !isNaN(humLast)) {
            ctx.moveTo(xLast,humLast);
          }
          // drawDataPoint(ctx,x,y);
          ctx.lineTo(x, hum);
          ctx.stroke();
          humLast = hum;


          // draw temp
          ctx.strokeStyle = tempColor;
          ctx.beginPath();
          if (xLast && !isNaN(tempLast)) {
            ctx.moveTo(xLast,tempLast);
          }
          // drawDataPoint(ctx,x,y);
          ctx.lineTo(x, temp);
          ctx.stroke();
          tempLast = temp;

          xLast = x;


        } else {
          // events[key] = sensorData[key].label
        }
        // await sleep(200);
      }
    }

  }

  // draw events (such as the A/C turning on or off)
  function drawEvents(ctx, sensorData, startTime, timeRange) {
    // draw A/C events
    let onPoint;
    ctx.fillStyle = blueColorAC();
    for (const key in sensorData) {
      if (sensorData[key].label) {
        const label = sensorData[key].label;

        // if this event is turning the A/C off, and we've previously saved an onPoint
        if (onPoint && label.match(/TURNED A\/C off/i)) {
          // make rectangle
          const onX = graphWidth * (onPoint-startTime) / timeRange;
          const offX = graphWidth * (parseInt(key)-startTime) / timeRange;

          ctx.beginPath();
          ctx.rect(onX, 0, offX-onX, graphHeight);
          ctx.fill();

          // erase onPoint
          onPoint = null;
        } else if (label.match(/TURNED A\/C on/i)) {
          onPoint = parseInt(key);
        }
      }
    }

    // if we have an onPoint leftover, then that should mean the A/C is currently on,
    // so we want to draw that it's on up to the present
    if (onPoint) {
      const onX = graphWidth * (onPoint-startTime) / timeRange;
      const offX = graphWidth;
      ctx.beginPath();
      ctx.rect(onX, 0, offX-onX, graphHeight);
      ctx.fill();
    }
  }

  function drawCurrentValues(ctx,currentValues,styles) {
    ctx.textBaseline = "top";
    ctx.font = `${styles.fontSize}px ${styles.font}`;

    ctx.shadowColor = backgroundColor(1);
    ctx.shadowBlur = styles.fontSize / 2;

    for (let i=0; i<5; i++) { // just to make the shadows darker
      let y = styles.fontSize / 1.5;
      let x = styles.fontSize / 4;

      ctx.textAlign = "left";
      ctx.fillStyle = styles.tempColor(1);
      ctx.fillText(currentValues.temp_f + "°", x, y);

      x = graphWidth;
      ctx.textAlign = "right";
      ctx.fillStyle = styles.humColor(1);
      ctx.fillText(currentValues.humidity + "%", x, y);
    }

    ctx.shadowColor = 'transparent';
  }


  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function drawOverlay(ctx,canvas) {
    const lineWidth = 5;//canvas.width / 300;
    ctx.strokeStyle = 'rgba(0,50,0,.5)';
    ctx.lineWidth = lineWidth;


    for (let i=0; i<canvas.width; i+=lineWidth*2) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i,canvas.height);
      ctx.stroke();
    }
  }

})();
