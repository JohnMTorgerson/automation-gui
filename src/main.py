from configure_logging import logger
from flask import Flask, render_template, url_for, request, jsonify, make_response
import datetime
import json
import sys
import os
sys.path.insert(1, os.path.abspath('../../home-automation/home_automation'))
import home_automation

dir()

app = Flask(__name__)

width=800
height=480
home_auto_path = "../../home-automation/home_automation"

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
        "color" : {
            "route" : '/scenes/color',
            "update" : '/color_update',
            "property" : ['settings','color'],
            "bg" : ""
        },
        "thermostat" : {
            "route" : '/scenes/thermostat',
            "update" : '/thermostat_update',
            "property" : ['current','temp_f'],
            "bg" : "/static/images/thermostat-icon.png"
        },
        "clock" : {
            "route" : '/scenes/clock',
            "update" : '/clock_update',
            "property" : 'time',
            "bg" : ""
        },
    }

    return render_template('home.html', width=width, height=height, scenes=scenes)


# ====== SUNLIGHT SCENE ====== #

# sunlight gui route
@app.route('/scenes/sunlight')
def sunlight():
    logger.debug("====== Entering SUNLIGHT Scene ======")
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
    #     logger.debug(data)

    try:
        # with open(f"{home_auto_path}/data_2023-07-08-2122.json", "r") as f :
        with open(f"{home_auto_path}/data.json", "r") as f :
            sunlight_data = json.load(f)["scenes"]["sunlight"]
        results = sunlight_data
    except Exception as e:
        logger.error(repr(e))
        results = {"error" : repr(e)}

    return jsonify(results)

# relay control changes back to the automation controller
@app.route('/sunlight_control', methods=['POST'])
def sunlight_control(obj=None):
    logger.debug("receiving sunlight control change from UI, writing to file...")

    if obj is not None:
        settingsUpdate = obj
        reciprocate = False
    else:
        settingsUpdate = request.get_json()
        reciprocate = True

    logger.debug(f"updated sunlight settings requested by user are:\n{json.dumps(settingsUpdate)}")

    # first, write settings update to the data.json file that we poll for updates
    try:
        with open(f"{home_auto_path}/data.json", "r+") as f :
            data = json.load(f)

            # check if "on" setting has changed
            old_on = data["scenes"]["sunlight"]["settings"]["on"]
            try:
                new_on = settingsUpdate["on"]
            except KeyError as e:
                new_on = old_on

            # merge update
            data["scenes"]["sunlight"]["settings"] |= settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(data, f)
            logger.debug('successfully updated sunlight settings in data.json')

    except Exception as e:
        msg = f'Error retrieving/writing sunlight settings to data.json: {repr(e)}'
        logger.error(msg)
        return msg

    # then, write to the actual settings file which permanently stores the data
    # (and is polled by the automation script every time it is run by the cron job)
    try:
        with open(f"{home_auto_path}/scenes/timebased/sunlight/settings.json", "r+") as f :
            settings = json.load(f)
            settings |= settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(settings, f)
            logger.debug('successfully updated sunlight settings in settings.json')

    except Exception as e:
        msg = f'Error retrieving/writing sunlight settings to settings.json: {repr(e)}'
        logger.error(msg)
        return msg

    # if the sunlight scene is set to 'on', turn off the color scene
    # i.e. the color scene needs to be off if sunlight is on, but not vice versa
    #   (the 'reciprocate' flag is false if we were passed data through the 'obj' param, because that only happens
    #   if the color scene was turned off/on and is itself reciprocating to us,
    #   in which case we don't need to tell it to do anything)
    if reciprocate and new_on is True:
        color_control(obj={"on": False})

    # run the actual scene!!!
    if new_on is True:
        home_automation.sunlight_scene()



    return jsonify(settings)



# ====== COLOR SCENE ====== #

# sunlight gui route
@app.route('/scenes/color')
def color():
    logger.debug("====== Entering COLOR Scene ======")

    return render_template('color.html', name="Color", width=width, height=height)

# sunlight scene AJAX data request
@app.route('/color_update', methods=['POST', 'GET'])
def color_update():
    # if request.method == "POST":
    #     data = request.get_json()
    #     logger.debug(data)

    try:
        # with open(f"{home_auto_path}/data_2023-07-08-2122.json", "r") as f :
        with open(f"{home_auto_path}/data.json", "r") as f :
            color_data = json.load(f)["scenes"]["color"]
        results = color_data
    except Exception as e:
        logger.error(repr(e))
        results = {"error" : repr(e)}

    return jsonify(results)

