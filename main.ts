/**
 * APDS9960 Sensor
 */

 enum SENSORINIT{
    //% block=None
    None = 0,
    //% block=Proximity
    Proximity = 1,
    //% block=Gesture
    Gesture = 2,
    //% block=Color
    Color = 3
}

enum GESTURE_TYPE {
    //% block=none
    None = 0,
    //% block=right
    Right = 1,
    //% block=left
    Left = 2,
    //% block=up
    Up = 3,
    //% block=down
    Down = 4,
    //% block=near
    Forward = 5,
    //% block=far
    Backward = 6
}

//% color="#31C7D5" weight=10 icon="\uf2a7" block="APDS9960"
namespace APDS9960 {
    const ADDR = 0x39
    const APDS9960_RAM = 0x00
    const APDS9960_ENABLE = 0x80
    const APDS9960_ATIME = 0x81
    const APDS9960_WTIME = 0x83
    const APDS9960_AILTIL = 0x84
    const APDS9960_AILTH = 0x85
    const APDS9960_AIHTL = 0x86
    const APDS9960_AIHTH = 0x87
    const APDS9960_PILT = 0x89
    const APDS9960_PIHT = 0x8B
    const APDS9960_PERS = 0x8C
    const APDS9960_CONFIG1 = 0x8D
    const APDS9960_PPULSE = 0x8E
    const APDS9960_CONTROL = 0x8F
    const APDS9960_CONFIG2 = 0x90
    const APDS9960_ID = 0x92
    const APDS9960_STATUS = 0x93
    const APDS9960_CDATAL = 0x94
    const APDS9960_CDATAH = 0x95
    const APDS9960_RDATAL = 0x96
    const APDS9960_RDATAH = 0x97
    const APDS9960_GDATAL = 0x98
    const APDS9960_GDATAH = 0x99
    const APDS9960_BDATAL = 0x9A
    const APDS9960_BDATAH = 0x9B
    const APDS9960_PDATA = 0x9C
    const APDS9960_POFFSET_UR = 0x9D
    const APDS9960_POFFSET_DL = 0x9E
    const APDS9960_CONFIG3 = 0x9F
    const APDS9960_GPENTH = 0xA0
    const APDS9960_GEXTH = 0xA1
    const APDS9960_GCONF1 = 0xA2
    const APDS9960_GCONF2 = 0xA3
    const APDS9960_GOFFSET_U = 0xA4
    const APDS9960_GOFFSET_D = 0xA5
    const APDS9960_GOFFSET_L = 0xA7
    const APDS9960_GOFFSET_R = 0xA9
    const APDS9960_GPULSE = 0xA6
    const APDS9960_GCONF3 = 0xAA
    const APDS9960_GCONF4 = 0xAB
    const APDS9960_GFLVL = 0xAE
    const APDS9960_GSTATUS = 0xAF
    const APDS9960_IFORCE = 0xE4
    const APDS9960_PICLEAR = 0xE5
    const APDS9960_CICLEAR = 0xE6
    const APDS9960_AICLEAR = 0xE7
    const APDS9960_GFIFO_U = 0xFC
    const APDS9960_GFIFO_D = 0xFD
    const APDS9960_GFIFO_L = 0xFE
    const APDS9960_GFIFO_R = 0xFF

    function i2cwrite(addr: number, reg: number, value: number) {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(addr, buf)
    }

    function i2cread(addr: number, reg: number) {
        pins.i2cWriteNumber(addr, reg, NumberFormat.UInt8BE);
        let val = pins.i2cReadNumber(addr, NumberFormat.UInt8BE);
        return val;
    }
    
    function rgb2hue(r: number, g: number, b: number): number {
        // no float support for pxt ts
        r = r * 100 / 255;
        g = g * 100 / 255;
        b = b * 100 / 255;

        let max = Math.max(r, Math.max(g, b))
        let min = Math.min(r, Math.min(g, b))
        let c = max - min;
        let hue = 0;
        let segment = 0;
        let shift = 0;
        if (c != 0) {
            switch (max) {
                case r:
                    segment = (g - b) * 100 / c;
                    shift = 0;       // R° / (360° / hex sides)
                    if (segment < 0) {          // hue > 180, full rotation
                        shift = 360 / 60;         // R° / (360° / hex sides)
                    }
                    hue = segment + shift;
                    break;
                case g:
                    segment = (b - r) * 100 / c;
                    shift = 200;     // G° / (360° / hex sides)
                    hue = segment + shift;
                    break;
                case b:
                    segment = (r - g) * 100 / c;
                    shift = 400;     // B° / (360° / hex sides)
                    hue = segment + shift;
                    break;
            }

        }
        return hue * 60/100;
    }

    let currentMode = SENSORINIT.None

