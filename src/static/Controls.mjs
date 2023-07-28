export default class Controls {
    constructor(data) {
      this.data = data; // JSON data read from home-automation, with sensor history, weather data, settings, etc.
      this.ctrlChange = {}; // data should be an object, with key/value pairs corresponding with those in settings.json in the automation controller
      this.showing = false; // whether the controls are showing or hidden

      try { // get main canvas bounding rect and container element
        this.container = document.querySelector("#canvas_container");
        this.rect = document.getElementsByClassName("main_canvas")[0].getBoundingClientRect();
      } catch(e) { // in scenes with no canvas element, the following will be used instead:
        this.container = document.querySelector("#main_container");
        this.rect = this.container.getBoundingClientRect();
      }
      this.switchBtn = document.querySelector("#onoff_switch");

      this.setOnOffSwitch();
      this.setElementSizes(); // set some sizes and positions of DOM elements
      this.setEvents(); // set mouse events on DOM objects
    }
  
    // get json data from home-automation;
    // called every update interval by fetchAndSaveData() in scene script
    updateCtrls(data) {
      if (data) this.data = data;
    
      this.setOnOffSwitch();
    }

    setOnOffSwitch() {
      try {
        var on = this.data.settings.on;
        if (typeof on === undefined) return;
      } catch(e) {
        // no 'on' setting found, ''data'' is probably empty, so do nothing 
        return;
      }

      // make sure the master switch reflects the on/off state
      if (on) {
        this.switchBtn.classList.add("on")
      } else {
        this.switchBtn.classList.remove("on")
      }
    }
  
  
    saveCtrlChange(delay) {
      // clear any previous changes that were waiting to be made
      clearTimeout(this.saveDelay);
      
      // console.log(`this.ctrlChange == ${JSON.stringify(this.ctrlChange)}`);

      // combine settings change with existing settings
      this.data["settings"] = {...this.data["settings"],...this.ctrlChange}

      // console.log(`New this.data.settings == ${JSON.stringify(this.data.settings)}`);
  
      // update the controls GUI now instead of waiting for the delay (below)
      this.updateCtrls();
  
      // update the server (and the UI in the scene script) with the updated data
      // using a small delay to allow multiple presses without submitting to the server for every single one;
      // if a delay is not passed or is out of range, use the default below
      if (!Number.isFinite(delay) || delay < 0 || delay > 10000) {
        delay = 800;
      }
      this.saveDelay = setTimeout(() => {
        console.log(`this.ctrlChange == ${JSON.stringify(this.ctrlChange)}`);
        console.log("saving change...")
        window.parent.fetchAndSaveData(true);
      },delay);
    }
  
    setElementSizes() {  
      const controls = document.getElementById("controls_container");
      controls.style.width = this.rect.width + 'px';
      controls.style.height = this.rect.height + 'px';
      controls.style.paddingLeft = this.rect.left + 'px';
      controls.style.paddingTop = this.rect.top + 'px';
      controls.style.paddingRight = (document.documentElement.clientWidth - this.rect.right) + 'px';
      controls.style.paddingBottom = (document.documentElement.clientHeight - this.rect.bottom) + 'px';
  
    //   const tempLabel = document.querySelector("#temp_controls .label");
    //   tempLabel.style.left = '0px';
    //   tempLabel.style.top = '0px';
    //   tempLabel.style.width = this.rect.left + 'px';
    //   tempLabel.style.height = this.rect.height + 'px';//container.offsetHeight + 'px';
    //   tempLabel.style.lineHeight = this.rect.left + 'px'; // same as width, because we're using vertical text
  
    //   const humLabel = document.querySelector("#hum_controls .label");
    //   humLabel.style.left = (this.rect.left + this.rect.width) + 'px';
    //   humLabel.style.top = '0px';
    //   // humLabel.style.width = (container.offsetWidth - this.rect.right) + 'px';
    //   humLabel.style.width = this.rect.left + 'px';
    //   humLabel.style.paddingRight = (container.offsetWidth - this.rect.right - this.rect.left) + 'px';
    //   humLabel.style.lineHeight = this.rect.left + 'px'; // same as width, because we're using vertical text
    //   humLabel.style.height = this.rect.height + 'px';//container.offsetHeight + 'px';
  
      // const switch_btn = document.querySelector("#onoff_switch");
      // switch_btn.style.left = (this.rect.left + this.rect.width/2) + 'px';
    }
  
    // set mouse events for touchscreen interaction
    setEvents() {
      // clicking anywhere on the canvas_container shows controls
      this.container.addEventListener('click', (e) => {
  
        this.showControls(e);
      });
  
      // clicking anywhere on the controls (except buttons) hides controls
      const controls = document.getElementById("controls_container");
      controls.addEventListener('mousedown', (e) => {
        this.hideControls(e);
      });
  
      // control buttons
      document.querySelector("#onoff_switch .switch_outer").addEventListener("mousedown", (e) => {this.switchClick(e);});

      // a click on any input element should stop propagation (so the controls don't disappear)
      // and stop the hideDelay timer altogether (it would be reset by clicking on a button)
      document.querySelectorAll("input").forEach((el) => {
        // console.log("this is an input element");
        el.addEventListener("mousedown", (e) => {e.stopPropagation(); clearTimeout(this.hideDelay);});
      });
    }
  
    showControls(e) {
      const controls = document.getElementById("controls_container");
      controls.classList.add("show");
      this.showing = true;
  
      // auto hide the controls after so many seconds of inactivity
      clearTimeout(this.hideDelay);
      this.hideDelay = setTimeout(this.hideControls,30000);
    }
  
    hideControls(e) {
      const controls = document.getElementById("controls_container");
      controls.classList.remove("show");
      this.showing = false;
    }
  
    btnClick(e,prop,input) {
      // console.log(`Controls class has received a button click. Values are:\nprop==${JSON.stringify(prop)}, value==${input}`);
      e.stopPropagation(); // so that clicking it doesn't hide the controls view
  
      // we call showControls just to reset the hideDelay timer
      this.showControls();
  
      // reset ctrlChange object to empty
      this.ctrlChange = {};

      // SINGLE PROPERTY CHANGE
      if (typeof prop == "string" && typeof input != undefined) {
        // if the input is a number, add it to the current value
        if (Number.isFinite(input)) {
          // console.log(`Control change: ${prop} changed by ${input}`);
          // top-level property
          if (typeof prop == "string") {
            this.ctrlChange[prop] = input + this.data.settings[prop];
          }
        } 
        // otherwise, replace the old value with it
        else {
          this.ctrlChange[prop] = input;
        }

        // console.log(`Control change: ${prop} == ${this.ctrlChange[prop]}`);
      }
      
      // MULTIPLE/NESTED PROPERTY CHANGE
      else if (typeof prop == "object" && prop != null && typeof input === "undefined") {
        this.ctrlChange = structuredClone(prop);

        // console.log(`Control change: ${JSON.stringify(this.ctrlChange)}`);
      }

      // console.log(`typeof prop == "object": ${typeof prop == "object"} (typeof prop: ${typeof prop})`);
      // console.log(`prop != null: ${prop!=null}`);
      // console.log(`typeof input === undefined: ${typeof input === "undefined"} (typeof input: ${typeof input})`);

      this.saveCtrlChange();
    }
  
    // when the user clicks on the master on/off switch
    switchClick(e) {
      // console.log(this.data.settings.on);
      e.stopPropagation(); // so that clicking it doesn't hide the controls view
      this.showControls(); // we call showControls just to reset the hideDelay timer
  
      // const el = e.originalTarget.parent;
      this.ctrlChange = {};
  
      if (this.data.settings.on) {
        // scene is on, so we want to turn it off
        this.ctrlChange["on"] = false;
        this.switchBtn.classList.remove("on");
      } else {
        // scene is off, so we want to turn it on
        this.ctrlChange["on"] = true;
        this.switchBtn.classList.add("on");
      }
  
      this.saveCtrlChange();
    }
  }
  