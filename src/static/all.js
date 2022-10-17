(function all() {


  // set the mouse cursor to appear when moved (but ideally only when using a mouse, more on that below)
  // and then set the mouse cursor to disappear after a second or two of inactivity
  let mouseTimer;
  let mouseCounter = 0;
  document.body.addEventListener("mousemove",(e) => {
    // we want the cursor to appear when using a mouse to press control buttons
    // on the GUI, but we don't want it to appear when using the touchscreen;
    // for now, we use a counter to make the distinction (so that the cursor only appears
    // if moved enough times, as would happen with a mouse, rather than jumping as would happen with a touch event)
    // in the future, we'll consider using mozInputSource instead of a counter:
    // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/mozInputSource
    if (mouseCounter > 10) {
      document.body.style.cursor = "default";
      try {
        document.querySelector("#nav").style.cursor = "pointer";
      } catch {
        // do nothing
      }
    }

    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => {
      document.body.style.cursor = "none";
      try {
        document.querySelector("#nav").style.cursor = "none";
      } catch {
        // do nothing
      }
      // document.body.style.setProperty("cursor", "none", "important");
      mouseCounter = 0;
    },2000)

    mouseCounter++;
  });
  // reset mouseCounter when a click happens, so that incidental movement from multiple touchscreen presses doesn't make the cursor appear
  document.querySelectorAll(".button").forEach(el => {
    el.addEventListener("click",(e) => {
      mouseCounter = 0;
    });
  });


})();