    //% blockId=APDS9960_init block="APDS9960 Init |%sensor"
    //% weight=100
    export function Init(sensor: SENSORINIT): void {
        i2cwrite(ADDR, APDS9960_ATIME, 252) // default inte time 4x2.78ms
        i2cwrite(ADDR, APDS9960_CONTROL, 0x03) // todo: make gain adjustable
        i2cwrite(ADDR, APDS9960_ENABLE, 0x00) // put everything off
        i2cwrite(ADDR, APDS9960_GCONF4, 0x00) // disable gesture mode
        i2cwrite(ADDR, APDS9960_AICLEAR, 0x00) // clear all interrupt
        
        gestureRuns = false
        
        switch(sensor){
            case SENSORINIT.Proximity:
                currentMode = SENSORINIT.Proximity
                proximityInit()
                break;
            case SENSORINIT.Gesture:
                currentMode = SENSORINIT.Gesture
                gestureInit()
                break;
            case SENSORINIT.Color:
                currentMode = SENSORINIT.Color
                colorInit()
                break;
            default:
        }
    }

    function colorInit(): void {
        // power on
        i2cwrite(ADDR, APDS9960_ENABLE, 0x03) // enable ALS,PROX,GESTURE
    }

    function proximityInit(): void {
        // power on
        i2cwrite(ADDR, APDS9960_ENABLE, 0x05) // enable ALS,PROX,GESTURE
    }
    /**
     * Gets APDS9960 CHIP ID
     * It should return 0xAB or 171
     */
    //% blockId=APDS9960_getid block="ID"
    //% weight=99
    //% advanced=true
    export function ReadId(): number {
        let chipid = i2cread(ADDR, APDS9960_ID);
        return chipid;
    }

    //% blockId=APDS9960_readhue block="APDS9960 Get Hue"
    //% weight=98
    export function ReadHue(): number {
        if(!(currentMode == SENSORINIT.Color)){
            return 0
        }
        let tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        while(!tmp){
            basic.pause(5);
            tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        }
        let c = i2cread(ADDR, APDS9960_CDATAL) + i2cread(ADDR, APDS9960_CDATAH)*256;
        let r = i2cread(ADDR, APDS9960_RDATAL) + i2cread(ADDR, APDS9960_RDATAH)*256;
        let g = i2cread(ADDR, APDS9960_GDATAL) + i2cread(ADDR, APDS9960_GDATAH)*256;
        let b = i2cread(ADDR, APDS9960_BDATAL) + i2cread(ADDR, APDS9960_BDATAH)*256;
        // map to rgb based on clear channel
        let avg = c/3;
        r = r*255/avg;
        g = g*255/avg;
        b = b*255/avg;
        let hue = rgb2hue(r,g,b);
        return hue
    }
    //% blockId=APDS9960_readred block="APDS9960 Get red Color"
    //% weight=98
    export function ReadRedColor(): number {
        if(!(currentMode == SENSORINIT.Color)){
            return 0
        }
        let tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        while(!tmp){
            basic.pause(5);
            tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        }
        let r = i2cread(ADDR, APDS9960_RDATAL) + i2cread(ADDR, APDS9960_RDATAH)*256;
        return r
    }
    //% blockId=APDS9960_readgreen block="APDS9960 Get green Color"
    //% weight=98
    export function ReadGreenColor(): number {
        if(!(currentMode == SENSORINIT.Color)){
            return 0
        }
        let tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        while(!tmp){
            basic.pause(5);
            tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        }
        let g = i2cread(ADDR, APDS9960_GDATAL) + i2cread(ADDR, APDS9960_GDATAH)*256;
        return g
    }
    //% blockId=APDS9960_readblue block="APDS9960 Get blue Color"
    //% weight=98
    export function ReadBlueColor(): number {
        if(!(currentMode == SENSORINIT.Color)){
            return 0
        }
        let tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        while(!tmp){
            basic.pause(5);
            tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        }
        let b = i2cread(ADDR, APDS9960_BDATAL) + i2cread(ADDR, APDS9960_BDATAH)*256;
        return b
    }
    //% blockId=APDS9960_readclear block="APDS9960 Get Clear"
    //% weight=98
    export function ReadClear(): number {
        if(!(currentMode == SENSORINIT.Color)){
            return 0
        }
        let tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        while(!tmp){
            basic.pause(5);
            tmp = i2cread(ADDR, APDS9960_STATUS) & 0x1;
        }
        let c = i2cread(ADDR, APDS9960_CDATAL) + i2cread(ADDR, APDS9960_CDATAH)*256;
        return c
    }
    //% blockId=APDS9960_readproximity block="APDS9960 Get Proximity"
    //% weight=98
    export function ReadProximity(): number {
        if(!(currentMode == SENSORINIT.Proximity)){
            return 0
        }
        let tmp = i2cread(ADDR, APDS9960_STATUS) & 0x2;
        while(!tmp){
            basic.pause(5);
            tmp = i2cread(ADDR, APDS9960_STATUS) & 0x2;
        }
        let p = i2cread(ADDR, APDS9960_PDATA);
        return p
    }
    //##############################################################

