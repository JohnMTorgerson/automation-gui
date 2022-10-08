import SceneWidget from './scene_widget.mjs';

(function main() {

document.body.style.fontSize = `${fontSize}px`;


// create widget objects for each scene
let widgets = [];
Object.keys(scenes).forEach((name) => {
  const scene = scenes[name];
  const widget = new SceneWidget(name,scene.route,scene.update,scene.property,scene.bg);
  widgets.push(widget);
});

// create some dummy widgets for testing purposes
for (let i=0; i<0; i++) {
  widgets.push(new SceneWidget(`scene${i}`));
}

// update the widgets now and at regular intervals hereafter
updateWidgets();
setInterval(updateWidgets,10000);

function updateWidgets() {
  widgets.forEach(widget => {
    let transform;

    // add any scene-specific display transformations for the data
    switch(widget.name) {
      case "sunlight" :
        transform = (data) => {
          return Math.round(parseFloat(data)) + '\u00A0K';
        };
        break;

      case "thermostat" :
        transform = (data) => {
          return Math.round(parseFloat(data)*10)/10 + '°';
        };
        break;

    }

    widget.update(transform);
  });
}
})();
