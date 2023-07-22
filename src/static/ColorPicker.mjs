export default class ColorPicker {
    constructor(controller) {
        this.controller = controller; // a reference to the ColorControls object
        try { this.settings = this.controller.data.settings; } // settings from the color scene (containing stored color and brightness values, and on/off value)
        catch(e) { this.settings = {color:null, brightness:null} } // if none were passed in the constructor, use null
        this.editorColor = {str:""}; // the color representing the current state of the color editor
        this.editorBrightness = 100; // the brightness representing the current state of the brightness editor

        // colors editor
        this.ce = {};
        this.ce.canvasContainer = document.getElementById("cp_colors_canvas_container");
        this.ce.canvas = document.getElementById("cp_colors_canvas"); // the canvas element
        this.ce.ctx = this.ce.canvas.getContext("2d"); // canvas context
        this.ce.indicator = document.getElementById("cp_colors_indicator");
        this.ce.indicatorPos = {x:0,y:0};

        // brightness editor
        this.be = {};
        this.be.canvasContainer = document.getElementById("cp_brightness_canvas_container");
        this.be.canvas = document.getElementById("cp_brightness_canvas"); // the canvas element
        this.be.ctx = this.be.canvas.getContext("2d"); // canvas context
        this.be.indicator = document.getElementById("cp_brightness_indicator");
        this.be.indicatorPos = 0;
        this.be.colorStr = "black";

        this.hexInput = document.querySelector("#cp_hex_input input");
        this.hexInputLabel = document.querySelector("#cp_hex_input .input_label");
        this.brtInput = document.querySelector("#cp_brt_input input");
        this.brtInputLabel = document.querySelector("#cp_brt_input .input_label");
        this.saveBtn = document.getElementById("cp_save_btn");


        this.create();
    }

    create() {
        // =========== set editor to saved color, if received =========== //
        try {
            let hex = this.settings.color;
            let brightness = this.settings.brightness;
            let rgb = this.HEXtoRGB(hex);
            let hsl = this.RGBtoHSL(rgb);
            console.log(JSON.stringify(hex));
            console.log(JSON.stringify(rgb));
            console.log(JSON.stringify(hsl));

            this.updateColorsEditor(this.getPositionFromColor(this.HEXtoHSL(hex)));
        } catch(e) {
            // no settings yet
            console.log(`Could not set initial indicator position: ${e}`);
        }

        // =========== set some styles =========== //
        this.ce.canvas.style.width = this.ce.canvas.width + 'px';
        this.ce.canvas.style.height = this.ce.canvas.height + 'px';
        this.ce.canvasContainer.style.width = this.ce.canvas.width + 'px';
        this.ce.canvasContainer.style.height = this.ce.canvas.height + 'px';
        this.be.canvas.style.width = this.be.canvas.width + 'px';
        this.be.canvas.style.height = this.be.canvas.height + 'px';
        this.be.canvasContainer.style.width = this.be.canvas.width + 'px';
        this.be.canvasContainer.style.height = this.be.canvas.height + 'px';


        // =========== set COLOR EDITOR events =========== //
        this.ce.canvasContainer.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.controller.showControls(); // to update the inactivity timeout which hides the control pane
            this.mouseDownInCE = true;
            this.updateColorsEditor({x:e.offsetX,y:e.offsetY});
        });
        // this.ce.canvasContainer.addEventListener("click", (e) => {
        //     e.stopPropagation(); // so as not to close the controls pane
        //     this.controller.showControls(); // to update the inactivity timeout which hides the control pane
        // });

        // =========== set BRIGHTNESS EDITOR events =========== //
        this.be.canvasContainer.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            this.controller.showControls(); // to update the inactivity timeout which hides the control pane
            this.mouseDownInBE = true;
            this.updateBrightnessEditor({position:e.offsetY});
        });
        // this.be.canvasContainer.addEventListener("click", (e) => {
        //     e.stopPropagation(); // so as not to close the controls pane
        //     this.controller.showControls(); // to update the inactivity timeout which hides the control pane
        // });

        // =========== events for BOTH =========== //
        window.addEventListener("mouseup", (e) => {
            e.stopPropagation();
            document.body.style.cursor = "default";
            this.mouseDownInCE = false;
            this.mouseDownInBE = false;

            // dispatch a synthetic mouse move event to start the cursor timeout
            let fakeMouseMove = new MouseEvent("mousemove", {
                view: window,
                bubbles: true,
                cancelable: true,
            });
            window.dispatchEvent(fakeMouseMove);
        });
        let CErect = this.ce.canvas.getBoundingClientRect();
        let BErect = this.be.canvas.getBoundingClientRect();
        document.body.addEventListener("mousemove", (e) => {
            if (this.controller.showing) {
                // if mouse is down, and was initially pressed on either color editor or brightness editor
                if (this.mouseDownInCE || this.mouseDownInBE) {
                    e.stopPropagation(); // to keep mouse from appearing upon movement
                    document.body.style.cursor = "none"; // disappear mouse
                    this.controller.showControls(); // to update the inactivity timeout which hides the control pane

                    if (this.mouseDownInCE) {
                        this.updateColorsEditor({x:e.pageX-CErect.x,y:e.pageY-CErect.y});
                    }
                    if (this.mouseDownInBE) {
                        this.updateBrightnessEditor({position:e.pageY-BErect.y});
                    }
    
                } else {
                    // the mouse is not down or was not initially pressed on either color editor or brightness editor
                    // so movement should allow the cursor to appear
                    // document.body.style.cursor = "default"; // <-- but actually this should already be taken care of, since we're not stopping propagation here
                }
            }
        });


        // =========== draw editor initial state =========== //
        this.drawColors();
    }

    // set editor to reflect the settings values
    initializeValuesFromSettings() {
        try {
            this.updateColorsEditor(this.getPositionFromColor(this.HEXtoHSL(this.settings.color)));
            this.updateBrightnessEditor({brightness: this.settings.brightness});
            this.updateHexInput(this.settings.color);
        } catch(e) {
            console.error(`ColorPicker unable to initialize values from settings due to error: ${e}`);
        }
    }

    drawColors() {
        let width = this.ce.canvas.width - 1;
        let height = this.ce.canvas.height - 1;
        for (let x=0; x<=width; x++) {
            let h = (x / width * 360).toFixed(3); // hue
            for (let y=0; y<=height; y++) {
                let l = ((1 - y / height) / 2 * 100 + 50).toFixed(3); // lightness
                // let l = ((1 - y / height) * 100).toFixed(3); // lightness
                // if (x==0) console.log(`hsl(${h} 100% ${l}%)`);
                this.ce.ctx.fillStyle = `hsl(${h} 100% ${l}%)`;
                this.ce.ctx.fillRect(x, y, 1, 1);
            }
        }
        // this.colorPickerImage = this.ce.canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
    }

    updateSettings(settings) {
        this.settings = {...settings};
    }

    updateHexInput(color) {
        // console.log(`color: ${JSON.stringify(color)}`);
        let hex;
        if (typeof color == "object" && color != null && Object.getOwnPropertyNames(color).includes("hue")) {
            hex = this.HSLtoHEX(color);
        } else if (typeof color == "string") {
            hex = color.replace("#","");
        } else {
            throw "ColorPicker.updateHexInput: ''color'' must be an HSL color object or a hex string";
        }

        this.hexInput.value = hex;
    }

    updateBrtInput({color: color, brightness: brightness} = {}) {
        // console.log(`color: ${JSON.stringify(color)}`);
        if (color) {
            this.brtInput.style.borderColor = color.str;
        }

        if (Number.isFinite(brightness)) {
            this.brtInput.value = brightness;
        }
    }


    updateColorsEditor(position) {
        if (position === null) {
            console.log("Unable to update color editor: no value given");
            this.ce.indicator.style.display = "none";
            return;
        }
        this.ce.indicator.style.display = "revert";

        // clamp position
        position = {x: this.clamp(position.x,0,this.ce.canvas.width-1), y: this.clamp(position.y,0,this.ce.canvas.height-1)};

        // get and store color
        this.editorColor = this.getColorFromPosition(position);

        // move indicator
        this.ce.indicatorPos = {...position};
        this.ce.indicator.style.left = this.ce.indicatorPos.x + 'px';
        this.ce.indicator.style.top  = this.ce.indicatorPos.y + 'px';

        // update color on various elements
        let h = this.editorColor.hue;
        let s = this.editorColor.saturation;
        let l = parseFloat(this.editorColor.lightness);
        let shadowAlpha = '0.3';
        let shadowColor = `hsl(${h} ${s}% ${l}% / ${shadowAlpha})`;
        let lightnessAdditive = this.editorColor.hue>=220 && this.editorColor.hue<=260 ? 30 : 25;
        let lighterColor = `hsl(${h} ${s}% ${this.clamp(l + lightnessAdditive * (Math.pow(100-l,3)/Math.pow(50,3)),0,100)}%)`;
        // console.log(`editorColor: ${this.editorColor.str}`);
        // console.log(`lighterColor: ${lighterColor}`);
        this.ce.canvasContainer.style.borderColor = this.editorColor.str;
        this.ce.indicator.style.backgroundColor = this.editorColor.str;
        this.ce.canvasContainer.style.boxShadow = `0 0 .3em .05em ${shadowColor}`;

        // update color on various other elements (not strictly part of the color editor)
        this.hexInput.style.borderColor = this.editorColor.str;
        this.saveBtn.style.borderColor = this.editorColor.str;
        this.saveBtn.style.color = lighterColor;
        this.hexInputLabel.style.color = lighterColor;
        this.brtInputLabel.style.color = lighterColor;

        // update the brightness editor as well (its background changes to match the selected color)
        this.updateBrightnessEditor();

        this.updateHexInput(this.editorColor);
        this.updateBrtInput({color: this.editorColor});
    }

    // if position (of indicator) is passed, find brightness from position, and update both;
    // if brightness is passed, find position (of indicator) from brightness, and update both;
    // if neither is passed, just update the color gradient background to match this.editorColor
    updateBrightnessEditor({position,brightness}={}) {
        // console.log('updateBrightnessEditor()...');

        // depending on whether position or brightness was passed to us,
        // derive the other
        if (Number.isFinite(position)) {
            // console.log("...by position");
            position = this.clamp(position,0,this.be.canvas.height-1);
            brightness = (1 - position / (this.be.canvas.height - 1)) * 100;
        } else if (Number.isFinite(brightness)) {
            // console.log("...by brightness");
            position = (100 - brightness) / 100 * (this.be.canvas.height - 1);
        }

        // store values if either one was given
        if (Number.isFinite(position) || Number.isFinite(brightness)) {
            this.be.indicatorPos = position;
            this.editorBrightness = Math.round(brightness);
            this.updateBrtInput({brightness: this.editorBrightness}); // update brightness input
        }

        // move indicator
        this.be.indicator.style.top = this.be.indicatorPos + 'px';
        this.be.indicator.style.backgroundColor = `hsl(0 0% ${this.be.editorBrightness*.8+10}%)`;

        // draw gradient bg if color has changed
        if (this.editorColor.str != this.be.colorStr) {
            // console.log(`...updating bg (this.editorColor.str == ${this.editorColor.str}, this.be.colorStr == ${this.be.colorStr})`);

            this.be.colorStr = this.editorColor.str;
            const grd = this.be.ctx.createLinearGradient(0, 0, 0, this.be.canvas.height);
            grd.addColorStop(0, this.be.colorStr || "white");
            grd.addColorStop(1, "black");
            this.be.ctx.fillStyle = grd;
            this.be.ctx.fillRect(0, 0, this.be.canvas.width, this.be.canvas.height);
        }
    }

    drawColorsIndicator() {
        // console.log(`drawing indicator at: ${JSON.stringify(this.ce.indicatorPos)}`);
        // this.ce.ctx.beginPath();
        // this.ce.ctx.arc(this.clamp(this.ce.indicatorPos.x,0,this.ce.canvas.width-1), this.clamp(this.ce.indicatorPos.y,0,this.ce.canvas.height-1), 6, 0, 2 * Math.PI);
        // this.ce.ctx.stroke();
    }

    // position param should be an object of form {x:[number],y:[number]}
    getColorFromPosition(position) {
        let width = this.ce.canvas.width - 1;
        let height = this.ce.canvas.height - 1;
        let h = (position.x / width * 360).toFixed(3); // hue
        let s = 100;
        let l = ((1 - position.y / height) / 2 * 100 + 50).toFixed(3); // lightness
        return this.HSL_obj(h,s,l);
    }

    // color param should be an object of form {hue:[number], saturation:[number], lightness:[number]} (with opt 'str' property)
    getPositionFromColor(hsl) {
        try {
            var h = hsl.hue % 360;
            var l = this.clamp(hsl.lightness,50,100); //Math.abs(hsl.lightness - 50) + 50;
        } catch(e) {
            return null;
        }

        let x = h / 360 * (this.ce.canvas.width-1);
        let y = (1 - (l - 50) / 100 * 2) * (this.ce.canvas.height-1);
        return {x:x,y:y}
    }

    getEditorColorHexString() {
        return this.HSLtoHEX(this.editorColor);
    }

    RGB_obj(r,g,b,a=null) {
        return {
            red: r,
            green: g,
            blue: b,
            str: a == null ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`,
        };
    }

    HSL_obj(h,s,l) {
        return {
            hue: h,
            saturation: s,
            lightness: l,
            str: `hsl(${h} ${s}% ${l}%)`,
        };
    }
  
    HEXtoHSL(hex) {
        return this.RGBtoHSL(this.HEXtoRGB(hex));
    }

    HEXtoRGB(hex) {
        if (typeof hex != "string")
            return null;

        hex = hex.replace('#','');
        let red = parseInt(hex.substring(0,2),16);
        let green = parseInt(hex.substring(2,4),16);
        let blue = parseInt(hex.substring(4,6),16);
        // console.log(`\nred: ${red}\ngrn: ${green}\nblu: ${blue}`);

        return this.RGB_obj(red,green,blue);
    }

    RGBtoHSL(rgb) {
        // borrowed (and modified) from https://www.w3schools.com/lib/w3color.js
        /* w3color.js ver.1.18 by w3schools.com (Do not remove this line) */

        try {
            var r = rgb.red;
            var g = rgb.green;
            var b = rgb.blue;
        } catch(e) {
            return null;
        }

        var min, max, i, l, s, maxcolor, h, rgb = [];
        rgb[0] = r / 255;
        rgb[1] = g / 255;
        rgb[2] = b / 255;
        min = rgb[0];
        max = rgb[0];
        maxcolor = 0;
        for (i = 0; i < rgb.length - 1; i++) {
            if (rgb[i + 1] <= min) {min = rgb[i + 1];}
            if (rgb[i + 1] >= max) {max = rgb[i + 1];maxcolor = i + 1;}
        }
        if (maxcolor == 0) {
            h = (rgb[1] - rgb[2]) / (max - min);
        }
        if (maxcolor == 1) {
            h = 2 + (rgb[2] - rgb[0]) / (max - min);
        }
        if (maxcolor == 2) {
            h = 4 + (rgb[0] - rgb[1]) / (max - min);
        }
        if (isNaN(h)) {h = 0;}
        h = h * 60;
        if (h < 0) {h = h + 360; }
        l = (min + max) / 2;
        if (min == max) {
            s = 0;
        } else {
            if (l < 0.5) {
                s = (max - min) / (max + min);
            } else {
                s = (max - min) / (2 - max - min);
            }
        }
        s = s * 100;
        l = l * 100;

        return this.HSL_obj(h,s,l);
    }

    HSLtoHEX(hsl) {
        // console.log(JSON.stringify(hsl));
        return this.RGBtoHEX(this.HSLtoRGB(hsl));
    }

    RGBtoHEX(rgb) {
        // console.log(JSON.stringify(rgb));

        // convert each primary component to a hexadecimal (integer) string
        let toHexStr = (c) => this.clamp(Math.round(parseFloat(c)),0,255).toString(16).padStart(2,'0');

        let r = toHexStr(rgb.red);
        let g = toHexStr(rgb.green);
        let b = toHexStr(rgb.blue);
        let hexStr = `${r}${g}${b}`;
        // console.log(hexStr);
        // console.log(JSON.stringify(this.HEXtoRGB(hexStr)));
        return hexStr;
    }

    HSLtoRGB(hsl) {
        // borrowed (and modified) from https://www.w3schools.com/lib/w3color.js
        /* w3color.js ver.1.18 by w3schools.com (Do not remove this line) */

        let hue = parseFloat(hsl.hue);
        let sat = parseFloat(hsl.saturation) / 100;
        let light = parseFloat(hsl.lightness) / 100;

        var t1, t2, r, g, b;
        hue = hue / 60;
        if ( light <= 0.5 ) {
            t2 = light * (sat + 1);
        } else {
            t2 = light + sat - (light * sat);
        }
        t1 = light * 2 - t2;
        r = hueToRgb(t1, t2, hue + 2) * 255;
        g = hueToRgb(t1, t2, hue) * 255;
        b = hueToRgb(t1, t2, hue - 2) * 255;

        return this.RGB_obj(r,g,b);
        
        function hueToRgb(t1, t2, hue) {
            if (hue < 0) hue += 6;
            if (hue >= 6) hue -= 6;
            if (hue < 1) return (t2 - t1) * hue + t1;
            else if(hue < 3) return t2;
            else if(hue < 4) return (t2 - t1) * (4 - hue) + t1;
            else return t1;
        }
    }

    clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }
}
  