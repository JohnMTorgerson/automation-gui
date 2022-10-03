export default class SceneWidget {
  constructor(name, route, updateRoute, property, bg) {
    this.name = name; // the name of the scene (e.g. 'sunlight', 'thermostat')
    this.route = route; // the url of this scene
    this.updateRoute = updateRoute; // the url to get the scene's information from the automation program
    this.bg = bg; // the url of the background image
    this.property = typeof property === "string" ? [property] : (Array.isArray(property) ? property : null); // the property to display on the widget, of the data gathered from the updateRoute; an array of property names to iterate down within the object
    this.info = ""; // will hold the information to display on the widget

    // create HTML element for the widget
    this.element = document.createElement('div');
    this.element.id = this.name;
    this.element.classList.add('scene_widget');
    this.element.classList.add('button');
    this.element.style.backgroundImage = `url(${this.bg})`;
    this.element.style.fontSize = `${fontSize}px`;
    document.getElementById('scenes').appendChild(this.element);
    // and a child element to contain the live data
    let dataEl = document.createElement('div');
    dataEl.classList.add('data');
    this.element.appendChild(dataEl);

    // this.setEvents(); // set mouse events on DOM objects
  }

  // get updated data from the scene for displaying on the widget;
  // take an optional transform function to alter the display of the data
  update(transform) {
    // then load data and settings from server
    console.log(`updating widget info for ${this.name} scene`);
    fetch(this.updateRoute)
    .then(async response => {
      if (response.ok) {
        let data = await response.json();

        // traverse down the data object to get the property we want, and save it in this.info
        let temp = data;
        this.property.forEach((prop) => {temp = temp[prop]});
        this.info = temp;
        console.log(`updated info for ${this.name} widget is ${temp}`);

        if (typeof transform === "function") {
          this.info = transform(this.info);
        }

        // place the updated data inside the data element
        this.element.querySelector('.data').innerHTML = this.info;

      } else {
        console.log(response.status)
      }
      return response.status;
    }).catch(err => {
      console.error(err);
      return err;
    });
  }

  // set mouse events for touchscreen interaction
  setEvents() {
    // // clicking anywhere on the canvas_container shows controls
    // const canvas = document.getElementById("canvas_container");
    // canvas.addEventListener('click', (e) => {
    //
    //   this.showControls(e);
    // });
    //
    // // clicking anywhere on the controls (except buttons) hides controls
    // const controls = document.getElementById("controls_container");
    // controls.addEventListener('click', (e) => {
    //   this.hideControls(e);
    // });
    //
    // // control buttons
    // document.querySelector("#temp_controls .button.up").addEventListener("click", (e) => {this.btnClick(e,'temp_target',1);});
    // document.querySelector("#temp_controls .button.down").addEventListener("click", (e) => {this.btnClick(e,'temp_target',-1);});
    // document.querySelector("#hum_controls .button.up").addEventListener("click", (e) => {this.btnClick(e,'hum_target',1);});
    // document.querySelector("#hum_controls .button.down").addEventListener("click", (e) => {this.btnClick(e,'hum_target',-1);});
    // document.querySelector("#onoff_switch").addEventListener("click", (e) => {this.switchClick(e);});

  }

  btnClick(e,prop,amount) {
    // e.stopPropagation(); // so that clicking it doesn't hide the controls view
    // console.log(`${prop} change by ${amount}`);
    //
    // // we call showControls just to reset the hideDelay timer
    // this.showControls();
    //
    // this.ctrlChange = {};
    // this.ctrlChange[prop] = amount + this.data.settings[prop];
    // console.log(`New ${prop}: ${this.ctrlChange[prop]}`);
    // this.saveCtrlChange();
  }
}
