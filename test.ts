let mode = 0

APDS9960.onGesture(GESTURE_TYPE.Left, function () {
    serial.writeLine("Left")
})
APDS9960.onGesture(GESTURE_TYPE.Up, function () {
    serial.writeLine("Up")
})
APDS9960.onGesture(GESTURE_TYPE.Right, function () {
    serial.writeLine("Right")
})
input.onButtonPressed(Button.A, function () {
    mode = 0
    APDS9960.Init(SENSORINIT.Proximity)
})
APDS9960.onGesture(GESTURE_TYPE.Backward, function () {
    serial.writeLine("Backward")
})
input.onButtonPressed(Button.AB, function () {
    mode = 1
    APDS9960.Init(SENSORINIT.Gesture)
})
input.onButtonPressed(Button.B, function () {
    mode = 0
    APDS9960.Init(SENSORINIT.Color)
})
APDS9960.onGesture(GESTURE_TYPE.Down, function () {
    serial.writeLine("Down")
})
APDS9960.onGesture(GESTURE_TYPE.Forward, function () {
    serial.writeLine("Forward")
})
APDS9960.Init(SENSORINIT.None)
basic.forever(function () {
    if(mode == 0){
        serial.writeLine("Red:   " + APDS9960.ReadRedColor())
        serial.writeLine("Green: " + APDS9960.ReadGreenColor())
        serial.writeLine("Blue:  " + APDS9960.ReadBlueColor())
        serial.writeLine("Clear: " + APDS9960.ReadClear())
        serial.writeLine("Proximity: " + APDS9960.ReadProximity())
        serial.writeLine("###########################################")
    }
    basic.pause(1000)
})
