export default class ThermControls {
  constructor(data) {
    this.data = data; // JSON data read from lighting-automation, with sensor history, weather data, settings, etc.
    this.ctrlChange = {}; // data should be an object, with key/value pairs corresponding with those in settings.json in the thermostat scene of the automation controller

    this.setEvents(); // set mouse events on DOM objects
  }

  // get json data from lighting-automation;
  // called every update interval by fetchData() in thermostat.js
  updateCtrls(data) {
    this.data = data;
    document.querySelector("#temp_controls .current_setting").innerHTML = data.settings.temp_target;
    document.querySelector("#hum_controls .current_setting").innerHTML = data.settings.hum_target;

  }


  saveCtrlChange() {
    // combine settings change with existing settings
    this.data["settings"] = {...this.data["settings"],...this.ctrlChange}

    // update the UI (in thermostat.js) with the updated data
    clearTimeout(this.delay);
    this.delay = setTimeout(() => {
      window.parent.updateData(this.data);
    },300);

    // a flag to show that a change was made
    this.changed = true;
  }


  // set mouse events for touchscreen interaction
  setEvents() {
    // clicking anywhere on the canvas_container shows controls
    const canvas = document.getElementById("canvas_container");
    canvas.addEventListener('click', (e) => {
      // controls.style.width = graphWidth;
      // controls.style.height = graphHeight;
      let rect = document.getElementById("graph").getBoundingClientRect();
      // console.log(rect);
      controls.style.width = rect.width + 'px';
      controls.style.height = rect.height + 'px';
      controls.style.paddingLeft = rect.left + 'px';
      controls.style.paddingTop = rect.top + 'px';
      controls.style.paddingRight = (document.documentElement.clientWidth - rect.right) + 'px';
      controls.style.paddingBottom = (document.documentElement.clientHeight - rect.bottom) + 'px';

      this.showControls(e);
    });

    // clicking anywhere on the controls (except buttons) hides controls
    const controls = document.getElementById("controls_container");
    controls.addEventListener('click', (e) => {
      this.hideControls(e);
    });

    // control buttons
    document.querySelector("#temp_controls .button.up").addEventListener("click", (e) => {this.btnClick(e,'temp_target',1);});
    document.querySelector("#temp_controls .button.down").addEventListener("click", (e) => {this.btnClick(e,'temp_target',-1);});
    document.querySelector("#hum_controls .button.up").addEventListener("click", (e) => {this.btnClick(e,'hum_target',1);});
    document.querySelector("#hum_controls .button.down").addEventListener("click", (e) => {this.btnClick(e,'hum_target',-1);});
  }

  showControls(e) {
    const controls = document.getElementById("controls_container");
    controls.classList.add("show");
  }

  hideControls(e) {
    const controls = document.getElementById("controls_container");
    controls.classList.remove("show");
  }

  btnClick(e,prop,amount) {
    e.stopPropagation(); // so that clicking it doesn't hide the controls view
    console.log(`${prop} change by ${amount}`);

    this.ctrlChange = {};
    this.ctrlChange[prop] = amount + this.data.settings[prop];
    console.log(`New ${prop}: ${this.ctrlChange[prop]}`);
    this.saveCtrlChange();
  }
}
