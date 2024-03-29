import ColorPicker from "./ColorPicker.mjs";
import Controls from "./Controls.mjs";

export default class ColorControls extends Controls {
    constructor(data) {
        super(data);

        this.inputEl = document.querySelector("#cp_form input");
        try {
            this.inputEl.value = this.data.settings.color;
        } catch(e) {
            // no data was passed to the constructor (or data.settings.color does not exist)
        }

        this.colorPicker = new ColorPicker(this);

        // this.firstUpdate = true;
    }

  // get json data from home-automation;
  // called every update interval by fetchData() in sunlight.js
  updateCtrls(data) {
    super.updateCtrls(data);

    if (data) {
        this.colorPicker.updateSettings(data.settings);
    }

    // // only fill the input field on the first update so as not to interrupt any user input
    // if (this.firstUpdate) {
    //     this.inputEl.value = this.data.settings.color;
    //     this.firstUpdate = false;
    // }

    // // update threshold values for temp and humidity
    // document.querySelector("#temp_controls .current_setting").innerHTML = this.data.settings.temp_target;
    // document.querySelector("#hum_controls .current_setting").innerHTML = this.data.settings.rel_hum_max;
  }

  setElementSizes() {
    super.setElementSizes();

    // const tempLabel = document.querySelector("#temp_controls .label");
    // tempLabel.style.left = '0px';
    // tempLabel.style.top = '0px';
    // tempLabel.style.width = this.rect.left + 'px';
    // tempLabel.style.height = this.rect.height + 'px';//this.container.offsetHeight + 'px';
    // tempLabel.style.lineHeight = this.rect.left + 'px'; // same as width, because we're using vertical text

    // const humLabel = document.querySelector("#hum_controls .label");
    // humLabel.style.left = (this.rect.left + this.rect.width) + 'px';
    // humLabel.style.top = '0px';
    // // humLabel.style.width = (this.container.offsetWidth - this.rect.right) + 'px';
    // humLabel.style.width = this.rect.left + 'px';
    // humLabel.style.paddingRight = (this.container.offsetWidth - this.rect.right - this.rect.left) + 'px';
    // humLabel.style.lineHeight = this.rect.left + 'px'; // same as width, because we're using vertical text
    // humLabel.style.height = this.rect.height + 'px';//this.container.offsetHeight + 'px';
  }

  // set mouse events for touchscreen interaction
  setEvents() {
    super.setEvents();

    // control buttons
    document.querySelector("#cp_save_btn").addEventListener("mousedown", (e) => {
        console.log(`clicked save...`);
        this.btnClick(e,{
            color: this.colorPicker.getEditorColorHexString(),
            brightness: this.colorPicker.editorBrightness
        });
    });
  }

  showControls(e) {
    // whenever the controls window is opened from being hidden, reset the ColorPicker's values to those in the settings
    if (!this.showing) {
        this.colorPicker.initializeValuesFromSettings();
    }

    super.showControls(e);
  }
}
