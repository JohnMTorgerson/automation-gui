export default class SceneWidget {
    constructor(name, route, updateRoute, property, bg) {
        this.name = name || ""; // the name of the scene (e.g. 'sunlight', 'thermostat')
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
        // this.element.setAttribute("title", this.name.replace(/\b\w/g,l=>l.toUpperCase()));
        this.element.style.backgroundImage = `url(${this.bg})`;
        document.getElementById('scenes').appendChild(this.element);

        // and a child element to contain the live data
        let dataEl = document.createElement('div');
        dataEl.classList.add('data');
        this.element.appendChild(dataEl);

        let nameEl = document.createElement('div');
        nameEl.classList.add('name');
        nameEl.innerHTML = this.name.replace(/\b\w/g, l => l.toUpperCase());
        this.element.appendChild(nameEl);

        this.setEvents(); // set mouse events on DOM objects
    }

    // get updated data from the scene for displaying on the widget;
    // take an optional transform function to alter the display of the data
    update(transform) {
        // then load data and settings from server
        // console.log(`updating widget info for ${this.name} scene`);
        fetch(this.updateRoute)
            .then(async response => {
                if (response.ok) {
                    let data = await response.json();

                    // traverse down the data object to get the property we want, and save it in this.info
                    let temp = data;
                    this.property.forEach((prop) => { temp = temp[prop] });
                    this.info = temp;
                    // console.log(`updated info for ${this.name} widget is ${temp}`);

                    // find out if the scene is "on" and pass to the transform function, if there is one
                    // so that it can display something different when on vs. off if it wants
                    let on = null;
                    try {
                        on = data.settings.on;
                    } catch (e) {
                        // no "on" setting, so leave null
                    }

                    if (typeof transform === "function") {
                        this.info = transform(this.info,on);
                    }

                    // place the updated data inside the data element
                    this.element.querySelector('.data').innerHTML = this.info;

                    // set font size relative to element size
                    let rect = this.element.getBoundingClientRect();
                    this.element.style.fontSize = `${rect.width / 5}px`;

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
        this.element.addEventListener("click", (e) => {
            window.location.href = this.route;
        });
    }
}
