(function main(){
  document.body.style.fontSize = `${fontSize}px`;
  updateClock();
  setInterval(updateClock,9000);
})();

function updateClock() {
  const el = document.getElementById("clock");
  // const now = new Date();
  // el.innerHTML = `${now.getHours()}:${now.getMinutes().toString().padStart(2,"0")}`

  // load data from server;
  // we're getting the time from the server instead of doing it clientside
  // really only because the "home" screen needs to get the scene's data (in this case the time)
  // from the server
  // console.log('fetching data');
  fetch('/clock_update')
  .then(async response => {
    if (response.ok) {
      let data = await response.json();

      el.innerHTML = data.time;

    } else {
      // do nothing and just wait until the next interval
      console.log(response.status)
    }
  }).catch(err => {
    console.error(err);
  });

}