    enum DIR {
        DIR_NONE,
        DIR_LEFT,
        DIR_RIGHT,
        DIR_UP,
        DIR_DOWN,
        DIR_NEAR,
        DIR_FAR,
        DIR_ALL
    }
    enum STATE {
        NA_STATE,
        NEAR_STATE,
        FAR_STATE,
        ALL_STATE
    }
    

    /* Gesture parameters */
    let GESTURE_THRESHOLD_OUT = 30;
    let GESTURE_SENSITIVITY_1 = 33
    let GESTURE_SENSITIVITY_2 = 18

    /* Error code for returned values */
    //ERROR = 0xFF

    /* On/Off definitions */
    let OFF = 0;
    let ON = 1;

    /* Acceptable parameters for setMode */
    let POWER = 0
    let AMBIENT_LIGHT = 1
    let PROXIMITY = 2
    let WAIT = 3
    let AMBIENT_LIGHT_INT = 4
    let PROXIMITY_INT = 5
    let GESTURE = 6
    let ALL = 7

    /* LED Drive values */
    let LED_DRIVE_100MA = 0
    let LED_DRIVE_50MA = 1
    let LED_DRIVE_25MA = 2
    let LED_DRIVE_12_5MA = 3

    /* Proximity Gain (PGAIN) values */
    let PGAIN_1X = 0
    let PGAIN_2X = 1
    let PGAIN_4X = 2
    let PGAIN_8X = 3

    /* ALS Gain (AGAIN) values */
    let AGAIN_1X = 0
    let AGAIN_4X = 1
    let AGAIN_16X = 2
    let AGAIN_64X = 3

    /* Gesture Gain (GGAIN) values */
    let GGAIN_1X = 0
    let GGAIN_2X = 1
    let GGAIN_4X = 2
    let GGAIN_8X = 3

    /* LED Boost values */
    let LED_BOOST_100 = 0
    let LED_BOOST_150 = 1
    let LED_BOOST_200 = 2
    let LED_BOOST_300 = 3

    /* Gesture wait time values */
    let GWTIME_0MS = 0
    let GWTIME_2_8MS = 1
    let GWTIME_5_6MS = 2
    let GWTIME_8_4MS = 3
    let GWTIME_14_0MS = 4
    let GWTIME_22_4MS = 5
    let GWTIME_30_8MS = 6
    let GWTIME_39_2MS = 7

    /* Default values */
    let DEFAULT_ATIME = 219     // 103ms
    let DEFAULT_WTIME = 246     // 27ms
    let DEFAULT_PROX_PPULSE = 0x87    // 16us, 8 pulses
    let DEFAULT_GESTURE_PPULSE = 0x89    // 16us, 10 pulses
    let DEFAULT_POFFSET_UR = 0       // 0 offset
    let DEFAULT_POFFSET_DL = 0       // 0 offset      
    let DEFAULT_CONFIG1 = 0x60    // No 12x wait (WTIME) factor
    let DEFAULT_LDRIVE = LED_DRIVE_100MA
    let DEFAULT_PGAIN = PGAIN_4X
    let DEFAULT_AGAIN = AGAIN_4X
    let DEFAULT_PILT = 0       // Low proximity threshold
    let DEFAULT_PIHT = 50      // High proximity threshold
    let DEFAULT_AILT = 0xFFFF  // Force interrupt for calibration
    let DEFAULT_AIHT = 0
    let DEFAULT_PERS = 0x11    // 2 consecutive prox or ALS for int.
    let DEFAULT_CONFIG2 = 0x01    // No saturation interrupts or LED boost  
    let DEFAULT_CONFIG3 = 0       // Enable all photodiodes, no SAI
    let DEFAULT_GPENTH = 40      // Threshold for entering gesture mode
    let DEFAULT_GEXTH = 30      // Threshold for exiting gesture mode    
    let DEFAULT_GCONF1 = 0x40    // 4 gesture events for int., 1 for exit
    let DEFAULT_GGAIN = GGAIN_4X
    let DEFAULT_GLDRIVE = LED_DRIVE_100MA
    let DEFAULT_GWTIME = GWTIME_2_8MS
    let DEFAULT_GOFFSET = 0       // No offset scaling for gesture mode
    let DEFAULT_GPULSE = 0xC9    // 32us, 10 pulses
    let DEFAULT_GCONF3 = 0       // All photodiodes active during gesture
    let DEFAULT_GIEN = 0       // Disable gesture interrupts

