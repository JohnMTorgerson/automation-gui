from flask import Flask, render_template, url_for, request, jsonify
from pprint import pprint
import json
app = Flask(__name__)

width=800
height=480


# ====== MAIN SCREEN ====== #
@app.route('/')
def home():
    # some info for each scene to allow us to display a live widget for each one, which will also serve as a link to its own gui
    scenes = {
        "sunlight" : {
            "route" : '/scenes/sunlight',
            "update" : '/sunlight_update',
            "property" : 'current_temp',
            "bg" : "/static/images/sunlight-icon.png"
        },
        "thermostat" : {
            "route" : '/scenes/thermostat',
            "update" : '/thermostat_update',
            "property" : ['current','temp_f'],
            "bg" : "/static/images/thermostat-icon.png"
        }
    }

    return render_template('home.html', width=width, height=height, scenes=scenes)


# ====== SUNLIGHT SCENE ====== #

# sunlight gui route
@app.route('/scenes/sunlight')
def sunlight():
    warmest = 1900
    coldest = 6300
    time_res = 24 * 60 * 60 / width
    from lighting_scripts import sunlight_graphics as sg
    colors = sg.get_gradient_bg(height,warmest,coldest)

    return render_template('sunlight.html', name="Sunlight", width=width, height=height, colors=colors, warmest=warmest, coldest=coldest)

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

    return render_template('thermostat.html', name="Thermostat", width=width, height=height)

# thermostat scene AJAX data request
@app.route('/thermostat_update', methods=['POST','GET'])
def thermostat_update():

    try:
        with open("../../lighting-automation/src/data.json", "r") as f :
            therm_data = json.load(f)["scenes"]["thermostat"]
        results = therm_data
    except Exception as e:
        print(e)
        results = {"error" : e.message}

    return jsonify(results)

# relay control changes back to the automation controller
@app.route('/thermostat_control', methods=['POST'])
def thermostat_control():
    print("receiving control change from UI, writing to file...")
    settingsUpdate = request.get_json()

    # first, write settings update to the data.json file that we poll for updates
    try:
        with open("../../lighting-automation/src/data.json", "r+") as f :
            data = json.load(f)
            data["scenes"]["thermostat"]["settings"] = settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(data, f)
            print('wrote to data.json')

    except Exception as e:
        msg = f'Error retrieving/writing thermostat settings to data.json: {e}'
        print(msg)
        return msg

    # then, write to the actual thermostat settings file which permanently stores the data
    # (and is polled by the automation script every time it is run by the cron job)
    try:
        with open("../../lighting-automation/src/scenes/basic/thermostat/settings.json", "r+") as f :
            settings = json.load(f)
            settings |= settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(settings, f)
            print('wrote to settings.json')

    except Exception as e:
        msg = f'Error retrieving/writing thermostat settings to settings.json: {e}'
        print(msg)
        return msg



    return jsonify(settings)

if __name__ == '__main__':
   app.run(debug=True)
