import ColorControls from './ColorControls.mjs';

(function main() {

    const colorCtrls = new ColorControls();

    // dynamically load scene data from flask server
    window.fetchAndSaveData = async function () {
        // first, if a change was made (e.g. the user changed the temp threshold through the UI)
        // since the server was last polled, we need to update the server with the changes
        // before getting updated data from it
        if (colorCtrls.changed) {
        console.log("control change occurred, sending to server to save to file...")

        // send update to server to save to file
        const fetchRequest = {
            cache: "no-cache",
            method: "POST",
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(colorCtrls.data["settings"])
        }

        let response = await fetch('/color_control',fetchRequest);
        if (response.ok) {
            console.log("...sent to server");
        } else {
            console.log(response.status)
        }

        // change the flag back to false
        colorCtrls.changed = false;
        }


        // console.log('fetching data');

        fetch('/color_update')
        .then(async response => {
        if (response.ok) {
            let json = await response.json();

            updateData(json);
        } else {
            // do nothing and just wait until the next interval
            console.log(response.status)
        }
        }).catch(err => {
        console.error(err);
        });
    }

    window.updateData = async function (data) {
        // update data on control screen
        colorCtrls.updateCtrls(data);

        let container = document.getElementById("main_container");
        container.style.backgroundColor = `#${data.settings.color}`;
    };

    // =========================================== //

    // fetch data and save any data changes immediately on page load, and then at ten second intervals thereafter
    fetchAndSaveData();
    setTimeout(fetchAndSaveData,500); // annoying, but fonts used in the canvas may not be loaded on first draw; do this so we don't have to wait the full 10 seconds for the next update
    setInterval(fetchAndSaveData,10000);

})();

