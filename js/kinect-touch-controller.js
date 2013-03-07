
// Constants
const minTouches = 5;

/**
 Constructor
 @param refImage reference image used for depth thresholding
 */
KinectTouchController = function(refImage) {
    this.listener = listener;
    this.refImage = refImage;
    this.point2D = {x: null, y: null};
    this.touchData = null;
}


/**
 Updates the state of the controller
 */
KinectTouchController.prototype.update(depthData) {
    updateTouchData();
    updateTouchPoint();
    
    if (lala) {
        this.onTouch();
    }
    
    else if (lolo) {
        this.onTouchMoved();
    }
    
    else if (lili) {
        this.onTouchReleased();
    }
}


/**
 */
KinectTouchController.prototype.updateTouchData = function() {
    
}


/**
 Given an array with touch data, a 2D-point is returned,
 specifying where a touch occured.
 */
KinectTouchController.prototype.updateTouchPoint = function() {
    // Threshold value: at least this many touch points are
    // needed for a touch to occur
    var nrOfTouchPoints = 0;
    var xTotal = 0;
    var yTotal = 0;
    
    //******
    // width and height should be gotten from somewhere else!1
    var width = 160;
    var height = 120;
    //******
    
    
    for (var currentRow = 0; currentRow < height; currentRow++) {
        for (var currentCol = 0; currentCol < width; currentCol++) {
            
            if (this.touchData[currentRow * width + currentCol]) {
                nrOfTouchPoints++;
                xTotal += currentCol;
                yTotal += currentRow;
            }
        }
    }
    
    // If fewer touch points than the specified minimum
    // were found, return undefined
    if (nrOfTouchPoints < minTouches) {
        return;
    }
    // Otherwise, return a 2D-point with the average x
    // and y values of the touch points
    else {
        this.point2D.x = Math.round(xTotal / nrOfTouchPoints);
        this.point2D.y = Math.round(yTotal / nrOfTouchPoints);
    }
}


/*----------------------
 -- Callback functions --
 ----------------------*/

/**
 */
KinectTouchController.prototype.onTouch(point2d) {
}


/**
 */
KinectTouchController.prototype.onTouchMoved(point2d) {
}


/**
 */
KinectTouchController.prototype.onTouchReleased(point2d) {
}

