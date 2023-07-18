export default class ColorPicker {
    constructor(canvas,controller) {
        this.controller = controller; // a reference to the ColorControls object
        this.canvas = canvas; // the canvas element
        this.ctx = this.canvas.getContext("2d"); // canvas context
        this.indicator = document.getElementById("cp_indicator");
        this.indicatorPos = {x:250,y:100}
        this.canvasContainer = document.getElementById("cp_canvas_container");

        this.initialize();
    }

    initialize() {
        // this.ctx.lineWidth = 3;
        // this.ctx.strokeStyle = "black";
        let rect = this.canvas.getBoundingClientRect();
        // console.log(JSON.stringify(rect));

        // console.log(`width: ${this.canvas.width}, height: ${this.canvas.height}`);

        this.canvasContainer.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.mouseDown = true;
            this.indicatorPos = {x: e.offsetX, y: e.offsetY}
            this.drawIndicator();
    });
        window.addEventListener("mouseup", (e) => {
            e.stopPropagation();
            this.mouseDown = false;
        });
        window.addEventListener("mousemove", (e) => {
            if (this.mouseDown) {
                this.indicatorPos = {x: e.pageX-rect.x, y: e.pageY-rect.y}
                this.drawIndicator();
            }
        });
        this.canvasContainer.addEventListener("click", (e) => {
            e.stopPropagation(); // so as not to close the controls pane
            this.controller.showControls(); // to update the inactivity timeout which hides the control pane
        });


        this.drawColors();
        this.drawIndicator();
    }

    drawColors() {
        let width = this.canvas.width - 1;
        let height = this.canvas.height - 1;
        for (let x=0; x<=width; x++) {
            let h = (x / width * 360).toFixed(3); // hue
            for (let y=0; y<=height; y++) {
                let l = ((1 - y / height) / 2 * 100 + 50).toFixed(3); // lightness
                // let l = ((1 - y / height) * 100).toFixed(3); // lightness
                // if (x==0) console.log(`hsl(${h} 100% ${l}%)`);
                this.ctx.fillStyle = `hsl(${h} 100% ${l}%)`;
                this.ctx.fillRect(x, y, 1, 1);
            }
        }
        // this.colorPickerImage = this.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    }

    drawIndicator() {
        console.log(`drawing indicator at: ${JSON.stringify(this.indicatorPos)}`);
        // this.ctx.beginPath();
        // this.ctx.arc(this.clamp(this.indicatorPos.x,0,this.canvas.width-1), this.clamp(this.indicatorPos.y,0,this.canvas.height-1), 6, 0, 2 * Math.PI);
        // this.ctx.stroke();
        this.indicator.style.left = this.clamp(this.indicatorPos.x,0,this.canvas.width) + 'px';
        this.indicator.style.top  = this.clamp(this.indicatorPos.y,0,this.canvas.height) + 'px';
    }
  
    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }
  }
  