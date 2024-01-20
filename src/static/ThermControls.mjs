import Controls from "./Controls.mjs";

export default class ThermControls extends Controls {
  // get json data from home-automation;
  // called every update interval by fetchData() in thermostat.js
  updateCtrls(data) {
    super.updateCtrls(data);

    if (typeof this.data === "undefined") {
      console.warn("this.data is undefined");
      return;
    }

    // update threshold values for temp and humidity
    document.querySelector("#temp_controls .current_setting").innerHTML = this.selectedTab === 'tab_max' ? this.data.settings.temp_target : '0K';
    document.querySelector("#hum_controls .current_setting").innerHTML = this.selectedTab === 'tab_max' ? this.data.hum.max : this.data.hum.min;
    document.querySelector("#hum_controls .current .units").innerHTML = this.data.hum.abs ? this.data.hum.units : "pct";

    // console.log(`show_weather_temp_value: ${this.data.settings.show_weather_temp_value}`);
    // console.log(`show_weather_temp_graph: ${this.data.settings.show_weather_temp_graph}`);
    // console.log(`show_weather_hum_value:  ${this.data.settings.show_weather_hum_value}`);
    // console.log(`show_weather_hum_graph:  ${this.data.settings.show_weather_hum_graph}`);

    document.querySelector("#temp_controls .weather_checkbox .checkbox.value").checked = this.data.settings.show_weather_temp_value;
    document.querySelector("#temp_controls .weather_checkbox .checkbox.graph").checked = this.data.settings.show_weather_temp_graph;
    document.querySelector("#hum_controls .weather_checkbox .checkbox.value").checked = this.data.settings.show_weather_hum_value;
    document.querySelector("#hum_controls .weather_checkbox .checkbox.graph").checked = this.data.settings.show_weather_hum_graph;

  }

  setInitialState() {
    // super.setInitialState();

    // choose default tab based on the time of year
    let month = new Date().getMonth();
    if (month > 4 && month < 9) {
      this.selectedTab = "tab_max";
    } else {
      this.selectedTab = "tab_min";
    }

    this.tabClick(null,this.selectedTab);
  }

  setElementSizes() {
    super.setElementSizes();

    const tempLabel = document.querySelector("#temp_controls .label");
    tempLabel.style.left = '0px';
    tempLabel.style.top = '0px';
    tempLabel.style.width = this.rect.left + 'px';
    tempLabel.style.height = this.rect.height + 'px';//this.container.offsetHeight + 'px';
    tempLabel.style.lineHeight = this.rect.left + 'px'; // same as width, because we're using vertical text

    const humLabel = document.querySelector("#hum_controls .label");
    humLabel.style.left = (this.rect.left + this.rect.width) + 'px';
    humLabel.style.top = '0px';
    // humLabel.style.width = (this.container.offsetWidth - this.rect.right) + 'px';
    humLabel.style.width = this.rect.left + 'px';
    humLabel.style.paddingRight = (this.container.offsetWidth - this.rect.right - this.rect.left) + 'px';
    humLabel.style.lineHeight = this.rect.left + 'px'; // same as width, because we're using vertical text
    humLabel.style.height = this.rect.height + 'px';//this.container.offsetHeight + 'px';
  }

  // set mouse events for touchscreen interaction
  setEvents() {
    super.setEvents();

    // control buttons
    // document.querySelector("#temp_controls .button.up").addEventListener("mousedown", (e) => {this.btnClick(e,'temp_target',1);});
    // document.querySelector("#temp_controls .button.down").addEventListener("mousedown", (e) => {this.btnClick(e,'temp_target',-1);});
    // document.querySelector("#hum_controls .button.up").addEventListener("mousedown", (e) => {this.btnClick(e,'hum_max',1);});
    // document.querySelector("#hum_controls .button.down").addEventListener("mousedown", (e) => {this.btnClick(e,'hum_max',-1);});

    document.querySelector("#temp_controls .weather_checkbox .checkbox.value").addEventListener("change", (e) => {this.btnClick(e,'show_weather_temp_value',e.target.checked);});
    document.querySelector("#temp_controls .weather_checkbox .checkbox.graph").addEventListener("change", (e) => {this.btnClick(e,'show_weather_temp_graph',e.target.checked);});
    document.querySelector("#hum_controls .weather_checkbox .checkbox.value").addEventListener("change", (e) => {this.btnClick(e,'show_weather_hum_value',e.target.checked);});
    document.querySelector("#hum_controls .weather_checkbox .checkbox.graph").addEventListener("change", (e) => {this.btnClick(e,'show_weather_hum_graph',e.target.checked);});
  }

