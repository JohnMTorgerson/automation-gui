#!/bin/bash

export PATH=~/.pyenv/shims:~/.pyenv/bin:"$PATH"

echo 'running automation-gui'
cd "$HOME"/Projects/automation-gui/src
python main.py

firefox-esr http://127.0.0.1:5000/scenes/thermostat
