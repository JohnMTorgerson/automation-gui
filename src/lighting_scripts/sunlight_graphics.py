# import PySimpleGUIQt as sg
import random
from .spec_to_rgb.convert_color import get_color

# w = 600 # window width
# h = 400 # window height
#
# warmest = 2400
# coldest = 5900

def get_gradient_bg(rows,warmest,coldest) :
    colors = []

    for row in range(rows) :
        # temp = row / rows * (coldest - warmest) + warmest
        temp = (1 - row / rows) * (coldest - warmest) + warmest
        color = get_color(temp)
        colors.append(color)

    # print(colors)

    return colors
