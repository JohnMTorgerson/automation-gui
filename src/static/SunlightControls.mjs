import Controls from "./Controls.mjs";

export default class SunlightControls extends Controls {
  // get json data from home-automation;
  // called every update interval by fetchData() in sunlight.js
  updateCtrls(data) {
    super.updateCtrls(data);

    if (!this.eventsSet) { this.setEvents(); }

    // update values for group adjustments
    let groups = this.data.settings.group;
    for (const grp_name in groups) {
      if (Object.hasOwnProperty.call(groups, grp_name)) {
        const grp_settings = groups[grp_name];

        // in the future, this can be a loop to handle any/all properties
        const property = "brt_user_adjust";
        const element = document.querySelector(`#${grp_name}_controls .current_setting`);
        if (element != null && Object.hasOwnProperty.call(grp_settings, property)) {
          element.innerHTML = `${Math.round(100 * grp_settings[property])}%`;
        }
      }
    }
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

    if (this.data === undefined || this.eventsSet) {
      console.warn("setEvents() NOT firing");
      return;
    }

    // control buttons
    // document.querySelector("#ceiling_controls .button.up").addEventListener("mousedown", (e) => {
    //   var change = {"group" : structuredClone(this.data.settings.group)};
    //   change.group.ceiling.brt_user_adjust = Math.max(0,Math.min(1,Math.round(10*(change.group.ceiling.brt_user_adjust + .1))/10));
    //   this.btnClick(e,change);
    // });
    // document.querySelector("#ceiling_controls .button.down").addEventListener("mousedown", (e) => {
    //   var change = {"group" : structuredClone(this.data.settings.group)};
    //   change.group.ceiling.brt_user_adjust = Math.max(0,Math.min(1,Math.round(10*(change.group.ceiling.brt_user_adjust - .1))/10));
    //   this.btnClick(e,change);
    // });

    let groups = this.data.settings.group;
    for (const grp_name in groups) {
      if (Object.hasOwnProperty.call(groups, grp_name)) {
        const grp_settings = groups[grp_name];

        // in the future, this can be a loop to handle any/all properties
        const property = "brt_user_adjust";
        const btn_up = document.querySelector(`#${grp_name}_controls .button.up`);
        const btn_down = document.querySelector(`#${grp_name}_controls .button.down`);
        if (Object.hasOwnProperty.call(grp_settings, property)) {
          try {
            btn_up.addEventListener("mousedown", (e) => {
              var change = { "group": structuredClone(this.data.settings.group) };
              change.group[grp_name][property] = Math.max(0, Math.min(1, Math.round(10 * (change.group[grp_name][property] + .1)) / 10));
              this.btnClick(e, change);
            });
          } catch {console.warn(`Up btn element not found for ${grp_name}.${property}`); }
          try {
            btn_down.addEventListener("mousedown", (e) => {
              var change = { "group": structuredClone(this.data.settings.group) };
              change.group[grp_name][property] = Math.max(0, Math.min(1, Math.round(10 * (change.group[grp_name][property] - .1)) / 10));
              this.btnClick(e, change);
            });
          } catch { console.warn(`Down btn element not found for ${grp_name}.${property}`); }
        }
      }
    }

    this.eventsSet = true;
  }
}
