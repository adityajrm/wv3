import cec
import subprocess

cec.init()

def send_key(key):
    subprocess.run(['xdotool', 'key', key])

while True:
    event = cec.get_event()
    if event is None:
        continue

    if event == cec.CEC_USER_CONTROL_CODE.UP:
        send_key('Up')
    elif event == cec.CEC_USER_CONTROL_CODE.DOWN:
        send_key('Down')
    elif event == cec.CEC_USER_CONTROL_CODE.LEFT:
        send_key('Left')
    elif event == cec.CEC_USER_CONTROL_CODE.RIGHT:
        send_key('Right')
    elif event == cec.CEC_USER_CONTROL_CODE.SELECT:
        send_key('Return')