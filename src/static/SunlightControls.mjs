import Controls from "./Controls.mjs";

export default class SunlightControls extends Controls {
  // get json data from lighting-automation;
  // called every update interval by fetchData() in sunlight.js
  updateCtrls(data) {
    super.updateCtrls(data);

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

    // // control buttons
    // document.querySelector("#temp_controls .button.up").addEventListener("click", (e) => {this.btnClick(e,'temp_target',1);});
    // document.querySelector("#temp_controls .button.down").addEventListener("click", (e) => {this.btnClick(e,'temp_target',-1);});
    // document.querySelector("#hum_controls .button.up").addEventListener("click", (e) => {this.btnClick(e,'rel_hum_max',1);});
    // document.querySelector("#hum_controls .button.down").addEventListener("click", (e) => {this.btnClick(e,'rel_hum_max',-1);});
  }
}
