import SunlightControls from './SunlightControls.mjs';

const sunCtrls = new SunlightControls();

// get time from remote source
var worldTime = null; // will be used to contain current time from online source
var timeInterval;
getWorldTime();
setInterval(getWorldTime,300000); // recheck time once every five minutes

// fetch data and save any data changes immediately on page load, and then at ten second intervals thereafter
fetchAndSaveData();
setInterval(fetchAndSaveData,10000);



//=================================================//


// dynamically load scene data from flask server
async function fetchAndSaveData() {
    // first, if a change was made (e.g. the user changed the temp threshold through the UI)
  // since the server was last polled, we need to update the server with the changes
  // before getting updated data from it
  if (sunCtrls.changed) {
    console.log("control change occurred, sending to server to save to file...")

    // send update to server to save to file
    const fetchRequest = {
      cache: "no-cache",
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sunCtrls.data["settings"])
    }

    let response = await fetch('/sunlight_control',fetchRequest);
    if (response.ok) {
      console.log("...sent to server");
    } else {
      console.log(response.status)
    }

    // change the flag back to false
    sunCtrls.changed = false;
  }


  console.log('fetching data');

  fetch('/sunlight_update')
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

window.updateData = async function (data) {
  // update data on control screen
  sunCtrls.updateCtrls(data);


  // options
  let fontSize = height / 20; // set main fontSize for text labels
  let font = "Helvetica";
  let numberFont = "WarGames";//"Open24";//"Twobit";//"Orbitron";
  let bigNumberFont = "OdysseyHalf";
  let biggerNumberFont = "OdysseyGrad";
  let tempFont = "Twobit";
  let tempFont1 = "WarGames";

  let now = worldTime;
  if (!(now instanceof Date) || isNaN(now)) {
    now = new Date(); // use system time if worldTIme is unavailable
    console.log('worldTime not available/not yet fetched, using system time');
  }
  let midnight = new Date(now);
  midnight = midnight.setHours(0,0,0,0);


  let c = document.getElementById("sunlight_canvas");
  let ctx = c.getContext("2d");

  // erase canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // draw background gradient
  for (let row=0; row<colors.length; row++) {
    let hexStr = colors[row];
    let rgbStr = hexStr.replace('#','').replace(/([0-9A-Fa-f]{2})/g,m => parseInt(m,16) + ',');
    let alpha = Math.floor(row/5)%2 === 0 ? '1' : '.7'; // alternate the alpha every so many rows to mimic a CRT screen

    ctx.beginPath();
    ctx.moveTo(0, row);
    ctx.lineTo(width, row);
    ctx.lineWidth = 2; // a line width of greater than one ensures full saturation (width of 1 looks washed out, presumably due to anti-aliasing effects)
    ctx.strokeStyle = `rgba(${rgbStr}${alpha})`;
    ctx.stroke();
  }


  // draw temperature curve
  let x, y;
  let lineWidth = 10;
  // let strokeStyle = "rgba(0,0,0,.25)";
  let strokeStyle = "rgba(0,255,0,1)";

  ctx.beginPath();
  for (let [time, values] of Object.entries(data["sunlight_curve"])) {
    let temp = values[0];
    x = time / (24 * 60 * 60) * width;
    y = height - ( (temp - warmest) / (coldest - warmest) * height );
    ctx.lineTo(x, y);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  ctx.lineTo(width, y);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // draw sunrise and sunset shading
  let gradWidth = width/30; // width of gradient
  let sunriseX = data["suntimes"][0] / (24 * 60 * 60) * width;
  let sunsetX = data["suntimes"][1] / (24 * 60 * 60) * width;
  let sunriseWidth = sunriseX + gradWidth/2; // add half the width of the gradient so it's centered on the sunrise/sunset
  let sunsetWidth = width - sunsetX + gradWidth/2; // add half the width of the gradient so it's centered on the sunrise/sunset
  let shade = 'rgba(0,0,120,.55)';
  let noShade = 'rgba(0,0,120,0)';
  let sunrise_grd = ctx.createLinearGradient(0, 0, sunriseWidth, 0);
  sunrise_grd.addColorStop(Math.max(sunriseWidth - gradWidth,0) / (sunriseWidth || 1), shade); // the 'or one' is just in case sunriseWidth is 0, in which case the numerator will also be 0, and we want the whole expression to be 0 rather than infinity or whatever
  sunrise_grd.addColorStop(1, noShade);
  let sunset_grd = ctx.createLinearGradient(width - sunsetWidth, 0, width, 0);
  sunset_grd.addColorStop(0, noShade);
  sunset_grd.addColorStop(Math.min(gradWidth / sunsetWidth,1), shade);
  ctx.fillStyle = sunrise_grd; // sunrise shading
  ctx.fillRect(0, 0, sunriseWidth, height); // sunrise shading
  ctx.fillStyle = sunset_grd; // sunrise shading
  ctx.fillRect(width - sunsetWidth, 0, sunsetWidth, height); // sunrise shading


  // draw sunrise/sunset markers
  let relFontSize = fontSize * 1.7;
  let srTimeStr = new Date(data["suntimes"][0]*1000 + midnight);
  srTimeStr = `${srTimeStr.getHours()}:${srTimeStr.getMinutes().toString().replace(/.*/,(m) => m < 10 ? '0' + m : m)}`;
  let ssTimeStr = new Date(data["suntimes"][1]*1000 + midnight);
  ssTimeStr = `${ssTimeStr.getHours()}:${ssTimeStr.getMinutes().toString().replace(/.*/,(m) => m < 10 ? '0' + m : m)}`;
  ctx.lineWidth = relFontSize / 6;
  let markerColor = "rgba(215,215,255,.8)"
  let textColor = "rgba(255,255,255,1)"
  let glowColor = 'rgba(255,150,255,.3)';//'rgba(150,255,150,.45)';
  let darkGlowColor = 'rgba(255,150,255,.2)';//'rgba(0,50,0,.13)';
  let markerHeight = data["current_temp"] > 4500 ? height - relFontSize : relFontSize;
  ctx.beginPath();
  // ctx.moveTo(sunriseX, markerHeight);
  // ctx.lineTo(sunriseX, height);
  // ctx.stroke();
  // ctx.beginPath();
  // ctx.moveTo(sunsetX, markerHeight);
  // ctx.lineTo(sunsetX, height);
  // ctx.stroke();
  ctx.font = `${relFontSize}px ${numberFont}`;
  ctx.textAlign = "center";
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = relFontSize/10;
  ctx.strokeText(`${srTimeStr}`, sunriseX, markerHeight);// - relFontSize/4.5);
  ctx.strokeText(`${ssTimeStr}`, sunsetX, markerHeight);// - relFontSize/4.5);
  ctx.strokeStyle = darkGlowColor;
  ctx.lineWidth = relFontSize/4;
  ctx.strokeText(`${srTimeStr}`, sunriseX, markerHeight);// - relFontSize/4.5);
  ctx.strokeText(`${ssTimeStr}`, sunsetX, markerHeight);// - relFontSize/4.5);
  ctx.fillStyle = darkGlowColor;
  ctx.fillText(`${srTimeStr}`, sunriseX + relFontSize/1.5, markerHeight);// - relFontSize/10);// - relFontSize/4.5);
  ctx.fillStyle = textColor;
  ctx.fillText(`${srTimeStr}`, sunriseX, markerHeight);// - relFontSize/4.5);
  ctx.fillText(`${ssTimeStr}`, sunsetX, markerHeight);// - relFontSize/4.5);
  ctx.fillStyle = glowColor;
  ctx.fillText(`${ssTimeStr}`, sunsetX - relFontSize/1.5, markerHeight);// - relFontSize/4.5);
  ctx.fillText(`${srTimeStr}`, sunriseX - relFontSize/5, markerHeight);// - relFontSize/10);// - relFontSize/4.5);



  // draw time labels (x axis)
  relFontSize = fontSize * 1.5;
  y = height - relFontSize/2;
  for (let i=1; i<24; i+=0.5) {
    let x = i * width / 24;
    let mainStyle = x < sunriseX || x > sunsetX ? "rgba(250,230,200,1)" : "rgba(0,0,0,.9)";
    let fadeStyle = x < sunriseX || x > sunsetX ? "rgba(250,230,200,.4)" : "rgba(0,0,0,.4)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (i%2==0) { // display even hours
      ctx.fillStyle = mainStyle;
      ctx.font = `${relFontSize}px ${tempFont1}`;
      ctx.fillText(i, x, y);
    } else if (i%1 == 0) { // display vertical bar for odd hours
      ctx.fillStyle = mainStyle;
      ctx.font = `${relFontSize}px ${tempFont1}`;
      ctx.fillText("·"/*"|"/*"⁞"*/, x, y);
    // } else { // display dots for all other 30 minute intervals
    //   ctx.fillStyle = fadeStyle;
    //   ctx.font = `${relFontSize}px ${tempFont1}`;
    //   ctx.fillText("·", x, y);
    }
  }

  // draw temp labels (y axis)
  relFontSize = fontSize * 1.7;
  let mainStyle = "rgba(250,230,200,1)";
  let fadeStyle = "rgba(250,230,200,.4)";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = mainStyle;
  ctx.font = `${relFontSize}px ${tempFont1}`;
  for (let i=Math.ceil(warmest/1000)*1000 + 100; i<coldest; i+=100) {
    let y = (1-(i-warmest)/(coldest-warmest)) * height;
    // y = y + relFontSize/2.7; // stupid adjustment for crappy font baseline

    if(i%1000 === 0) {
      // ctx.beginPath();
      // ctx.moveTo(0, y);
      // ctx.lineTo(width, y);
      // ctx.lineWidth = 2; // a line width of greater than one ensures full saturation (width of 1 looks washed out, presumably due to anti-aliasing effects)
      // ctx.strokeStyle = `red`;
      // ctx.stroke();

      // ctx.fillText('\u2013', 0 - relFontSize/9, y); // stupid fucking line because the em-dash is barely longer than the en-dash so we have to use two en-dashes instead
      ctx.fillText(`\u2014${i}K`, 0, y);
    } else if (i%500 === 0) {
      ctx.fillText('\u2014', 0, y);
    } else {
      // ctx.font = `${relFontSize}px ${tempFont1}`;
      // ctx.fillText('\u2013', 0, y);
      ctx.fillText('-', 0, y);
    }
  }
  ctx.textBaseline = "alphabetic";

  // draw jewel
  // x = (data["current_system_time"] - midnight/1000) / (24*60*60) * width;
  x = (now - midnight) / (24*60*60*1000) * width;
  y = height - ( (data["current_temp"] - warmest) / (coldest - warmest) * height );

  ctx.strokeStyle = "rgba(100,0,150,.17)"; // crosshairs
  ctx.lineWidth = 5;
  ctx.moveTo(x, 0);
  ctx.lineTo(x, height);
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();


  ctx.beginPath();
  ctx.arc(x, y, fontSize/2.5, 0, 2 * Math.PI, false); // background glow
  ctx.lineWidth = fontSize/1.5;
  ctx.strokeStyle = "rgba(100,100,255,.3)";
  ctx.stroke();

  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(x, y, fontSize/3, 0, 2 * Math.PI, false); // main circle
  ctx.lineWidth = fontSize/2.5;
  ctx.strokeStyle = "rgba(200,200,255,.5)";
  ctx.stroke();
  ctx.fill();

  // display current temp in text
  relFontSize = fontSize * 2.5;
  ctx.font = `${relFontSize}px ${tempFont}`;
  ctx.textAlign = "right";
  // ctx.fillStyle = "rgba(255,200,240,.6)";
  // ctx.fillText(`${Math.round(data["current_temp"])}K`, x + relFontSize * .9, y - relFontSize/2.5);
  ctx.fillStyle = "rgba(0,0,0,.4)";
  ctx.fillText(`${Math.round(data["current_temp"])}K`, x + relFontSize, y - relFontSize/2.5);


  // display current time in large text
  let nowStr = `${now.getHours()}:${now.getMinutes().toString().replace(/.*/,(m) => m < 10 ? '0' + m : m)}`;
  let clockEl = document.getElementById("clock");
  clock.innerHTML = nowStr;
  // relFontSize = height / 3;
  // x = width/2;
  // y = height/2 + relFontSize/2;
  // ctx.fillStyle = "rgba(230,255,230,.5)";
  // ctx.font = `${relFontSize}px ${biggerNumberFont}`;
  // ctx.textAlign = "center";
  // ctx.fillText(`${nowStr}`, x, y);
  // ctx.strokeStyle = "rgba(0,0,0,.3)";
  // ctx.lineWidth = relFontSize/4;
  // ctx.strokeText(`${nowStr}`, x, y);// - relFontSize/4.5);

}

// try getting clock data from http://worldtimeapi.org/api/timezone/America/North_Dakota/Center.json
function getWorldTime() {
  console.log('getting world time...');
  fetch('http://worldtimeapi.org/api/timezone/America/North_Dakota/Center.json')
  .then(async response => {
    if (response.ok) {
      let json = await response.json();

      clearInterval(timeInterval);

      console.log(json.datetime);
      console.log(Date.parse(json.datetime));
      worldTime = new Date(Date.parse(json.datetime))
      // worldTime.setHours(worldTime.getHours() + 6); // for testing if it's different than the system time
      console.log(worldTime.toString());
      // 2022-06-19T12:52:52.139328-05:00

      timeInterval = setInterval(()=>{worldTime.setSeconds(worldTime.getSeconds()+3);/*console.log(worldTime.toString())*/},3000);
    } else {
      // do nothing and just wait until the next interval
      console.log(response.status);
    }
  }).catch(err => {
    console.error(err);
  });
}
