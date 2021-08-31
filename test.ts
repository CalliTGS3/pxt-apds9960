APDS9960.Init()

basic.forever(function () {
    serial.writeLine("" + (APDS9960.ReadRedColor()))
    serial.writeLine("" + (APDS9960.ReadGreenColor()))
    serial.writeLine("" + (APDS9960.ReadBlueColor()))
    serial.writeLine("" + (APDS9960.ReadClear()))
    serial.writeLine("" + (APDS9960.ReadProximity()))
    serial.writeLine("############")
    basic.pause(500)
})

