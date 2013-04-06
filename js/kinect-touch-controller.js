/**
 Requires image-handling.js
 */


// Constants
const MIN_TOUCHES = 3;
const TOUCH_LIFE_TIME = 2;
const CLICK_THRESHOLD = 3;
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
Touch = function(size, x, y, left, top, width, height) {
    this.size = size;
    this.point = {x: x, y: y};
    this.timeToLive = TOUCH_LIFE_TIME;
    this.bounds = {x: left, y: top, width: width, height: height};
    this.age = 0;
    
}


/**
 KinectTouchController constructor
 @param depthRef reference image used for depth thresholding
 @param transform An object used for coordinate conversion
 @parm touchDistance, interval Optional parameters used to set depth threshold values
 */
KinectTouchController = function(transformData) {
    this.depthRef = transformData.depthRef;
    this.transform = new Geometry.Transform(transformData.vectors[0],
                                            transformData.vectors[1]);
    this.touchDistance = transformData.touchDistance;
    this.interval = transformData.interval;
    this.xScale = transformData.xScale;
    
    this.touch = null;
    this.touchData = new Array(KINECT_PIXELS);
    this.buffer = new Array(KINECT_PIXELS); // buffer used for finding touches
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
    // Empty the touch data
    ImageHandling.fillWithValue(this.touchData, 0);
    for (var y = 0, index = 0; y < KINECT_DEPTH_HEIGHT; y++) {
        for (var x = 0; x < KINECT_DEPTH_WIDTH; x++, index++) {
            var z = depthData[index];
            // Ignore points where depth data is missing
            if (z == 0) continue;
            // Compute the difference compared to the reference image
            var distance = this.depthRef[index] - z;
            var p = this.transform.transformPoint({x:x, y:y});
            if (p.x >= 0 && p.y >= 0 && p.x <= window.innerWidth && p.y <= window.innerHeight) {
                // A touch occurs at a certain depth threshold
                // (to be determined/calculated) :)
                if (distance > this.touchDistance && distance < this.touchDistance + this.interval) {
                    this.touchData[index] = 1;
                }
            }
        }
    }
}

/**
 Simulate mouse events based on the touch data
 */
KinectTouchController.prototype.updateTouch = function() {
    var newTouch = this.detectLargestTouch();
    /*------------------------------
     == If no new touch is found: ==
     -----------------------------*/
    if (!newTouch) {
        if (this.touch) {
            this.touch.timeToLive--;
            if (this.touch.timeToLive <= 0) {
                //var event = (this.touch.age > CLICK_THRESHOLD) ? "mouseup" : "click";
                //this.simulateMouseEvent(this.touch.point, event);
                this.simulateMouseEvent(this.touch.point, "mouseup");
                this.touch = null;
            }
        }
        return;
    }
    /*-----------------------------
     == If a new touch is found: ==
     ----------------------------*/
    newTouch.point = this.transform.transformPoint(newTouch.point);
    
    // If a live touch exists:
    if (this.touch) {
        newTouch.age = this.touch.age;
        newTouch.age++;
        // Check if it has moved
        if (this.touch.point.x != newTouch.point.x ||
            this.touch.point.y != newTouch.point.y)
        {
            this.simulateMouseEvent(newTouch.point, "mousemove");
        }
    }
    // If no live touch exists:
    else {
        this.simulateMouseEvent(newTouch.point, "mousedown");
    }
    // Set the object's touch to the new one
    this.touch = newTouch;
}


/**
 Returns the largest Touch in the object's depth data
 */
KinectTouchController.prototype.detectLargestTouch = function() {
    var largestSize = 0;
    var largestTouch;
    // Empty the buffer
    ImageHandling.fillWithValue(this.buffer, 0);
    
    for (var y = 0; y < KINECT_DEPTH_HEIGHT; y++) {
        for (var x = 0; x < KINECT_DEPTH_WIDTH; x++) {
            var touch = this.getTouchAtPoint(x, y);
            if (touch && touch.size > largestSize) largestTouch = touch;
        }
    }
    return largestTouch;
}


