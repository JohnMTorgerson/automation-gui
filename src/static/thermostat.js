// fetch data immediately on page load, and then at ten second intervals thereafter
fetchData();
setInterval(fetchData,10000);

const backgroundColor = (a) => `rgba(0,0,0,${isNaN(a) ? '1' : a})`;
const mainColor = (a) => `rgba(50,255,50,${isNaN(a) ? '1' : a})`;
const secondaryColor = (a) => `rgba(255,50,200,${isNaN(a) ? '.9' : a})`;
const blueColorAC = (a) => `rgba(100,100,255,${isNaN(a) ? '.3' : a})`;

// let numberFont = "Open24";//"Twobit";//"Orbitron";
// let bigNumberFont = "OdysseyHalf";
// let biggerNumberFont = "OdysseyGrad";
const font = "AdvancedDot";
const font1 = "MaximumSecurity";
const font2 = "Twobit";
const font3 = "Odyssey";

const fontSize = height / 20;
const graphWidth = width - (6*fontSize);//width/height * graphHeight;
const graphHeight = height - (3*fontSize);

// // draw overlay, a semi-transparent graphic that lies atop the rest of the screen
// drawOverlay();

//=================================================//


// dynamically load scene data from flask server
function fetchData() {
  console.log('fetching data');

  fetch('/thermostat_update')
  .then(async response => {
    if (response.ok) {
      let json = await response.json();

      updateData(json);
    } else {
      // do nothing and just wait until the next interval
      console.log(response.status)
    }
  }).catch(err => {
    console.error(err);
  });
}

async function updateData(data) {
  console.log(data);
  if (data.error) {
    document.getElementById('root').innerHTML = `Error fetching thermostat data: ${data.error}`;
    return;
  }

  // x values
  const hoursRange = 6;
  const timeRange = 1000 * 60 * 60 * hoursRange;
  const now = new Date();//1657390638260);
  const startTime = now - timeRange;

  // y values
  const maxTemp = 87
  const minTemp = 73
  const tempRange = maxTemp - minTemp;
  const maxHum = 41
  const minHum = 31
  const humRange = maxHum - minHum;


  // label styles
  const labelStyles = {
    "font" : font2,
    "fontSize" : fontSize * 1.5,
    "color" : mainColor,
    "tickWidth" : fontSize / 6,
    "tickLength" : fontSize / 3
  }



  // ====== DRAW GRAPH ====== //
  const graph = document.getElementById("graph");
  graph.width = graphWidth;
  graph.height = graphHeight;
  const graphCtx = graph.getContext("2d");

  // draw background
  drawBG(graphCtx,graph);

  // semi-transparent pixel effect
  drawOverlay(graphCtx,graph);

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
  tempLabels.width = (width - graphWidth) * 0.4;
  tempLabels.height = graphHeight;
  const tempCtx = tempLabels.getContext("2d");

  drawBG(tempCtx,tempLabels);

  // draw y axis labels
  drawTempLabels(tempCtx,tempLabels,minTemp,maxTemp,labelStyles);

  // ====== DRAW Y (HUMIDITY) LABELS ====== //

  const humLabels = document.getElementById("hum_labels");
  humLabels.width = (width - graphWidth) * 0.6;
  humLabels.height = graphHeight;
  const humCtx = humLabels.getContext("2d");

  drawBG(humCtx,humLabels);

  // draw y axis labels
  let humStyles = {...labelStyles};
  humStyles.color = secondaryColor;
  humStyles.font = font3;
  humStyles.fontSize = humStyles.fontSize * 1.1; // adjust since we're using a different font
  drawHumLabels(humCtx,humLabels,minHum,maxHum,humStyles);


  // ====== DRAW X LABELS ====== //

  const timeLabels = document.getElementById("time_labels");
  timeLabels.width = graphWidth;
  timeLabels.height = height - graphHeight;
  const timeCtx = timeLabels.getContext("2d");

  drawBG(timeCtx,timeLabels);

  // draw x axis labels
  drawTimeLabels(timeCtx,startTime,now,labelStyles);
}





