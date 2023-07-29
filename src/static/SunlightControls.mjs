import Controls from "./Controls.mjs";

export default class SunlightControls extends Controls {
  // get json data from home-automation;
  // called every update interval by fetchData() in sunlight.js
  updateCtrls(data) {
    super.updateCtrls(data);

    // // update values for ceiling brightness
    document.querySelector("#ceiling_controls .current_setting").innerHTML = `${Math.round(100 * this.data.settings.group.ceiling.brt_user_adjust)}%`;
  }

  // // !!!!! TEMPORARY, TO STOP AUTOHIDE !!!!!! //
  // showControls() {
  //   super.showControls();
  //   clearTimeout(this.hideDelay);
  // }

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
    document.querySelector("#ceiling_controls .button.up").addEventListener("mousedown", (e) => {
      var change = {"group" : structuredClone(this.data.settings.group)};
      change.group.ceiling.brt_user_adjust = Math.max(0,Math.min(1,Math.round(10*(change.group.ceiling.brt_user_adjust + .1))/10));
      this.btnClick(e,change);
    });
    document.querySelector("#ceiling_controls .button.down").addEventListener("mousedown", (e) => {
      var change = {"group" : structuredClone(this.data.settings.group)};
      change.group.ceiling.brt_user_adjust = Math.max(0,Math.min(1,Math.round(10*(change.group.ceiling.brt_user_adjust - .1))/10));
      this.btnClick(e,change);
    });
  }
}