  btnClick(e,param,amount) {
    // if (param === "hum_max") {
    //   param = this.data.hum.abs ? 'abs_hum_max' : 'rel_hum_max';
    // }

    super.btnClick(e, param, amount);

    // update the special "hum" object with new settings, in case they changed
    this.data.hum.max = this.data.settings[`${this.data.hum.str}_hum_max`];
    this.data.hum.min = this.data.settings[`${this.data.hum.str}_hum_min`];
    this.updateCtrls();
  }

  tabClick(e,id) {
    // if changing tabs, call css animation
    if (id !== this.selectedTab) {
      var cc = document.querySelector("#controls_container");
      cc.classList.add("swapping");
      setTimeout(()=>{ cc.classList.remove("swapping") },500);
    }

    super.tabClick(e,id);

    // named listeners for the buttons so we can remove them when changing tabs
    var humMaxIncr = (e) => { this.btnClick(e, `${this.data.hum.str}_hum_max`, this.data.hum.incr_amt) };
    var humMaxDecr = (e) => { this.btnClick(e, `${this.data.hum.str}_hum_max`, this.data.hum.decr_amt) };
    var humMinIncr = (e) => { this.btnClick(e, `${this.data.hum.str}_hum_min`, this.data.hum.incr_amt) };
    var humMinDecr = (e) => { this.btnClick(e, `${this.data.hum.str}_hum_min`, this.data.hum.decr_amt) };
    var tempMaxIncr = (e) => { this.btnClick(e, `temp_target`, 1) };
    var tempMaxDecr = (e) => { this.btnClick(e, `temp_target`, -1) };


    console.log(`clicked on ${id} tab`);

    console.log(this.deviceTabs);

    var humUpBtn = document.querySelector("#hum_controls .button.up");
    var humDnBtn = document.querySelector("#hum_controls .button.down");
    var tempUpBtn = document.querySelector("#temp_controls .button.up")
    var tempDnBtn = document.querySelector("#temp_controls .button.down");
    var tempCtrlsCurrent = document.querySelector("#temp_controls .current");

    if (id === "tab_max") {
      // temp
      tempUpBtn.addEventListener("mousedown", tempMaxIncr);
      tempDnBtn.addEventListener("mousedown", tempMaxDecr);
      tempUpBtn.classList.remove("disabled");
      tempDnBtn.classList.remove("disabled");
      tempCtrlsCurrent.classList.remove("disabled");
      // hum
      humUpBtn.removeEventListener("mousedown", humMinIncr);
      humDnBtn.removeEventListener("mousedown", humMinDecr);
      humUpBtn.addEventListener("mousedown", humMaxIncr);
      humDnBtn.addEventListener("mousedown", humMaxDecr);
    } else if (id === "tab_min") {
      //temp
      tempUpBtn.removeEventListener("mousedown", tempMaxIncr);
      tempDnBtn.removeEventListener("mousedown", tempMaxDecr);
      tempUpBtn.classList.add("disabled");
      tempDnBtn.classList.add("disabled");
      tempCtrlsCurrent.classList.add("disabled");
      //hum
      humUpBtn.removeEventListener("mousedown", humMaxIncr);
      humDnBtn.removeEventListener("mousedown", humMaxDecr);
      humUpBtn.addEventListener("mousedown", humMinIncr);
      humDnBtn.addEventListener("mousedown", humMinDecr);
    }

    setTimeout(this.updateCtrls.bind(this),200);
  }
}
