import ShadesControls from './ShadesControls.mjs';

(function main() {

  // =================== set some styling variables =================== //

  const backgroundColor = (a) => `rgba(0,0,0,${isNaN(a) ? '1' : a})`;
  const mainColor = (a) => `rgba(50,255,50,${isNaN(a) ? '1' : a})`; // green
  const secondaryColor = (a) => `rgba(255,50,200,${isNaN(a) ? '.9' : a})`; // magenta
  const tertiaryColor = (a) => `rgba(255,220,50,${isNaN(a) ? '1' : a})`; // yellow
  const quaternaryColor = (a) => `rgba(200,50,255,${isNaN(a) ? '1' : a})`; // purple
  const blueColorAC = (a) => `rgba(100,100,255,${isNaN(a) ? '.45' : a})`;

  // let numberFont = "Open24";//"Twobit";//"Orbitron";
  // let bigNumberFont = "OdysseyHalf";
  // let biggerNumberFont = "OdysseyGrad";
  const font = "AdvancedDot";
  // const font1 = "MaximumSecurity";
  const font2 = "Twobit";
  const font3 = "Odyssey";
  // const font4 = "DeadCRT";
  const font5 = "WarGames";

  
  // set sizes
  setElementSizes();

  // create controls pane object (must be called after setElementSizes to set itself up to fit properly)
  const shadesCtrls = new ShadesControls();


  //=================================================//


  // dynamically load scene data from flask server
  window.fetchAndSaveData = async function (changed) {
    // first, if a change was made (e.g. the user changed something through the UI)
    // since the server was last polled, we need to update the server with the changes
    // before getting updated data from it
    if (changed) {
      console.log("control change occurred, sending to server...")

      // send update to server to save to file
      const fetchRequest = {
        cache: "no-cache",
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shadesCtrls.ctrlChange)
      }

      let response = await fetch('/shades_control',fetchRequest);
      if (response.ok) {
        console.log("...sent to server");
      } else {
        console.log(response.status)
      }
    }


    // then load data and settings from server
    console.log('fetching data from server');
    fetch('/shades_update')
    .then(async response => {
      if (response.ok) {
        let data = await response.json();

        if (!data.hasOwnProperty("error")) {
          updateData(data);
        } else {
          console.log(`Unable to retrieve data from file, waiting till next update cycle`);
        }

      } else {
        // do nothing and just wait until the next interval
        console.log(response.status)
      }
    }).catch(err => {
      console.error(err);
    });


  }

  function setElementSizes() {
    // const graph = document.getElementById("graph");
    // graph.width = graphWidth;
    // graph.height = graphHeight;

    // const tempLabels = document.getElementById("temp_labels");
    // tempLabels.width = (width - graphWidth) * 0.4;
    // tempLabels.height = graphHeight;

    // const humLabels = document.getElementById("hum_labels");
    // humLabels.width = (width - graphWidth) * 0.6;
    // humLabels.height = graphHeight;

    // const timeLabels = document.getElementById("time_labels");
    // timeLabels.width = graphWidth;
    // timeLabels.height = height - graphHeight;

    // const currentValues = document.getElementById("current_values");
    // currentValues.style.width = graphWidth - labelStyles.tickWidth*2 + 'px';
    // currentValues.style.height = graphHeight - labelStyles.tickWidth*2 + 'px';
    // currentValues.style.left = tempLabels.width + labelStyles.tickWidth + 'px';
    // currentValues.style.top = labelStyles.tickWidth + 'px';
  }

  // async function updateData(data) {
  window.updateData = async function (data) {
    // console.log("Updating...");
    // console.log(data);
    if (data.error) {
      document.getElementById('root').innerHTML = `Error fetching shades data: ${data.error}`;
      return;
    }

    // console.log(JSON.stringify(data.current));

    // update thresholds on control screen
    shadesCtrls.updateCtrls(data);


  }





  // =================================================== //
  // =================================================== //
  // =================================================== //
  // =================================================== //
  // =================================================== //



  // =================================================== //

  // fetch data and save any data changes immediately on page load, and then at ten second intervals thereafter
  fetchAndSaveData();
  setTimeout(fetchAndSaveData,500); // annoying, but fonts used in the canvas may not be loaded on first draw; do this so we don't have to wait the full 10 seconds for the next update
  setInterval(fetchAndSaveData,10000);
  

})();

