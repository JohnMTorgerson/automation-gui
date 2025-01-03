import ThermControls from './ThermControls.mjs';

(function main() {

  // =================== set some styling variables =================== //

  const backgroundColor = (a) => `rgba(0,0,0,${isNaN(a) ? '1' : a})`;
  const mainColor = (a) => `rgba(50,255,50,${isNaN(a) ? '1' : a})`; // green
  const secondaryColor = (a) => `rgba(255,50,200,${isNaN(a) ? '.9' : a})`; // magenta
  const tertiaryColor = (a) => `rgba(255,220,50,${isNaN(a) ? '1' : a})`; // yellow
  const quaternaryColor = (a) => `rgba(200,50,255,${isNaN(a) ? '1' : a})`; // purple
  const blueColorAC = (a) => `rgba(100,100,255,${isNaN(a) ? '.45' : a})`;

  // let numberFont = "Open24";//"Twobit";//"Orbitron";
  // let bigNumberFont = "OdysseyHalf";
  // let biggerNumberFont = "OdysseyGrad";
  const font = "AdvancedDot";
  // const font1 = "MaximumSecurity";
  const font2 = "Twobit";
  const font3 = "Odyssey";
  // const font4 = "DeadCRT";
  const font5 = "WarGames";

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
  const weatherStyles = {
    "font" : font2,
    "fontSize" : fontSize * 2.5,
    "tempColor" : mainColor,
    "humColor" : secondaryColor
  }
  
  // set sizes
  setElementSizes();

  // create controls pane object (must be called after setElementSizes to set itself up to fit properly)
  const thermCtrls = new ThermControls();

  // // draw overlay, a semi-transparent graphic that lies atop the rest of the screen
  // drawOverlay();



  //=================================================//


  // dynamically load scene data from flask server
  window.fetchAndSaveData = async function (changed) {
    // first, if a change was made (e.g. the user changed the temp threshold through the UI)
    // since the server was last polled, we need to update the server with the changes
    // before getting updated data from it
    if (changed) {
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
    }


    // then load data and settings from server
    console.log('fetching data from server');
    fetch('/thermostat_update')
    .then(async response => {
      if (response.ok) {
        let data = await response.json();

        if (!data.hasOwnProperty("error")) {
          updateData(data);
        } else {
          console.log(`Unable to retrieve data from file, waiting till next update cycle`);
        }

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

    const currentValues = document.getElementById("current_values");
    currentValues.style.width = graphWidth - labelStyles.tickWidth*2 + 'px';
    currentValues.style.height = graphHeight - labelStyles.tickWidth*2 + 'px';
    currentValues.style.left = tempLabels.width + labelStyles.tickWidth + 'px';
    currentValues.style.top = labelStyles.tickWidth + 'px';
    // currentValues.style.borderWidth = labelStyles.tickWidth + 'px';
    // currentValues.style.borderColor = 'transparent';//mainColor();
  }

  // async function updateData(data) {
  window.updateData = async function (data) {
    // console.log("Updating...");
    // console.log(data);
    if (data.error) {
      document.getElementById('root').innerHTML = `Error fetching thermostat data: ${data.error}`;
      return;
    }

    // add separate humidity settings to the ''data'' object,
    // so that we can access it without knowing or caring if it's
    // using relative or absolute humidity
    let abs = data.settings.use_abs_humidity;
    data.hum = {
      abs: abs,
      max: abs ? data.settings.abs_hum_max : data.settings.rel_hum_max,
      min: abs ? data.settings.abs_hum_min : data.settings.rel_hum_min,
      hyst: abs ? data.settings.abs_hum_hyst : data.settings.rel_hum_hyst,
      units: abs ? "g/m³" : "%",
      incr_amt: abs ? .1 : 1,
      decr_amt: abs ? -.1 : -1,
      str: abs ? 'abs' : 'rel'
    }

    // console.log(JSON.stringify(data.current));

    // update thresholds on control screen
    thermCtrls.updateCtrls(data);

    // ----- x values -----
    const hoursRange = 12;
    const timeRange = 1000 * 60 * 60 * hoursRange;
    const now = new Date();//1658602343136);//1657390638260);
    const startTime = now - timeRange;

    // ----- y values -----
    // set extremum values, to be adjusted below
    let minTempExtreme = 1000;
    let maxTempExtreme = -1000;
    let minHumExtreme = 101;
    let maxHumExtreme = -1;
    let minTemp = minTempExtreme;
    let maxTemp = maxTempExtreme;
    let minHum = minHumExtreme;
    let maxHum = maxHumExtreme;


    // // if the thermostat is on, set the initial range based on the thermostat settings for temp and humidity
    // if (data.settings.on) {
    //   maxTemp = data.settings.temp_target + 3;//81;
    //   minTemp = data.settings.temp_target - data.settings.temp_hyst - 3;//74;
    //   maxHum = data.hum.max + (data.hum.abs ? 0.5 : 3);//41;
    //   minHum = data.hum.max - data.hum.hyst - (data.hum.abs ? 0.5 : 3);//34;
    // }

    // then expand the ranges as needed based on the values that appear in the data in our time range
    let tempRange = findValuesRangeInTimeRange(data.logged_sensor, "temp", startTime);
    minTemp = Math.min(minTemp, Math.floor(tempRange.min-2));
    maxTemp = Math.max(maxTemp, Math.ceil(tempRange.max+3));
    let humRange = findValuesRangeInTimeRange(data.logged_sensor, `${data.hum.str}_hum`, startTime);
    minHum = Math.min(minHum, Math.floor(humRange.min-1));
    maxHum = Math.max(maxHum, Math.ceil(humRange.max+2));

    // then expand again as needed based on weather data
    // if we're showing the weather data on the graph
    if (data.settings.show_weather_temp_graph) {
      tempRange = findValuesRangeInTimeRange(data.logged_weather, "Temperature (degrees F)", startTime);
      minTemp = Math.min(minTemp, Math.floor(tempRange.min-1));
      maxTemp = Math.max(maxTemp, Math.ceil(tempRange.max+2));
    }
    if (data.settings.show_weather_hum_graph) {
      humRange = findValuesRangeInTimeRange(data.logged_weather, "Relative Humidity (%)", startTime);
      minHum = Math.min(minHum, Math.floor(humRange.min-1));
      maxHum = Math.max(maxHum, Math.ceil(humRange.max+2));
    }

    // set defaults in case there is no data at all
    if (minTemp === minTempExtreme) minTemp = 68;
    if (maxTemp === maxTempExtreme) maxTemp = 82;
    if (minHum === minHumExtreme) minHum = data.hum.abs ? 5 : 38;
    if (maxHum === maxHumExtreme) maxHum = data.hum.abs ? 15 : 52;

    // then save the adjusted ranges
    tempRange = maxTemp - minTemp;
    humRange = maxHum - minHum;


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
    // if (data.settings.on) {
      // drawThreshold(graphCtx,data.settings.hum_max,currentValueStyles.humColor(0.7),minHum,maxHum);
      // drawThreshold(graphCtx,data.settings.temp_target,currentValueStyles.tempColor(0.6),minTemp,maxTemp);
      drawThresholdLines(graphCtx, data.logged_sensor, `${data.hum.str}_hum_max`, currentValueStyles.humColor(0.7), minHum, maxHum, startTime, timeRange);
      drawThresholdLines(graphCtx, data.logged_sensor, "temp_target", currentValueStyles.tempColor(0.6), minTemp, maxTemp, startTime, timeRange);
    // }

    // only show weather data if the setting is set to true
    if (data.settings.show_weather_temp_graph) {
      drawWeatherData("temp",graphCtx,data.settings,data.logged_weather,startTime,timeRange,minTemp,maxTemp)
    }
    if (data.settings.show_weather_hum_graph) {
      drawWeatherData("hum",graphCtx,data.settings,data.logged_weather,startTime,timeRange,minHum,maxHum)
    }

    // show current weather values (if settings call for it)
    updateWeatherValues(data.logged_weather,data.settings)

    // draw sensor data
    drawSensorData(graphCtx,data.logged_sensor,data.hum,startTime,timeRange,minTemp,maxTemp,minHum,maxHum);

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
    drawHumLabels(humCtx,humLabels,minHum,maxHum,humStyles,data.hum);


    // ====== DRAW X LABELS ====== //

    const timeLabels = document.getElementById("time_labels");
    const timeCtx = timeLabels.getContext("2d");

    drawBG(timeCtx,timeLabels);

    // draw x axis labels
    drawTimeLabels(timeCtx,startTime,now,labelStyles);

    // ====== DRAW CURRENT VALUE LABELS ====== //
    // drawCurrentValues(graphCtx,data.current,currentValueStyles); // to draw them on the canvas
    updateCurrentValues(data.current,data.hum); // new approach: using an HTML element on top of the canvas

    // const outdoorValuesEl = document.querySelector("#current_values > .outdoor");
    // if (data.settings.show_weather_values) {
    //   // drawWeatherValues(graphCtx,data.settings,data.logged_weather,weatherStyles,currentValueStyles.fontSize);
    //   updateWeatherValues(data.logged_weather,data.settings);
    //   outdoorValuesEl.style.visibility = "visible";
    // } else {
    //   outdoorValuesEl.style.visibility = "hidden";
    // }
  }





  // =================================================== //
  // =================================================== //
  // =================================================== //
  // =================================================== //
  // =================================================== //



  function findValuesRangeInTimeRange(data_log, key, startTime) {
    const range = {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY
    };

    let foundOne = false;
    for (const timestring in data_log) {
      const timestamp = parseInt(timestring);

      // if this entry is within the time range of the graph
      if (timestamp > startTime) {
        foundOne = true;
        const value = parseFloat(data_log[timestring][key]);

        if (!isNaN(value)) {
          range.min = Math.min(range.min,value); // update minimum temp
          range.max = Math.max(range.max,value); // update maximum temp
        }
      }
    }

    // // if there were no values found in the time range, return some default values
    // // these will only be relevant to determine the y axis view field if there is no data present and the thermostat is off;
    // // otherwise, the sensor data and the threshold values will determine the view field
    // if (!foundOne) {
    //   range.min = 30;
    //   range.max = 80;
    // }

    // console.log(range);

    return range;
  }


  function drawBG(ctx,canvas) {
    ctx.fillStyle = backgroundColor();
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fill();
  }

  // function drawDataPoint(ctx,x,y) {
  //   ctx.beginPath();
  //   ctx.arc(x, y, 2, 0, 2 * Math.PI, false); // background glow
  //   ctx.fillStyle = "rgba(0,0,0,1)";
  //   ctx.fill();
  // }

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
  function drawHumLabels(ctx, canvas, minHum, maxHum, styles, humSettings) {
    var units = humSettings.units;
    if (humSettings.abs) {
      units = "g/m3"; // can't use cubed character because font doesn't support it
    }

    const humRange = maxHum - minHum;

    const labelModulus = humRange > 22 ? 10 : (humRange > 10 ? 5 : (humRange > 4 ? 2 : 1)); // range above 22, labels every 10, 11-22, labels every 5, 5-10, labels every 2, 4 and under, every 1
    const longTickMod = humRange > 27 ? 99999999 : (humRange > 22 ? 5 : 99999999); // range above 27, we'll use small ticks every two, so no long ticks, range 23-27, long ticks every 5, 22 and below, no long ticks
    const shortTickMod = humRange > 37 ? 5 : (humRange > 27 ? 2 : (humRange > 10 ? 1 : 0.5)); // range above 32, ticks only every 5, above 27, every 2, above 10, every 1, 10 and below, every 0.5; (non-integer values don't work as is, would have to re-do loop)

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

        const unitFontSize = humSettings.abs ? relFontSize * .4 : relFontSize * .6;
        ctx.font = `${unitFontSize}px ${font2}`;
        ctx.fillText(units, canvas.width - (relFontSize * .9), y);
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

  function drawThresholdLines(ctx, dataLog, param, color, minVal, maxVal, startTime, timeRange) {
    let y, val, onPoint;
    let date;
    ctx.lineCap = "butt";

    for (const timeStr in dataLog) {
      if (dataLog[timeStr].label) {
        const label = dataLog[timeStr].label;
        date = new Date(parseInt(timeStr));

        // if this event is turning the thermostat off, and we've previously saved an onPoint
        if (onPoint && label.match(/SET on to False/i)) {
          // console.log(`${date} :: SET on to False`);

          // end current threshold line
          endLine(timeStr);

          // erase onPoint
          onPoint = null;
        }
        // if this event is turning the thermostat on
        else if (label.match(/SET on to True/i)) {
          // console.log(`${date} :: SET on to True`);
          
          // save new onPoint
          onPoint = parseInt(timeStr);

          // and start new threshold line
          startLine(timeStr);
          
        }
        // if this line sets a new threshold value
        else {
          let re = /\[SET (\w+) to ([0-9\.]+)\]/i;
          let m = label.match(re);
          // if (Array.isArray(m)) {
          //   console.log(`${date} :: ${m.toString()}`);
          // }
          if (Array.isArray(m) && m.length === 3 && ['temp_target','rel_hum_max','abs_hum_max'].includes(m[1])) {
            var entryParam = m[1];
            val = m[2]; // set new value (val is at the function scope)

            // if the param change is for the param we're currently drawing
            // and the thermostat was on at this point
            if (entryParam === param && onPoint) {
              // console.log(`${date} :: ${m.toString()}`);
              // end the current line and start a new one
              endLine(timeStr);
              startLine(timeStr);
            }
          }
        } // end if-chain asking what this label is for
      } // end if this line is a label
    } // end for loop

    // end current line at the right end of the graph
    if (onPoint) {
      endLine(startTime + timeRange);
    }

    ctx.setLineDash([]);

    function startLine(timeStr) {
      // console.log(`- - - - - - - starting new line at ${val} on ${date}`);
      let timestamp = parseInt(timeStr);

      y = graphHeight * (1 - (val - minVal) / (maxVal - minVal));
      const x = graphWidth * (timestamp-startTime) / timeRange;

      const lineWidth = fontSize/4;
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash([lineWidth*1.5,lineWidth*2]);
  
      ctx.beginPath();
      ctx.moveTo(x,y);
    }

    function endLine(timeStr) {
      // console.log(`- - - - - - - - ending old line at ${(1 - y/graphHeight)*(maxVal-minVal) + minVal} on ${date}`);
      let timestamp = parseInt(timeStr);

      const x = graphWidth * (timestamp-startTime) / timeRange;

      // console.log(`ending line at x == ${x}`);

      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }


  function drawSensorData(ctx, sensorData, humSettings, startTime, timeRange, minTemp, maxTemp, minHum, maxHum) {
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
        const hum = graphHeight * (1 - (parseFloat(sensorData[key][humSettings.abs?"abs_hum":"rel_hum"]) - minHum) / humRange);

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

  function drawWeatherData(dataKind, ctx, settings, weatherData, startTime, timeRange, min, max) {
    // console.log("drawSensorData...");
    const lineWidth = fontSize/4;
    ctx.setLineDash([0,lineWidth*2]);
    ctx.lineCap = "round";
    ctx.lineWidth = lineWidth;

    let color, dataLabel;
    switch(dataKind) {
      case "temp":
        color = mainColor(.5);
        dataLabel = "Temperature (degrees F)";
        break;
      case "hum":
        color = secondaryColor(.55);
        dataLabel = "Relative Humidity (%)";
        break;
    }

    const range = max - min;
    let xLast, yLast;
    // let events = {}; // store event information like "[turned A/C on]";
    for (const key in weatherData) {
      const timestamp = parseInt(key);

      // if this entry is within the time range of the graph (plus a 24 hour buffer so we catch all the data on the left edge)
      if (timestamp > startTime - (1000 * 60 * 60 * 24)) {
        // let time = new Date(timestamp);
        // time = `${time.getHours()}:${time.getMinutes()}`;
        // console.log(`Time: ${time}`);
        const x = graphWidth * (timestamp-startTime) / timeRange;
        const value = parseFloat(weatherData[key][dataLabel])
        const y = graphHeight * (1 - (value - min) / range);

        if (!isNaN(y)) {
          // console.log(`x:${x}, tempY:${temp}, humY:${hum}`);

          // draw hum
          ctx.strokeStyle = color;
          ctx.beginPath();
          if (xLast && !isNaN(yLast)) {
            ctx.moveTo(xLast,yLast);
          }
          // drawDataPoint(ctx,x,y);
          ctx.lineTo(x, y);
          ctx.stroke();
          yLast = y;

          xLast = x;

        } else {
          // events[key] = sensorData[key].label
        }
        // await sleep(200);
      }
    }

    ctx.setLineDash([]);

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

  // function drawCurrentValues(ctx,currentValues,styles) {
  //   // console.log(styles.fontSize);
  //   ctx.textBaseline = "top";

  //   for (let i=0; i<5; i++) { // just to make the shadows darker
  //     ctx.font = `${styles.fontSize}px ${styles.font}`;
  //     ctx.shadowColor = backgroundColor(1);
  //     ctx.shadowBlur = styles.fontSize / 2;

  //     let y = styles.fontSize / 1.5;
  //     let x = styles.fontSize / 4;

  //     // draw temp
  //     // console.log(`x=${x}, y=${y}`);
  //     ctx.textAlign = "left";
  //     ctx.fillStyle = styles.tempColor(1);
  //     ctx.fillText(currentValues.temp_f + "°", x, y);

  //     // draw humidity
  //     x = graphWidth;
  //     // console.log(`x=${x}, y=${y}`);
  //     ctx.textAlign = "right";
  //     ctx.fillStyle = styles.humColor(1);
  //     ctx.fillText(currentValues.rel_hum + "%", x, y);

  //     // draw other smaller temp (in other scale)
  //     y += styles.fontSize * 1.3;
  //     x = styles.fontSize / 4;
  //     // console.log(`x=${x}, y=${y}`);
  //     ctx.textAlign = "left";
  //     ctx.fillStyle = styles.tempColor(.7);
  //     ctx.font = `${styles.fontSize * .7}px ${styles.font}`;
  //     ctx.fillText(currentValues.temp_c + "°", x, y);
  //   }

  //   ctx.shadowColor = 'transparent';
  // }

  function updateCurrentValues(currentValues,humSettings) {
    document.querySelector("#current_values .indoor .temp.mainunits").innerHTML = currentValues.temp_f + "°";
    document.querySelector("#current_values .indoor .temp.altunits").innerHTML = currentValues.temp_c + "°";
    document.querySelector("#current_values .indoor .hum.mainunits").innerHTML = currentValues[humSettings.abs ? "abs_hum" : "rel_hum"] + (humSettings.abs ? `<span class="units_small">${humSettings.units}</span>` : humSettings.units);
    document.querySelector("#current_values .indoor .hum.altunits").innerHTML = currentValues[humSettings.abs ? "rel_hum" : "abs_hum"] + (humSettings.abs ? '%' : `<span class="units_small">${humSettings.units}</span>`);
  }


  function drawWeatherValues(ctx,settings,weatherData,styles,currentValuesFontSize) {
    // 
    // console.log(`w${currentValuesFontSize}`);
    // first, find the most recent values

    const timestamp = Object.keys(weatherData).sort((a,b)=>parseInt(a)<parseInt(b)?1:parseInt(a)>parseInt(b)?-1:0)[0];
    const temp = Math.round(parseFloat(weatherData[timestamp]["Temperature (degrees F)"]));
    const hum = weatherData[timestamp]["Relative Humidity (%)"];

    const time = new Date(parseInt(timestamp));
    const delta = Date.now() - time;
    let ago = timeAgoStr(delta);


    ctx.textBaseline = "top";
    ctx.font = `${styles.fontSize}px ${styles.font}`;

    ctx.shadowColor = backgroundColor(1);
    ctx.shadowBlur = styles.fontSize / 3;

    const numLayers = 3;
    const alpha = 1;//0.9 / numLayers;
    for (let i=0; i<numLayers; i++) { // just to make the shadows darker
      // let y = styles.fontSize * .15;
      let y = graphHeight - styles.fontSize;
      // let x = currentValuesFontSize * 2.8;
      let x = 10;

      if (settings.show_weather_temp) {
        ctx.textAlign = "left";
        ctx.font = `${styles.fontSize}px ${styles.font}`;
        ctx.fillStyle = styles.tempColor(alpha);
        ctx.fillText(`${temp}°`, x, y);

        ctx.font = `${styles.fontSize/2}px ${font5}`;
        ctx.fillStyle = styles.tempColor(alpha);
        ctx.fillText(`(${ago})`, x + 70/**1.5*/, graphHeight - styles.fontSize/2 - 5/**1.8*/);
      }

      if (settings.show_weather_hum) {
        x = graphWidth - x;// * 1.02;
        ctx.textAlign = "right";
        ctx.font = `${styles.fontSize}px ${styles.font}`;
        ctx.fillStyle = styles.humColor(alpha);
        ctx.fillText(`${hum}%`, x, y);
      }

    }

    ctx.shadowColor = 'transparent';
  }

  function updateWeatherValues(weatherData,settings) {
    const timestamp = Object.keys(weatherData).sort((a,b)=>parseInt(a)<parseInt(b)?1:parseInt(a)>parseInt(b)?-1:0)[0];
    const temp = Math.round(parseFloat(weatherData[timestamp]["Temperature (degrees F)"]));
    const hum = weatherData[timestamp]["Relative Humidity (%)"];

    const time = new Date(parseInt(timestamp));
    const delta = Date.now() - time;
    let ago = timeAgoStr(delta);

    const temp_value_el = document.querySelector("#current_values .outdoor > .temp");
    const hum_value_el = document.querySelector("#current_values .outdoor > .hum");


    if (settings.show_weather_temp_value) {
      document.querySelector("#current_values .outdoor .temp .temp").innerHTML = temp + "°";
      document.querySelector("#current_values .outdoor .temp .time_since_current").innerHTML = `(${ago})`;
      temp_value_el.style.visibility = "visible";
    } else {
      temp_value_el.style.visibility = "hidden";
    }
    if (settings.show_weather_hum_value) {
      document.querySelector("#current_values .outdoor .hum .hum").innerHTML = hum + '%';
      hum_value_el.style.visibility = "visible";
    } else {
      hum_value_el.style.visibility = "hidden";
    }
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

  function timeAgoStr(delta) {
    let ago = delta / 1000;
    if (ago < 60) return `${Math.round(ago)}s`;
    ago /= 60;
    if (ago < 60) return `${Math.round(ago)}m`;
    ago /= 60;
    if (ago < 48) return `${Math.round(ago*10)/10}h`;
    ago /= 24;
    return `${Math.round(ago*10)/10}d`;
  }

  // =========================================== //

  // fetch data and save any data changes immediately on page load, and then at ten second intervals thereafter
  fetchAndSaveData();
  setTimeout(fetchAndSaveData,500); // annoying, but fonts used in the canvas may not be loaded on first draw; do this so we don't have to wait the full 10 seconds for the next update
  setInterval(fetchAndSaveData,10000);
  

})();

