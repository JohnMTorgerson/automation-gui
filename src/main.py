from flask import Flask, render_template
from pprint import pprint
import json
app = Flask(__name__)

@app.route('/')
def index():
    warmest = 2200
    coldest = 6100
    width = 800
    height = 480
    time_res = 24 * 60 * 60 / width
    from lighting_scripts import sunlight_graphics as sg
    colors = sg.get_gradient_bg(height,warmest,coldest)
    with open("../../lighting-automation/src/data.json", "r") as f :
        curve_data = json.load(f)["sunlight_values"]

    pprint(curve_data)

    return render_template('index.html', width=width, height=height, colors=colors, curve_data=curve_data, warmest=warmest, coldest=coldest)

if __name__ == '__main__':
   app.run(debug=True)
