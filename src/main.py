from flask import Flask, render_template, url_for, request, jsonify
from pprint import pprint
import json
app = Flask(__name__)

width=800
height=480

# ====== SUNLIGHT SCENE ====== #

# sunlight gui route
@app.route('/scenes/sunlight')
def sunlight():
    warmest = 1900
    coldest = 6300
    time_res = 24 * 60 * 60 / width
    from lighting_scripts import sunlight_graphics as sg
    colors = sg.get_gradient_bg(height,warmest,coldest)

    return render_template('sunlight.html', width=width, height=height, colors=colors, warmest=warmest, coldest=coldest)

# sunlight scene AJAX data request
@app.route('/sunlight_update', methods=['POST', 'GET'])
def sunlight_update():
    # if request.method == "POST":
    #     data = request.get_json()
    #     print(data)

    try:
        with open("../../lighting-automation/src/data.json", "r") as f :
            sunlight_data = json.load(f)["scenes"]["sunlight"]
        results = sunlight_data
    except Exception as e:
        results = {"error" : e}

    return jsonify(results)

# ====== THERMOSTAT SCENE ====== #

# thermostat gui route
@app.route('/scenes/thermostat')
def thermostat():

    return render_template('thermostat.html', width=width, height=height)

# thermostat scene AJAX data request
@app.route('/thermostat_update', methods=['POST', 'GET'])
def thermostat_update():
    try:
        with open("../../lighting-automation/src/data.json", "r") as f :
            therm_data = json.load(f)["scenes"]["thermostat"]
        results = therm_data
    except Exception as e:
        results = {"error" : e}

    return jsonify(results)


if __name__ == '__main__':
   app.run(debug=True)
