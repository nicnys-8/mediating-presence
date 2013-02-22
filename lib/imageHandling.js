var ImageHandling = ImageHandling || {};

/**
 Each RGBA pixel in resultImageData is made white if the
 corresponding bit in mask is 0
 */
ImageHandling.applyMask = function(data, mask) {
    var index = 0;
    for (var i = 0; i < mask.length; i++) {
        if (mask[i] == 0) {
            data[index++] = 255;
            data[index++] = 255;
            data[index++] = 255;
            data[index++] = 255;
        }
    }
};


/**
 Fill an aray with 1's
 */
ImageHandling.fillWithOnes = function(array) {
    for (var i = 0; i < array.length; i++) {
        array[i] = 1;
    }
};


/**
 Produce a binary mask where each bit is set to 1
 if the corresponding pixel's red values in refData
 and compData differ, 0 otherwise
 */
ImageHandling.computeDifferenceMask = function(mask, refData, compData) {
    var thresholdValue = 100;
    var difference;
    for (var i = 0; i < mask.length; i++) {
        // Compare the red component
        
        if (compData[i] == 0) {
            difference = 0; // If the new data is black, ignore it
        } else {
            difference = Math.abs(refData[i] - compData[i]);
        }
        
        mask[i] = (difference > thresholdValue ? 1 : 0);
    }
};

/**
 Converts an image with a single value for each pixel to RGBA data
 */
ImageHandling.expandToRGBA = function(input, output) {
    var index = 0;
    for (var i; i < input.length; i++) {
        output[index++] = input[i]; // Assign input value to red intensity in output
        output[index++] = 0 // Green value is set to zero
        output[index++] = 0 // Blue is set to zero
        output[index++] = 255 // Full opacity
    }
};