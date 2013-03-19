
// Constants
const MIN_TOUCHES = 3;
const TOUCH_LIFE_TIME = 5;
//******
// width and height should be gotten from somewhere else!1
const KINECT_DEPTH_WIDTH = 160;
const KINECT_DEPTH_HEIGHT = 120;
const KINECT_PIXELS = KINECT_DEPTH_HEIGHT * KINECT_DEPTH_WIDTH;
//******

/**
 Touch constructor
 @param x, y Coordinates of the touch
 */
Touch = function(point) {
    this.point = {x: point.x, y: point.y};
    this.lifeTime = TOUCH_LIFE_TIME;
}


/**
 KinectTouchController constructor
 @param depthRef reference image used for depth thresholding
 */
KinectTouchController = function(depthRef, transform) {
    this.depthRef = depthRef;
    this.touch = null;
    this.touchData = new Array(KINECT_PIXELS);
    this.transform = transform;
}


/**
 Updates the state of the controller
 */
KinectTouchController.prototype.update = function(depthData) {
    this.updateTouchData(depthData);
    this.updateTouch();
}


/**
 Update the image representing current touch points
 */
KinectTouchController.prototype.updateTouchData = function(depthData) {
    var KINECT_PIXELS = KINECT_DEPTH_HEIGHT * KINECT_DEPTH_WIDTH;
    
    for (var i = 0; i < KINECT_PIXELS; i++) {
        this.touchData[i] = 0;
    }
    
    for (var y = 0, index = 0; y < KINECT_DEPTH_HEIGHT; y++) {
        for (var x = 0; x < KINECT_DEPTH_WIDTH; x++, index++) {
            
            var z = depthData[index];
            
            // Ignore points where depth data is missing
            if (z == 0)
                continue;
            
            // Compute the difference compared to the reference image
            var distance = this.depthRef[index] - z;
            
            var p = this.transform.transformPoint({x:x, y:y});
            
            if (p.x >= 0 && p.y >= 0 && p.x <= window.innerWidth && p.y <= window.innerHeight) {
                
                // A touch occurs at a certain depth threshold
                // (to be determined/calculated) :)
                if (distance > 10 && distance < 20) {
                    this.touchData[index] = 1;
                }
            }
        }
    }
}


/**
 Given an array with touch data, a 2D-point is returned,
 specifying where a touch occured
 (this requires that the touchData is up-to-date)
 */
KinectTouchController.prototype.updateTouch = function() {
    // Age the current touch
    if (this.touch) {
        this.touch.lifeTime--;
    }
    
    // Threshold value: at least this many touch points are
    // needed for a touch to occur
    var nrOfTouchPoints = 0;
    var xTotal = 0;
    var yTotal = 0;
    var index = 0;
    
    for (var currentRow = 0; currentRow < KINECT_DEPTH_HEIGHT; currentRow++) {
        for (var currentCol = 0; currentCol < KINECT_DEPTH_WIDTH; currentCol++) {
            
            if (this.touchData[index]) {
                nrOfTouchPoints++;
                xTotal += currentCol;
                yTotal += currentRow;
            }
            index++;
        }
    }
    
    // Check if enough touch points were found for it to
    // count as a touch
    if (nrOfTouchPoints > MIN_TOUCHES) {
        var xValue = Math.round(xTotal / nrOfTouchPoints);
        var yValue = Math.round(yTotal / nrOfTouchPoints);
        var touchPoint = {x: xValue + 10, y: yValue};
        
        touchPoint = this.transform.transformPoint(touchPoint);
        
        // If a touch already exists, update it
        if (this.touch) {
            this.touch.lifeTime = TOUCH_LIFE_TIME;
            // Check if it has moved
            if (this.touch.point.x != touchPoint.x ||
                this.touch.point.y != touchPoint.y)
            {
                this.touch.point = touchPoint;
                this.onMove(this.touch.point); // Move callback
            }
        }
        
        // If no touch exists, create a new one!
        else {
            this.touch = new Touch(touchPoint);
            this.onClick(this.touch.point); // Click callback
        }
        
        
    }
    
    if (this.touch && this.touch.lifeTime <= 0) {
        this.onRelease(this.touch.point); // Release callback
        this.touch = null;
    }
}


/*----------------------
 -- Callback functions --
 ----------------------*/

/**
 */
KinectTouchController.prototype.onClick = function(touchPoint) {
}


/**
 */
KinectTouchController.prototype.onMove = function(touchPoint) {
}


/**
 */
KinectTouchController.prototype.onRelease = function(touchPoint) {
}