    /* Misc parameters */
    let FIFO_PAUSE_TIME = 30      // Wait period (ms) between FIFO reads


    /* Container for gesture data */
    export class gesture_data_type {
        u_data: Buffer;
        d_data: Buffer;
        l_data: Buffer;
        r_data: Buffer;
        index: number;
        total_gestures: number;
        in_threshold: number;
        out_threshold: number;
    }

    let gesture_data = new gesture_data_type;

    let data_buf: Buffer = pins.createBuffer(128);

    export class APDS9960class{
      

       
        gesture_ud_delta: number;
        gesture_lr_delta: number;
        gesture_ud_count: number;
        gesture_lr_count: number;
        gesture_near_count: number;
        gesture_far_count: number;
        gesture_state: number;
        gesture_motion: number;

        APDS9960ReadReg(addr: number): number {
            let buf: Buffer = pins.createBuffer(1);
            buf[0] = addr;
            pins.i2cWriteBuffer(0x39, buf, false);
            buf = pins.i2cReadBuffer(0x39, 1, false);
            return buf[0];
        }

        APDS9960WriteReg(addr: number, cmd: number) {
            let buf2: Buffer = pins.createBuffer(2);

            buf2[0] = addr;
            buf2[1] = cmd;

            pins.i2cWriteBuffer(0x39, buf2, false);
        }


        /**
         * @brief Reads a block (array) of bytes from the I2C device and register
         *
         * @param[in] reg the register to read from
         * @param[out] val pointer to the beginning of the data
         * @param[in] len number of bytes to read
         * @return Number of bytes read. -1 on read error.
         */
        APDS9960ReadRegBlock(addr: number, len: number): number {
            let i: number = 0;
            let y: number = 0;

            for (let j = 0; j < len; j = j + 4) {

                data_buf[j] = this.readi2c(0xFc);
                data_buf[j + 1] = this.readi2c(0xFd);
                data_buf[j + 2] = this.readi2c(0xFe);
                data_buf[j + 3] = this.readi2c(0xFf);
                basic.pause(10);

            }


            return len;
        }

        getMode(): number {
            let enable_value: number;

            /* Read current ENABLE register */
            enable_value = this.APDS9960ReadReg(0x80);
            return enable_value;
        }

        setMode(mode: number, enable: number) {
            let reg_val: number;
            /* Read current ENABLE register */
            reg_val = this.getMode();
            /* Change bit(s) in ENABLE register */
            enable = enable & 0x01;
            if (mode >= 0 && mode <= 6) {
                if (enable) {
                    reg_val |= (1 << mode);
                } else {
                    //reg_val &= ~(1 << mode);
                    reg_val = 0x00;
                }
            } else if (mode == ALL) {
                if (enable) {
                    reg_val = 0x7F;
                } else {
                    reg_val = 0x00;
                }
            }

            /* Write value back to ENABLE register */
            this.APDS9960WriteReg(0x80, reg_val);
        }

        /**
         * @brief Sets the gain of the photodiode during gesture mode
         *
         * Value    Gain
         *   0       1x
         *   1       2x
         *   2       4x
         *   3       8x
         *
         * @param[in] gain the value for the photodiode gain
         * @return True if operation successful. False otherwise.
         */
        setGestureGain(gain: number) {
            let val: number;

            /* Read value from GCONF2 register */
            val = this.APDS9960ReadReg(0xA3);

            /* Set bits in register to given value */
            gain &= 0b00000011;
            gain = gain << 5;
            val &= 0b10011111;
            val |= gain;

            /* Write register value back into GCONF2 register */
            this.APDS9960WriteReg(0xA3, val);
        }

        /**
         * @brief Sets the LED drive current during gesture mode
         *
         * Value    LED Current
         *   0        100 mA
         *   1         50 mA
         *   2         25 mA
         *   3         12.5 mA
         *
         * @param[in] drive the value for the LED drive current
         * @return True if operation successful. False otherwise.
         */
        setGestureLEDDrive(drive: number) {
            let val2: number;

            /* Read value from GCONF2 register */
            val2 = this.APDS9960ReadReg(0xA3);

            /* Set bits in register to given value */
            drive &= 0b00000011;
            drive = drive << 3;
            val2 &= 0b11100111;
            val2 |= drive;

            /* Write register value back into GCONF2 register */
            this.APDS9960WriteReg(0xA3, val2);
        }

        /**
         * @brief Sets the LED current boost value
         *
         * Value  Boost Current
         *   0        100%
         *   1        150%
         *   2        200%
         *   3        300%
         *
         * @param[in] drive the value (0-3) for current boost (100-300%)
         * @return True if operation successful. False otherwise.
         */
        setLEDBoost(boost: number) {
            let val3: number;

            /* Read value from CONFIG2 register */
            val3 = this.APDS9960ReadReg(0x90);

            /* Set bits in register to given value */
            boost &= 0b00000011;
            boost = boost << 4;
            val3 &= 0b11001111;
            val3 |= boost;

            /* Write register value back into CONFIG2 register */
            this.APDS9960WriteReg(0x90, val3);
        }