/**
 Returns the largest Touch in the object's depth data
 */
KinectTouchController.prototype.getTouches = function() {
    var largestSize = 0;
    var largestTouch;
    // Empty the buffer
    ImageHandling.fillWithValue(this.buffer, 0);
    
	var touches = [];
	
    for (var y = 0; y < KINECT_DEPTH_HEIGHT; y++) {
        for (var x = 0; x < KINECT_DEPTH_WIDTH; x++) {
            var touch = this.getTouchAtPoint(x, y);
            if (touch) {
				touches.push(touch);
			}
        }
    }
    return touches;
}


/**
 If the point (x, y) in the object's touch data
 is part of a touch, return it
 */
KinectTouchController.prototype.getTouchAtPoint = function(x, y) {
    var n, index;
    var queue = [];
    
    queue.push({x: x, y: y});
    
    var size = 0;
    var xTotal = 0;
    var yTotal = 0;
    var leftMost = KINECT_DEPTH_WIDTH;
    var rightMost = 0;
    var upper = KINECT_DEPTH_HEIGHT;
    var lower = 0;
    
    while (queue.length > 0) {
        
        /* Set n to be the last element in queue,
         removing it from the queue */
        n = queue.pop();
        
        index = (n.y * KINECT_DEPTH_WIDTH + n.x);
        
        // Check if index is out of bounds
        if (index < 0 || index > this.touchData.length) {
            console.log("undefined");
            continue;
        }
        
        /* Check if the point defined by index is
         part of the current touch */
        if (this.touchData[index] == 1 && this.buffer[index] == 0) {
            this.buffer[index] = 1;
            size++;
            xTotal += n.x;
            yTotal += n.y;
            
            if (n.x < leftMost) leftMost = n.x;
            if (n.x > rightMost) rightMost = n.x;
            if (n.y > lower) lower = n.y;
            if (n.y < upper) upper = n.y;
            
            /*
             Add the points above surrounding this one
             */
            queue.push({x: n.x + 0, y: n.y + 1});
            queue.push({x: n.x + 1, y: n.y + 1});
            queue.push({x: n.x + 1, y: n.y + 0});
            queue.push({x: n.x + 1, y: n.y - 1});
            queue.push({x: n.x + 0, y: n.y - 1});
            queue.push({x: n.x - 1, y: n.y - 1});
            queue.push({x: n.x - 1, y: n.y + 0});
            queue.push({x: n.x - 1, y: n.y + 1});
        }
    }
    
    if (size > 0) {
        var touch = new Touch(
                              size,
                              xTotal / size,
                              yTotal / size,
                              leftMost,
                              upper,
                              rightMost - leftMost + 1,
                              lower - upper + 1
                              );
    }
    return touch;
}

/**
 Simulates a mouse event
 @param touchPoint The point ({x:x, y:y}) where the touch is simulated
 @param eventType A string specifying the type of event.
 */
KinectTouchController.prototype.simulateMouseEvent = function(touchPoint, eventType) {
    // Adjust x-value according to the calibration data
    touchPoint.x = touchPoint.x * this.xScale;
    
    var element = document.elementFromPoint(touchPoint.x, touchPoint.y);
    var event = document.createEvent("MouseEvents");
    
    // Decide the target that will dispatch the event;
    // it can be either an iFrame or the main element
    var target;

    if (element.tagName == "IFRAME") {
        var elementX = $(element).offset().left;
        var elementY = $(element).offset().top;
        
        touchPoint.x = touchPoint.x - elementX;
        touchPoint.y = touchPoint.y - elementY;
        target = element.contentDocument;
        
    } else {
        target = element;
    }
    event.initMouseEvent(eventType, true, true,
                         window, 0, 0, 0,
                         touchPoint.x,
                         touchPoint.y,
                         false, false, false,
                         false, 0, null);
    target.dispatchEvent(event);
};



