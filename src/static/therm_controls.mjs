export default class ThermControls {
  constructor(data) {
    this.data = data; // JSON data read from lighting-automation, with sensor history, weather data, settings, etc.
    this.ctrlChange = {}; // data should be an object, with key/value pairs corresponding with those in settings.json in the thermostat scene of the automation controller

    this.setElementSizes(); // set some sizes and positions of DOM elements
    this.setEvents(); // set mouse events on DOM objects
  }

  // get json data from lighting-automation;
  // called every update interval by fetchData() in thermostat.js
  updateCtrls(data) {
    if (data) this.data = data;

    // update threshold values for temp and humidity
    document.querySelector("#temp_controls .current_setting").innerHTML = this.data.settings.temp_target;
    document.querySelector("#hum_controls .current_setting").innerHTML = this.data.settings.rel_hum_max;

    // make sure the master switch reflects the on/off state
    const switch_btn = document.querySelector("#onoff_switch");
    if (this.data.settings.on) {
      switch_btn.classList.add("on")
    } else {
      switch_btn.classList.remove("on")
    }

  }


  saveCtrlChange(delay) {
    // combine settings change with existing settings
    this.data["settings"] = {...this.data["settings"],...this.ctrlChange}

    // update the controls GUI now instead of waiting for the regular update cycle
    this.updateCtrls();

    // update the UI (in thermostat.js) with the updated data
    // using a small delay to allow multiple presses without a lot of latency;
    // if a delay is not passed or is out of range, use the default below
    if (isNaN(delay) || delay < 0 || delay > 10000) {
      delay = 800;
    }
    clearTimeout(this.saveDelay);
    this.saveDelay = setTimeout(() => {
      window.parent.updateData(this.data);
    },delay);

    // a flag to show that a change was made
    this.changed = true;
  }

  setElementSizes() {
    let rect = document.getElementById("graph").getBoundingClientRect();
    const container = document.querySelector("#canvas_container");

    const controls = document.getElementById("controls_container");
    controls.style.width = rect.width + 'px';
    controls.style.height = rect.height + 'px';
    controls.style.paddingLeft = rect.left + 'px';
    controls.style.paddingTop = rect.top + 'px';
    controls.style.paddingRight = (document.documentElement.clientWidth - rect.right) + 'px';
    controls.style.paddingBottom = (document.documentElement.clientHeight - rect.bottom) + 'px';

    const tempLabel = document.querySelector("#temp_controls .label");
    tempLabel.style.left = '0px';
    tempLabel.style.top = '0px';
    tempLabel.style.width = rect.left + 'px';
    tempLabel.style.height = rect.height + 'px';//container.offsetHeight + 'px';
    tempLabel.style.lineHeight = rect.left + 'px'; // same as width, because we're using vertical text

    const humLabel = document.querySelector("#hum_controls .label");
    humLabel.style.left = (rect.left + rect.width) + 'px';
    humLabel.style.top = '0px';
    // humLabel.style.width = (container.offsetWidth - rect.right) + 'px';
    humLabel.style.width = rect.left + 'px';
    humLabel.style.paddingRight = (container.offsetWidth - rect.right - rect.left) + 'px';
    humLabel.style.lineHeight = rect.left + 'px'; // same as width, because we're using vertical text
    humLabel.style.height = rect.height + 'px';//container.offsetHeight + 'px';

    const switch_btn = document.querySelector("#onoff_switch");
    switch_btn.style.left = (rect.left + rect.width/2) + 'px';
  }

  // set mouse events for touchscreen interaction
  setEvents() {
    // clicking anywhere on the canvas_container shows controls
    const canvas = document.getElementById("canvas_container");
    canvas.addEventListener('click', (e) => {

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
    document.querySelector("#hum_controls .button.up").addEventListener("click", (e) => {this.btnClick(e,'rel_hum_max',1);});
    document.querySelector("#hum_controls .button.down").addEventListener("click", (e) => {this.btnClick(e,'rel_hum_max',-1);});
    document.querySelector("#onoff_switch").addEventListener("click", (e) => {this.switchClick(e);});

  }

  showControls(e) {
    const controls = document.getElementById("controls_container");
    controls.classList.add("show");

    // auto hide the controls after so many seconds of inactivity
    clearTimeout(this.hideDelay);
    this.hideDelay = setTimeout(this.hideControls,30000);
  }

  hideControls(e) {
    const controls = document.getElementById("controls_container");
    controls.classList.remove("show");
  }

  btnClick(e,prop,amount) {
    e.stopPropagation(); // so that clicking it doesn't hide the controls view
    console.log(`${prop} change by ${amount}`);

    // we call showControls just to reset the hideDelay timer
    this.showControls();

    this.ctrlChange = {};
    this.ctrlChange[prop] = amount + this.data.settings[prop];
    console.log(`New ${prop}: ${this.ctrlChange[prop]}`);
    this.saveCtrlChange();
  }

  // when the user clicks on the master on/off switch
  switchClick(e) {
    console.log(this.data.settings.on);
    e.stopPropagation(); // so that clicking it doesn't hide the controls view
    this.showControls(); // we call showControls just to reset the hideDelay timer

    const el = e.currentTarget;
    this.ctrlChange = {};

    if (this.data.settings.on) {
      // thermostat is on, so we want to turn it off
      this.ctrlChange["on"] = false;
      el.classList.remove("on");
    } else {
      // thermostat is off, so we want to turn it on
      this.ctrlChange["on"] = true;
      el.classList.add("on");
    }

    this.saveCtrlChange();
  }
}