        /**
         * @brief Sets the time in low power mode between gesture detections
         *
         * Value    Wait time
         *   0          0 ms
         *   1          2.8 ms
         *   2          5.6 ms
         *   3          8.4 ms
         *   4         14.0 ms
         *   5         22.4 ms
         *   6         30.8 ms
         *   7         39.2 ms
         *
         * @param[in] the value for the wait time
         * @return True if operation successful. False otherwise.
         */
        setGestureWaitTime(time: number) {
            let val4: number;

            /* Read value from GCONF2 register */
            val4 = this.APDS9960ReadReg(0xA3);

            /* Set bits in register to given value */
            time &= 0b00000111;
            val4 &= 0b11111000;
            val4 |= time;

            /* Write register value back into GCONF2 register */
            this.APDS9960WriteReg(0xA3, val4);
        }

        /**
         * @brief Turns gesture-related interrupts on or off
         *
         * @param[in] enable 1 to enable interrupts, 0 to turn them off
         * @return True if operation successful. False otherwise.
         */
        setGestureIntEnable(enable: number) {
            let val5: number;

            /* Read value from GCONF4 register */
            val5 = this.APDS9960ReadReg(0xAB);

            /* Set bits in register to given value */
            enable &= 0b00000001;
            enable = enable << 1;
            val5 &= 0b11111101;
            val5 |= enable;

            /* Write register value back into GCONF4 register */
            this.APDS9960WriteReg(0xAB, val5);
        }

        /**
         * @brief Resets all the parameters in the gesture data member
         */
        resetGestureParameters() {

            gesture_data.index = 0;
            gesture_data.total_gestures = 0;

            this.gesture_ud_delta = 0;
            this.gesture_lr_delta = 0;

            this.gesture_ud_count = 0;
            this.gesture_lr_count = 0;

            this.gesture_near_count = 0;
            this.gesture_far_count = 0;

            this.gesture_state = 0;
            this.gesture_motion = DIR.DIR_NONE;

        }

        /**
         * @brief Tells the state machine to either enter or exit gesture state machine
         *
         * @param[in] mode 1 to enter gesture state machine, 0 to exit.
         * @return True if operation successful. False otherwise.
         */
        setGestureMode(mode: number) {
            let val6: number;

            /* Read value from GCONF4 register */
            val6 = this.APDS9960ReadReg(0xAB);

            /* Set bits in register to given value */
            mode &= 0b00000001;
            val6 &= 0b11111110;
            val6 |= mode;

            /* Write register value back into GCONF4 register */
            this.APDS9960WriteReg(0xAB, val6);
        }

        /**
         * Turn the APDS-9960 on
         *
         * @return True if operation successful. False otherwise.
         */
        enablePower() {
            this.setMode(POWER, 1);
        }

        /**
         * @brief Starts the gesture recognition engine on the APDS-9960
         *
         * @param[in] interrupts true to enable hardware external interrupt on gesture
         * @return True if engine enabled correctly. False on error.
         */
        enableGestureSensor(interrupts: boolean) {

            /* Enable gesture mode
            Set ENABLE to 0 (power off)
            Set WTIME to 0xFF
            Set AUX to LED_BOOST_300
            Enable PON, WEN, PEN, GEN in ENABLE 
            */
            this.resetGestureParameters();
            this.APDS9960WriteReg(0x83, 0xFF);
            this.APDS9960WriteReg(0x8E, DEFAULT_GESTURE_PPULSE);
            this.setLEDBoost(LED_BOOST_300);
            if (interrupts) {
                this.setGestureIntEnable(1);
            } else {
                this.setGestureIntEnable(0);
            }
            this.setGestureMode(1);
            this.enablePower();
            this.setMode(WAIT, 1)
            this.setMode(PROXIMITY, 1);
            this.setMode(GESTURE, 1);
        }

        pads9960_init() {

            let aa = this.APDS9960ReadReg(0X92);
            if (aa == 0xAB) {
                this.APDS9960WriteReg(0xA0, DEFAULT_GPENTH);//0x28
                this.APDS9960WriteReg(0xA1, DEFAULT_GEXTH);//0x1e
                this.APDS9960WriteReg(0xA2, DEFAULT_GCONF1);//0x40
                this.setGestureGain(DEFAULT_GGAIN);//0x41
                this.setGestureLEDDrive(DEFAULT_GLDRIVE);
                this.setGestureWaitTime(DEFAULT_GWTIME);
                this.APDS9960WriteReg(0xA4, DEFAULT_GOFFSET);
                this.APDS9960WriteReg(0xA5, DEFAULT_GOFFSET);
                this.APDS9960WriteReg(0xA7, DEFAULT_GOFFSET);
                this.APDS9960WriteReg(0xA9, DEFAULT_GOFFSET);
                this.APDS9960WriteReg(0xA6, DEFAULT_GPULSE);//0xc9
                this.APDS9960WriteReg(0xAA, DEFAULT_GCONF3);//00
                this.setGestureIntEnable(DEFAULT_GIEN);
            }


        }

