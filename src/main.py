import configure_logging
logger = configure_logging.configure(__name__)
from flask import Flask, render_template, url_for, request, jsonify, make_response
import datetime
import json
import sys
import os
sys.path.insert(1, os.path.abspath('../../home-automation/home_automation'))
import home_automation
from helpers import object_equals
import copy

# dir()

app = Flask(__name__)

width=1024 #800
height=600 #480
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
        "shades" : {
            "route" : '/scenes/shades',
            "update" : '/shades_update',
            "property" : 'status',
            "bg" : ""
        }
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
    logger.debug("#######################sunlight_control######################")
    logger.debug("receiving sunlight control change from UI, writing to file...")

    if obj is None:
        # the normal case in which no argument was passed because we got here from a post request
        settings_update = request.get_json()
        toggle_color = True
    else:
        # the abnormal case, in which this function was called within python
        # from color_control() with an obj argument provided;
        # in this case, we need to update the sunlight settings WITHOUT
        # toggling the color scene to the opposite "on" state
        settings_update = obj
        toggle_color = False


    logger.debug(f"updated sunlight settings requested by user are:\n{json.dumps(settings_update)}")

    # first, write settings update to the data.json file that we poll for updates
    try:
        with open(f"{home_auto_path}/data.json", "r+") as f :
            data = json.load(f)

            # check if "on" setting has changed
            old_on = data["scenes"]["sunlight"]["settings"]["on"]
            try:
                new_on = settings_update["on"]
            except KeyError as e:
                new_on = old_on

            # merge update
            data["scenes"]["sunlight"]["settings"] |= settings_update

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
        with open(f"{home_auto_path}/scenes/sunlight/settings.json", "r+") as f :
            settings = json.load(f)
            settings |= settings_update

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
    #   (the 'toggle_color' flag is false if we were passed data through the 'obj' param, because that only happens
    #   if the color scene was turned off/on and is itself reciprocating to us,
    #   in which case we don't need to tell it to do anything)
    if toggle_color and new_on:
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
    logger.debug("!!!!!!!!!!!!!!!!!color_control!!!!!!!!!!!!!!!!!!!!")
    logger.debug("receiving color control change from UI, writing to file...")

    if obj is None:
        # the normal case in which no argument was passed because we got here from a post request
        toggle_sunlight = True
        settings_update = request.get_json()
    else:
        # the abnormal case, in which this function was called within python with an obj argument provided
        toggle_sunlight = False
        settings_update = obj

    logger.debug(f"\ntoggle_sunlight: {toggle_sunlight}\nsettings_update: {json.dumps(settings_update)}")

    # logger.debug(f"updated color settings requested by user:\n{json.dumps(settings_update)}")

    # first, write settings update to the data.json file that we poll for updates
    try:
        with open(f"{home_auto_path}/data.json", "r+") as f :
            data = json.load(f)

            # to later check if settings have changed
            old_settings = copy.deepcopy(data["scenes"]["color"]["settings"])
            logger.debug(f"Old settings: {json.dumps(old_settings)}")
            
            # merge update
            data["scenes"]["color"]["settings"] |= settings_update

            # to later check if settings have changed
            new_settings = data["scenes"]["color"]["settings"]
            logger.debug(f"New settings: {json.dumps(new_settings)}")


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
        with open(f"{home_auto_path}/scenes/color/settings.json", "r+") as f :
            settings = json.load(f)
            settings |= settings_update

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
    #   (the 'toggle_sunlight' flag is false if we were passed data through the 'obj' param, because that only happens
    #   if the sunlight scene was turned off/on and is itself reciprocating to us,
    #   in which case we don't need to tell it to do anything)
    if toggle_sunlight and new_settings["on"] != old_settings["on"]:
        sunlight_control(obj={"on": not new_settings["on"]})

    # logger.debug(f"old: {old_settings}\nnew: {new_settings}")
    # logger.debug(f"object_equals: {object_equals(new_settings,old_settings)}")

    # run the actual scene!!!
    if new_settings["on"] is True and not object_equals(new_settings,old_settings):
        logger.debug(f"color scene is {'ON' if new_settings['on'] else 'OFF'} & new settings are {'THE SAME AS' if object_equals(new_settings,old_settings) else 'DIFFERENT THAN'} before, so running color scene...")
        home_automation.color_scene()
    else :
        logger.debug(f"color scene is {'ON' if new_settings['on'] else 'OFF'} & new settings are {'THE SAME AS' if object_equals(new_settings,old_settings) else 'DIFFERENT THAN'} before, so *not* running color scene...")


    return jsonify(settings)



# ====== THERMOSTAT SCENE ====== #

# thermostat gui route
@app.route('/scenes/thermostat')
def thermostat():
    logger.debug("====== Entering THERMOSTAT Scene ======")
    fontSize = height/20
    graphWidth = width - (6*fontSize)
    graphHeight = height - (3*fontSize)
    return render_template('thermostat.html', name="Thermostat", width=width, height=height, fontSize=fontSize, graphWidth=graphWidth, graphHeight=graphHeight)

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
    settings_update = request.get_json()
    logger.debug(f"updated settings requested by user:\n{json.dumps(settings_update)}")
    old_settings = None

    # first, write settings update to the data.json file that we poll for updates
    try:
        with open(f"{home_auto_path}/data.json", "r+") as f :
            data = json.load(f)
            old_settings = copy.deepcopy(data["scenes"]["thermostat"]["settings"])
            data["scenes"]["thermostat"]["settings"] |= settings_update

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
        new_settings = home_automation.thermostat_settings_change(settings_update)
    except Exception as e:
        msg = f'Error retrieving/writing thermostat settings to settings.json: {repr(e)}'
        logger.error(msg)
        return msg
    
        # run the actual scene!!!
    if old_settings is not None and not object_equals(new_settings,old_settings,blacklist=["show_weather_temp_value","show_weather_temp_graph","show_weather_hum_value","show_weather_hum_graph","use_abs_humidity"]):
        logger.debug(f"thermostat settings are DIFFERENT THAN before, so running thermostat scene...")
        home_automation.thermostat_scene()
    else :
        logger.debug(f"thermostat settings are THE SAME AS before, so *NOT* running thermostat scene...")


    return jsonify(new_settings)

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

# ====== SHADES SCENE ====== #

# shades gui route
@app.route('/scenes/shades')
def shades():
    logger.debug("====== Entering SHADES Scene ======")

    return render_template('shades.html', name="Shades", width=width, height=height)

# sunlight scene AJAX data request
@app.route('/shades_update', methods=['POST', 'GET'])
def shades_update():
    # if request.method == "POST":
    #     data = request.get_json()
    #     logger.debug(data)

    try:
        with open(f"{home_auto_path}/scenes/shades/record.json", "r") as f :
            shades_data = json.load(f)
        results = shades_data
    except Exception as e:
        logger.error(repr(e))
        results = {"error" : repr(e)}

    return jsonify(results)

# relay control changes back to the automation controller
@app.route('/shades_control', methods=['POST'])
def shades_control():
    logger.debug("receiving shades control change from UI...")
    ctrl_change = request.get_json()
    logger.debug(f"updated settings requested by user:\n{json.dumps(ctrl_change)}")

    # run the actual scene!!!
    home_automation.shades_scene(ctrl_change["dir"])

    return "success"

if __name__ == '__main__':
   app.run(debug=False,use_reloader=True)

