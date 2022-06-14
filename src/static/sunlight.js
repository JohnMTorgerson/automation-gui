// fetch data immediately on page load, and then at ten second intervals thereafter
fetchData();
setInterval(fetchData,10000);


// dynamically load scene data from flask server
function fetchData() {
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

function updateData(data) {
  // options
  let fontSize = height / 20; // set main fontSize for text labels
  let font = "Helvetica";


  let c = document.getElementById("sunlight_canvas");
  let ctx = c.getContext("2d");


  // draw background gradient
  for (let row=0; row<colors.length; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row);
    ctx.lineTo(width, row);
    ctx.lineWidth = 2; // a line width of greater than one ensures full saturation (width of 1 looks washed out, presumably due to anti-aliasing effects)
    ctx.strokeStyle = colors[row];
    ctx.stroke();
  }


  // draw temperature curve
  let x, y;
  let lineWidth = 5;
  let strokeStyle = "rgba(0,0,0,.25)";
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
  let shade = 'rgba(0,0,80,.4)';
  let noShade = 'rgba(0,0,80,0)';
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
  let relFontSize = fontSize * 1.5;
  let midnight = new Date();
  midnight = midnight.setHours(0,0,0,0);
  let srTimeStr = new Date(data["suntimes"][0]*1000 + midnight);
  srTimeStr = `${srTimeStr.getHours()}:${srTimeStr.getMinutes()}`;
  let ssTimeStr = new Date(data["suntimes"][1]*1000 + midnight);
  ssTimeStr = `${ssTimeStr.getHours()}:${ssTimeStr.getMinutes()}`;
  ctx.lineWidth = relFontSize / 6;
  let markerColor = "rgba(215,215,255,.8)"
  let textColor = "rgba(215,215,255,1)"
  let strokeColor = 'rgba(0,0,0,.3)';
  ctx.strokeStyle = strokeColor;
  let markerHeight = height - relFontSize;
  ctx.beginPath();
  ctx.moveTo(sunriseX, markerHeight);
  ctx.lineTo(sunriseX, height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sunsetX, markerHeight);
  ctx.lineTo(sunsetX, height);
  ctx.stroke();
  ctx.fillStyle = textColor;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = relFontSize/4;
  ctx.font = `${relFontSize}px ${font}`;
  ctx.textAlign = "center";
  ctx.strokeText(`${srTimeStr}`, sunriseX, markerHeight - relFontSize/4.5);
  ctx.strokeText(`${ssTimeStr}`, sunsetX, markerHeight - relFontSize/4.5);
  ctx.fillText(`${srTimeStr}`, sunriseX, markerHeight - relFontSize/4.5);
  ctx.fillText(`${ssTimeStr}`, sunsetX, markerHeight - relFontSize/4.5);

  // draw time labels
  for (let i=0; i<24; i++) {
    let x = i * width / 24;
    ctx.fillStyle = x < sunriseX || x > sunsetX ? "white" : "black";
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(i%2==0 ? i : "·", x, height - fontSize/3);
  }

  // draw jewel
  x = (data["current_system_time"] - midnight/1000) / (24*60*60) * width;
  y = height - ( (data["current_temp"] - warmest) / (coldest - warmest) * height );

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
  relFontSize = fontSize * 1.5
  ctx.fillStyle = "rgba(0,0,0,.5)";
  ctx.font = `${relFontSize}px ${font}`;
  ctx.textAlign = "left";
  ctx.fillText(`${Math.round(data["current_temp"])}K`, fontSize/3, relFontSize);

  // try getting clock data from http://worldtimeapi.org/api/timezone/America/North_Dakota/Center.json
}