        /**
         * @brief Determines if there is a gesture available for reading
         *
         * @return True if gesture available. False otherwise.
         */
        isGestureAvailable(): boolean {
            let val8: number;

            /* Read value from GSTATUS register */
            val8 = this.APDS9960ReadReg(0xAF);
            /* Shift and mask out GVALID bit */
            val8 &= 0b00000001;

            /* Return true/false based on GVALID bit */
            if (val8 == 1) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * @brief Processes the raw gesture data to determine swipe direction
         *
         * @return True if near or far state seen. False otherwise.
         */
        processGestureData(): boolean {
            let u_first: number = 0;
            let d_first: number = 0;
            let l_first: number = 0;
            let r_first: number = 0;
            let u_last: number = 0;
            let d_last: number = 0;
            let l_last: number = 0;
            let r_last: number = 0;
            let ud_ratio_first: number;
            let lr_ratio_first: number;
            let ud_ratio_last: number;
            let lr_ratio_last: number;
            let ud_delta: number;
            let lr_delta: number;
            let k: number;

            /* If we have less than 4 total gestures, that's not enough */
            if (gesture_data.total_gestures <= 4) {
                return false;
            }

            /* Check to make sure our data isn't out of bounds */
            if ((gesture_data.total_gestures <= 32) && (gesture_data.total_gestures > 0)) {

                /* Find the first value in U/D/L/R above the threshold */
                for (k = 0; k < gesture_data.total_gestures; k++) {
                    if ((gesture_data.u_data[k] > GESTURE_THRESHOLD_OUT) &&
                        (gesture_data.d_data[k] > GESTURE_THRESHOLD_OUT) &&
                        (gesture_data.l_data[k] > GESTURE_THRESHOLD_OUT) &&
                        (gesture_data.r_data[k] > GESTURE_THRESHOLD_OUT)) {

                        u_first = gesture_data.u_data[k];
                        d_first = gesture_data.d_data[k];
                        l_first = gesture_data.l_data[k];
                        r_first = gesture_data.r_data[k];
                        break;
                    }
                }

                /* If one of the _first values is 0, then there is no good data */
                if ((u_first == 0) || (d_first == 0) || (l_first == 0) || (r_first == 0)) {

                    return false;
                }
                /* Find the last value in U/D/L/R above the threshold */
                for (k = gesture_data.total_gestures - 1; k >= 0; k--) {


                    if ((gesture_data.u_data[k] > GESTURE_THRESHOLD_OUT) &&
                        (gesture_data.d_data[k] > GESTURE_THRESHOLD_OUT) &&
                        (gesture_data.l_data[k] > GESTURE_THRESHOLD_OUT) &&
                        (gesture_data.r_data[k] > GESTURE_THRESHOLD_OUT)) {

                        u_last = gesture_data.u_data[k];
                        d_last = gesture_data.d_data[k];
                        l_last = gesture_data.l_data[k];
                        r_last = gesture_data.r_data[k];
                        break;
                    }
                }
            }

            /* Calculate the first vs. last ratio of up/down and left/right */
            ud_ratio_first = ((u_first - d_first) * 100) / (u_first + d_first);
            lr_ratio_first = ((l_first - r_first) * 100) / (l_first + r_first);
            ud_ratio_last = ((u_last - d_last) * 100) / (u_last + d_last);
            lr_ratio_last = ((l_last - r_last) * 100) / (l_last + r_last);
            if (ud_ratio_first == 0 && lr_ratio_first == 0 && ud_ratio_last == 0 && lr_ratio_last == 0) {

                this.pads9960_init();
                this.enableGestureSensor(false);
            }


            /* Determine the difference between the first and last ratios */
            ud_delta = ud_ratio_last - ud_ratio_first;
            lr_delta = lr_ratio_last - lr_ratio_first;


            /* Accumulate the UD and LR delta values */
            this.gesture_ud_delta += ud_delta;
            this.gesture_lr_delta += lr_delta;

            /* Determine U/D gesture */
            if (this.gesture_ud_delta >= GESTURE_SENSITIVITY_1) {
                this.gesture_ud_count = 1;
            } else if (this.gesture_ud_delta <= -GESTURE_SENSITIVITY_1) {
                this.gesture_ud_count = -1;
            } else {
                this.gesture_ud_count = 0;
            }

            /* Determine L/R gesture */
            if (this.gesture_lr_delta >= GESTURE_SENSITIVITY_1) {
                this.gesture_lr_count = 1;
            } else if (this.gesture_lr_delta <= -GESTURE_SENSITIVITY_1) {
                this.gesture_lr_count = -1;
            } else {
                this.gesture_lr_count = 0;
            }

            /* Determine Near/Far gesture */
            if ((this.gesture_ud_count == 0) && (this.gesture_lr_count == 0)) {
                if ((Math.abs(ud_delta) < GESTURE_SENSITIVITY_2) && (Math.abs(lr_delta) < GESTURE_SENSITIVITY_2)) {

                    if ((ud_delta == 0) && (lr_delta == 0)) {
                        this.gesture_near_count++;
                    } else if ((ud_delta != 0) || (lr_delta != 0)) {
                        this.gesture_far_count++;
                    }

                    if ((this.gesture_near_count >= 10) && (this.gesture_far_count >= 2)) {
                        if ((ud_delta == 0) && (lr_delta == 0)) {
                            this.gesture_state = STATE.NEAR_STATE;
                        } else if ((ud_delta != 0) && (lr_delta != 0)) {
                            this.gesture_state = STATE.FAR_STATE;
                        }
                        return true;
                    }
                }
            } else {
                if ((Math.abs(ud_delta) < GESTURE_SENSITIVITY_2) && (Math.abs(lr_delta) < GESTURE_SENSITIVITY_2)) {

                    if ((ud_delta == 0) && (lr_delta == 0)) {
                        this.gesture_near_count++;
                    }

                    if (this.gesture_near_count >= 10) {
                        this.gesture_ud_count = 0;
                        this.gesture_lr_count = 0;
                        this.gesture_ud_delta = 0;
                        this.gesture_lr_delta = 0;
                    }
                }
            }



            return true;
        }

        /**
         * @brief Determines swipe direction or near/far state
         *
         * @return True if near/far event. False otherwise.
         */
        decodeGesture(): boolean {


            //("gesture_state"+gesture_state);
            // serial.writeLine("gesture_ud_count: "+gesture_ud_count+" ; "+"gesture_lr_count: "+gesture_lr_count);
            /* Return if near or far event is detected */
            if (this.gesture_state == STATE.NEAR_STATE) {
                this.gesture_motion = DIR.DIR_NEAR;
                return true;
            } else if (this.gesture_state == STATE.FAR_STATE) {
                this.gesture_motion = DIR.DIR_FAR;
                return true;
            }

            /* Determine swipe direction */
            if ((this.gesture_ud_count == -1) && (this.gesture_lr_count == 0)) {
                this.gesture_motion = DIR.DIR_UP;
            } else if ((this.gesture_ud_count == 1) && (this.gesture_lr_count == 0)) {
                this.gesture_motion = DIR.DIR_DOWN;
            } else if ((this.gesture_ud_count == 0) && (this.gesture_lr_count == 1)) {
                this.gesture_motion = DIR.DIR_RIGHT;
            } else if ((this.gesture_ud_count == 0) && (this.gesture_lr_count == -1)) {
                this.gesture_motion = DIR.DIR_LEFT;
            } else if ((this.gesture_ud_count == -1) && (this.gesture_lr_count == 1)) {
                if (Math.abs(this.gesture_ud_delta) > Math.abs(this.gesture_lr_delta)) {
                    this.gesture_motion = DIR.DIR_UP;
                } else {
                    this.gesture_motion = DIR.DIR_RIGHT;
                }
            } else if ((this.gesture_ud_count == 1) && (this.gesture_lr_count == -1)) {
                if (Math.abs(this.gesture_ud_delta) > Math.abs(this.gesture_lr_delta)) {
                    this.gesture_motion = DIR.DIR_DOWN;
                } else {
                    this.gesture_motion = DIR.DIR_LEFT;
                }
            } else if ((this.gesture_ud_count == -1) && (this.gesture_lr_count == -1)) {
                if (Math.abs(this.gesture_ud_delta) > Math.abs(this.gesture_lr_delta)) {
                    this.gesture_motion = DIR.DIR_UP;
                } else {
                    this.gesture_motion = DIR.DIR_LEFT;
                }
            } else if ((this.gesture_ud_count == 1) && (this.gesture_lr_count == 1)) {
                if (Math.abs(this.gesture_ud_delta) > Math.abs(this.gesture_lr_delta)) {
                    this.gesture_motion = DIR.DIR_DOWN;
                } else {
                    this.gesture_motion = DIR.DIR_RIGHT;
                }
            } else {
                return false;
            }

            return true;
        }
        /**
         * @brief Processes a gesture event and returns best guessed gesture
         *
         * @return Number corresponding to gesture. -1 on error.
         */
        readGesture(): number {
            let fifo_level: number = 0;
            let bytes_read: number = 0;
            let fifo_data: number[] = [];
            let gstatus: number;
            let motion: number;
            let l: number;
            //resetGestureParameters();
            gesture_data.d_data = pins.createBuffer(32);
            gesture_data.u_data = pins.createBuffer(32);
            gesture_data.l_data = pins.createBuffer(32);
            gesture_data.r_data = pins.createBuffer(32);
            //("read sensor start");
            /* Make sure that power and gesture is on and data is valid */
            if (!this.isGestureAvailable() || !(this.getMode() & 0b01000001)) {
                return DIR.DIR_NONE;
            }

            /* Keep looping as long as gesture data is valid */
            while (1) {
                basic.pause(30);
                /* Get the contents of the STATUS register. Is data still valid? */
                gstatus = this.APDS9960ReadReg(0xAF);
                /* If we have valid data, read in FIFO */
                if ((gstatus & 0b00000001) == 0b00000001) {
                    /* Read the current FIFO level */
                    fifo_level = this.APDS9960ReadReg(0xAE);

                    /* If there's stuff in the FIFO, read it into our data block */
                    if (fifo_level > 0) {
                        bytes_read = this.APDS9960ReadRegBlock(0xFC,
                            (fifo_level * 4));

                        for (let m = 0; m < bytes_read; m++) {

                            fifo_data[m] = data_buf[m];
                        }

                        if (bytes_read >= 4) {
                            for (let ii = 0; ii < bytes_read; ii = ii + 4) {
                                gesture_data.u_data[gesture_data.index] = fifo_data[ii + 0];
                                gesture_data.d_data[gesture_data.index] = fifo_data[ii + 1];
                                gesture_data.l_data[gesture_data.index] = fifo_data[ii + 2];
                                gesture_data.r_data[gesture_data.index] = fifo_data[ii + 3];
                                gesture_data.index++;
                                gesture_data.total_gestures++;
                            }

                            /* Filter and process gesture data. Decode near/far state */
                            if (this.processGestureData()) {
                                if (this.decodeGesture()) {
                                    motion = this.gesture_motion;
                                    this.resetGestureParameters();
                                    return motion;
                                }
                            }
                            /* Reset data */
                            gesture_data.index = 0;
                            gesture_data.total_gestures = 0;
                        }

                    }

                }
                else {
                    /* Determine best guessed gesture and clean up */
                    basic.pause(30);
                    this.decodeGesture();
                    motion = this.gesture_motion;


                    this.resetGestureParameters();
                    return motion;
                }

            }

            motion = this.gesture_motion;
            return motion;
        }

        read(): number {
            if(!(currentMode == SENSORINIT.Gesture)){
                return 0
            }
            let result = GESTURE_TYPE.None;
            switch (this.readGesture()) {
                case DIR.DIR_UP:
                    result = GESTURE_TYPE.Up;
                    break;
                case DIR.DIR_DOWN:
                    result = GESTURE_TYPE.Down;
                    break;
                case DIR.DIR_LEFT:
                    result = GESTURE_TYPE.Left;
                    break;
                case DIR.DIR_RIGHT:
                    result = GESTURE_TYPE.Right;
                    break;
                case DIR.DIR_NEAR:
                    result = GESTURE_TYPE.Forward;
                    break;
                case DIR.DIR_FAR:
                    result = GESTURE_TYPE.Backward;
                    break;
                default:

            }
            return result;
        }


        readi2c(addr: number): number {
            return this.APDS9960ReadReg(addr);
        }


    }//end class APDS9960

    let gestureRuns = false
    /**
     * Monitors gestures and triggers an event.
     */
    //% blockId="gesture_init" block="Initialize Gesture"
    function gestureInit(){
        gestureRuns = true
        let apds9960 = new APDS9960class();
        apds9960.pads9960_init();
        apds9960.enableGestureSensor(false);
        basic.pause(100);

        //initiate gesture monitoring
        control.inBackground(() => {
            let prevGst = GESTURE_TYPE.None;
            while (gestureRuns) {
                let gst = apds9960.read();
               // basic.showNumber(gst);
                if (gst != prevGst) {
                    prevGst = gst;
                    control.raiseEvent(3100, gst, EventCreationMode.CreateAndFire);

                }
                basic.pause(50);
            }
        })
       // return apds9960;
    }


    /**
     * Exekutes the programm in the block on gesture event.
     * @param gesture type of gesture to detect
     * @param handler code to run
     */
    //% blockId="gesture_listener_block" block="onGesture |%gesture"
    export function onGesture(gesture: GESTURE_TYPE, handler: () => void) {
        control.onEvent(3100, gesture, handler);
    }

    //##############################################################
}

