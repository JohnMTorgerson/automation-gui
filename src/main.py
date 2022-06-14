from flask import Flask, render_template, url_for, request, jsonify
from pprint import pprint
import json
app = Flask(__name__)

# sunlight scene
@app.route('/scenes/sunlight')
def sunlight():
    warmest = 1900
    coldest = 6300
    width = 800
    height = 480
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

if __name__ == '__main__':
   app.run(debug=True)