// =================================================== //
// =================================================== //
// =================================================== //
// =================================================== //
// =================================================== //






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

  tempRange = maxTemp - minTemp;

  relFontSize = styles.fontSize;
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
      if(i%5 === 0) {
        ctx.beginPath();
        ctx.moveTo(canvas.width, y);
        ctx.lineTo(canvas.width - styles.tickLength*1.5,y);
        ctx.stroke();

        // ctx.fillText('\u2013', 0 - relFontSize/9, y); // stupid fucking line because the em-dash is barely longer than the en-dash so we have to use two en-dashes instead
        // ctx.fillText('\u2013' + i + '°', relFontSize/2, y);

        ctx.fillText(`${i}°`, 0, y);

      } else {
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
  humRange = maxHum - minHum;

  relFontSize = styles.fontSize;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = styles.color();
  ctx.strokeStyle = styles.color();
  ctx.lineWidth = styles.tickWidth;
  for (let i=minHum+1; i<maxHum; i++) {
    ctx.font = `${relFontSize}px ${styles.font}`;

    let y = (1 - (i-minHum)/humRange) * graphHeight;
    if(i%5 === 0) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(styles.tickLength*1.5,y);
      ctx.stroke();

      ctx.fillText(`${i}`, styles.tickLength*1.6, y);

      const pctFontSize = relFontSize * .6
      ctx.font = `${pctFontSize}px ${font2}`;
      ctx.fillText(`%`, canvas.width - pctFontSize, y);

    } else {
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
      ctx.fillStyle = styles.color();
      ctx.fillText(displayTime, x, y);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x,styles.tickLength*2);
      ctx.stroke();
    } else if (minutes%30 == 0) { // display vertical bar for odd hours
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

function drawSensorData(ctx, sensorData, startTime, timeRange, minTemp, maxTemp, minHum, maxHum) {
  const tempColor = mainColor();
  const humColor = secondaryColor();

  const tempRange = maxTemp - minTemp;
  const humRange = maxHum - minHum;
  ctx.lineCap = "round";
  ctx.lineWidth = fontSize/4;
  let xLast, tempLast, humLast;
  let events = {}; // store event information like "[turned A/C on]";
  for (const key in sensorData) {
    timestamp = parseInt(key);

    // if this entry is within the time range of the graph (plus a 2 hour buffer so we catch all the data on the edge)
    if (timestamp > startTime - (1000 * 60 * 60 * 2)) {
      let time = new Date(timestamp);
      time = `${time.getHours()}:${time.getMinutes()}`;
      console.log(`Time: ${time}`);
      const x = graphWidth * (timestamp-startTime) / timeRange;
      const temp = graphHeight * (1 - (parseFloat(sensorData[key].temp) - minTemp) / tempRange);
      const hum = graphHeight * (1 - (parseFloat(sensorData[key].humidity) - minHum) / humRange);

      if (!isNaN(temp) && !isNaN(hum)) {
        console.log(`x:${x}, tempY:${temp}, humY:${hum}`);

        // draw hum
        ctx.strokeStyle = humColor;
        ctx.beginPath();
        if (xLast && humLast) {
          ctx.moveTo(xLast,humLast);
        }
        // drawDataPoint(ctx,x,y);
        ctx.lineTo(x, hum);
        ctx.stroke();
        humLast = hum;


        // draw temp
        ctx.strokeStyle = tempColor;
        ctx.beginPath();
        if (xLast && tempLast) {
          ctx.moveTo(xLast,tempLast);
        }
        // drawDataPoint(ctx,x,y);
        ctx.lineTo(x, temp);
        ctx.stroke();
        tempLast = temp;

        xLast = x;


      } else {
        events[key] = sensorData[key].label
      }
      // await sleep(200);
    }
  }

  console.log(events);

  // draw A/C events
  let onPoint;
  ctx.fillStyle = blueColorAC();
  for (const key in events) {
    console.log(events[key]);
    const label = events[key];

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function drawOverlay(ctx,canvas) {
  const lineWidth = 5;//canvas.width / 300;
  ctx.strokeStyle = 'rgba(0,50,0,.5)';
  ctx.lineWidth = lineWidth;


  for (i=0; i<canvas.width; i+=lineWidth*2) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i,canvas.height);
    ctx.stroke();
  }
}
