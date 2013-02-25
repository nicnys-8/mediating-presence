/**
 Functions for manipulating different kinds of image data
 */

var ImageHandling = function() {
    
    const THRESHOLDVALUE = 32;
    /*
     Temp is declared outside the function where it is used
     so that it can be reused every time the function is called
     */
    var temp;
    
    
    /**
     Produce a binary mask where each bit is set to 1
     if the corresponding pixel's red values in refData
     and compData differ, 0 otherwise
     */
    var computeDifferenceMask = function(refData, compData, mask) {
        var difference;
        for (var i = 0; i < mask.length; i++) {
            if (compData[i] == 0) {
                difference = 0; // If the new data is black, ignore it
            } else {
                difference = Math.abs(refData[i] - compData[i]);
            }
            mask[i] = (difference > THRESHOLDVALUE ? 1 : 0);
        }
    };
    
    
    /**
     Each RGBA pixel in resultImageData is made white if the
     corresponding bit in mask is 0
     */
    var applyMask = function(mask, data) {
        var index = 0;
        for (var i = 0; i < mask.length; i++) {
            // If an index in mask is zero, make the corresponding pixel white
            if (mask[i] == 0) {
                data[index++] = 255;
                data[index++] = 255;
                data[index++] = 255;
                data[index++] = 255;
                // Else, move on to the next pixel
            } else {
                index += 4;
            }
        }
    };
    
    
    /**
     Fill an aray with 1's
     */
    var fillWithOnes = function(array) {
        for (var i = 0; i < array.length; i++) {
            array[i] = 1;
        }
    };
    
    
    /**
     Converts an image with a single value for each pixel to RGBA data
     */
    var expandToRGBA = function(input, output) {
        var index = 0;
        for (var i = 0; i < input.length; i++) {
            output[index++] = input[i]; // Assign input value to red intensity in output
            output[index++] = 0; // Green value is set to zero
            output[index++] = 0; // Blue is set to zero
            output[index++] = 255; // Full opacity
        }
    };
    
    
    /**
     Converts decoded Kinect depth data to RGBA data
     */
    var depthToRGBA = function(input, output) {
        var depthValue;
        // If temp is undefined, create it
        if (!temp) {
            temp = new Array(input.length);
        }
        for (var i = 0; i < input.length; i++) {
            temp[i] = (input[i] / 2047) * 255;
        }
        ImageHandling.expandToRGBA(temp, output);
    };
    
    return {computeDifferenceMask: computeDifferenceMask, applyMask: applyMask, fillWithOnes: fillWithOnes, expandToRGBA: expandToRGBA, depthToRGBA: depthToRGBA};
    
}();

