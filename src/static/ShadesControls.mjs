import Controls from "./Controls.mjs";

export default class ShadesControls extends Controls {
  // get json data from home-automation;
  // called every update interval by fetchData() in shades.js
  updateCtrls(data) {
    super.updateCtrls(data);

    if (!this.eventsSet) { this.setEvents(); }

  }

  // !!!!! TEMPORARY, TO STOP AUTOHIDE !!!!!! //
  showControls() {
    super.showControls();
    clearTimeout(this.hideDelay);
  }

  setElementSizes() {
    super.setElementSizes();
  }

  // set mouse events for touchscreen interaction
  setEvents() {
    super.setEvents();

    if (this.data === undefined || this.eventsSet) {
      console.warn("setEvents() NOT firing");
      return;
    }

    // control buttons
    document.querySelector("#controls_container .button.up").addEventListener("mousedown", (e) => {
      this.btnClick(e,{"dir":"up"});
    });
      document.querySelector("#controls_container .button.down").addEventListener("mousedown", (e) => {
        this.btnClick(e,{"dir":"down"});
    });

    this.eventsSet = true;
  }

    saveCtrlChange(delay) {
        // clear any previous changes that were waiting to be made
        clearTimeout(this.saveDelay);

        // console.log(`this.ctrlChange == ${JSON.stringify(this.ctrlChange)}`);

        // combine settings change with existing settings
        // this.data["settings"] = { ...this.data["settings"], ...this.ctrlChange }

        // console.log(`New this.data.settings == ${JSON.stringify(this.data.settings)}`);

        // update the controls GUI now instead of waiting for the delay (below)
        this.updateCtrls();

        // update the server (and the UI in the scene script) with the updated data
        // using a small delay to allow multiple presses without submitting to the server for every single one;
        // if a delay is not passed or is out of range, use the default below
        if (!Number.isFinite(delay) || delay < 0 || delay > 10000) {
            delay = 1200;
        }
        this.saveDelay = setTimeout(() => {
            console.log(`this.ctrlChange == ${JSON.stringify(this.ctrlChange)}`);
            console.log("saving change...")
            window.parent.fetchAndSaveData(true);
        }, delay);
    }

}
