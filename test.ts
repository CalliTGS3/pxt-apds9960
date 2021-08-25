apds9960.Init()

basic.forever(function () {
    serial.writeLine("" + (apds9960.ReadRedColor()))
    serial.writeLine("" + (apds9960.ReadGreenColor()))
    serial.writeLine("" + (apds9960.ReadBlueColor()))
    serial.writeLine("" + (apds9960.ReadClear()))
    serial.writeLine("" + (apds9960.ReadProximity()))
    serial.writeLine("############")
    basic.pause(500)
})

