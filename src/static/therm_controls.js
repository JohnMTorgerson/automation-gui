// set mouse events for touchscreen interaction
setEvents();


// set mouse events for touchscreen interaction
function setEvents() {
  // clicking anywhere on the canvas_container shows controls
  const canvas = document.getElementById("canvas_container");
  canvas.addEventListener('click', (e) => {
    showControls(e);
  });

  // clicking anywhere on the controls (except buttons) hides controls
  const controls = document.getElementById("controls_container");
  controls.addEventListener('click', (e) => {
    hideControls(e);
  });

  // control buttons
  document.querySelector("#temp_controls .button.up").addEventListener("click", (e) => {btnClick(e,'temperature',1);});
  document.querySelector("#temp_controls .button.down").addEventListener("click", (e) => {btnClick(e,'temperature',-1);});
  document.querySelector("#hum_controls .button.up").addEventListener("click", (e) => {btnClick(e,'humidity',1);});
  document.querySelector("#hum_controls .button.down").addEventListener("click", (e) => {btnClick(e,'humidity',-1);});
}

function showControls(e) {
  const controls = document.getElementById("controls_container");
  controls.classList.add("show");
}

function hideControls(e) {
  const controls = document.getElementById("controls_container");
  controls.classList.remove("show");
}

function btnClick(e,prop,amount) {
  e.stopPropagation(); // so that clicking it doesn't hide the controls view
  console.log(`${prop} change by ${amount}`);
}