# relay control changes back to the automation controller
@app.route('/color_control', methods=['POST'])
def color_control(obj=None):
    logger.debug("receiving color control change from UI, writing to file...")

    if obj is not None:
        reciprocate = False
        settingsUpdate = obj
    else:
        reciprocate = True
        settingsUpdate = request.get_json()

    logger.debug(f"updated color settings requested by user:\n{json.dumps(settingsUpdate)}")

    # first, write settings update to the data.json file that we poll for updates
    try:
        with open(f"{home_auto_path}/data.json", "r+") as f :
            data = json.load(f)

            # check if "on" setting has changed
            old_on = data["scenes"]["color"]["settings"]["on"]
            try:
                new_on = settingsUpdate["on"]
            except KeyError as e:
                new_on = old_on

            # merge update
            data["scenes"]["color"]["settings"] |= settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(data, f)
            logger.debug('successfully updated color settings in data.json')

    except Exception as e:
        msg = f'Error retrieving/writing color settings to data.json: {repr(e)}'
        logger.error(msg)
        return msg

    # then, write to the actual settings file which permanently stores the data
    # (and is polled by the automation script every time it is run by the cron job)
    try:
        with open(f"{home_auto_path}/scenes/basic/color/settings.json", "r+") as f :
            settings = json.load(f)
            settings |= settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(settings, f)
            logger.debug('successfully updated color settings in settings.json')

    except Exception as e:
        msg = f'Error retrieving/writing color settings to settings.json: {repr(e)}'
        logger.error(msg)
        return msg

    # if the on/off state of the color scene has changed, change the sunlight scene to the opposite state
    # i.e. the sunlight scene needs to be off if color is on, and vice versa;
    #   (the 'reciprocate' flag is false if we were passed data through the 'obj' param, because that only happens
    #   if the sunlight scene was turned off/on and is itself reciprocating to us,
    #   in which case we don't need to tell it to do anything)
    if reciprocate and new_on != old_on:
        sunlight_control(obj={"on": not new_on})

        # run the actual scene!!!
        if new_on is True:
            home_automation.color_scene()


    return jsonify(settings)



# ====== THERMOSTAT SCENE ====== #

# thermostat gui route
@app.route('/scenes/thermostat')
def thermostat():
    logger.debug("====== Entering THERMOSTAT Scene ======")
    return render_template('thermostat.html', name="Thermostat", width=width, height=height)

# thermostat scene AJAX data request
@app.route('/thermostat_update', methods=['POST','GET'])
def thermostat_update():

    try:
        with open(f"{home_auto_path}/data.json", "r") as f :
            therm_data = json.load(f)["scenes"]["thermostat"]
        results = therm_data
    except Exception as e:
        logger.error(repr(e))
        results = {"error" : repr(e)}

    return jsonify(results)

# relay control changes back to the automation controller
@app.route('/thermostat_control', methods=['POST'])
def thermostat_control():
    logger.debug("receiving thermostat control change from UI, writing to file...")
    settingsUpdate = request.get_json()
    logger.debug(f"updated settings requested by user:\n{json.dumps(settingsUpdate)}")


    # first, write settings update to the data.json file that we poll for updates
    try:
        with open(f"{home_auto_path}/data.json", "r+") as f :
            data = json.load(f)
            data["scenes"]["thermostat"]["settings"] |= settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(data, f)
            logger.debug('successfully updated thermostat settings in data.json')

    except Exception as e:
        msg = f'Error retrieving/writing thermostat settings to data.json: {repr(e)}'
        logger.error(msg)
        return msg

    # then, write to the actual thermostat settings file which permanently stores the data
    # (and is polled by the automation script every time it is run by the cron job)
    try:
        with open(f"{home_auto_path}/scenes/basic/thermostat/settings.json", "r+") as f :
            settings = json.load(f)
            settings |= settingsUpdate

            # delete file contents
            f.seek(0)
            f.truncate()

            # write updated data to file
            json.dump(settings, f)
            logger.debug('successfully updated thermostat settings in settings.json')

    except Exception as e:
        msg = f'Error retrieving/writing thermostat settings to settings.json: {repr(e)}'
        logger.error(msg)
        return msg



    return jsonify(settings)

# ====== CLOCK SCENE ====== #

# clock gui route
@app.route('/scenes/clock')
def clock():
    logger.debug("====== Entering CLOCK Scene ======")
    return render_template('clock.html', name="Clock", width=width, height=height)

# clock scene AJAX data request
@app.route('/clock_update', methods=['POST','GET'])
def clock_update():
    now = datetime.datetime.now()
    time = f"{now.hour:02d}:{now.minute:02d}"

    return jsonify({"time" : time})


if __name__ == '__main__':
   app.run(debug=True)
