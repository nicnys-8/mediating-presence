/**
 Functions for manipulating different kinds of image data
 */

var ImageHandling = function() {
    
    const THRESHOLDVALUE = 111;
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
     Each value in resultImageData is set to zero if the
     corresponding bit in mask is 0
     */
    var applyMask = function(mask, data) {
        var index = 0;
        for (var i = 0; i < mask.length; i++) {
            // If an index in the mask is zero,
            // make the corresponding pixel in data zero
            if (mask[i] == 0) data[i] = 0;
        }
    };
    
    
    
    /**
     Each RGBA pixel in resultImageData is made white if the
     corresponding bit in mask is 0
     */
    var applyMaskOnRGB = function(mask, data) {
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
     Fill an aray with the input value
     */
    var fillWithValue = function(array, value) {
        for (var i = 0; i < array.length; i++) {
            array[i] = value;
        }
    };
    
    
    /**
     Fill an aray with 1's TODO: Throw this away!
     */
    var fillWithOnes = function(array) {
        fillWithValue(array, 1);
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
     Converts a red/black image to binary
     */
    var RGBAToBinary = function(input, output) {
        var a = b = 0;
        
        for (var i = 0; i < output.length; i++) {
            if (input[i * 4] == 0) {
                output[i] = 0;
            } else {
                output[i] = 1;
            }
        }
    };
    
    
	var hsv2rgb = function(h, s, v) {
		
		var rgb, H, i, data;
		
		if (s === 0) {
			rgb = [v, v, v];
		} else {
			
			H = h / 60.0;
			i = Math.floor(H);
			data = [v * (1.0 - s),
					v * (1.0 - s * (H - i)),
					v * (1.0 - s * (1.0 - (H - i)))];
			
			switch(i) {
				case 0: rgb = [v, data[2], data[0]]; break;
				case 1: rgb = [data[1], v, data[0]]; break;
				case 2: rgb = [data[0], v, data[2]]; break;
				case 3: rgb = [data[0], data[1], v]; break;
				case 4: rgb = [data[2], data[0], v]; break;
				default: rgb = [v, data[0], data[1]]; break;
			}
		}
		return rgb;
	};
	
    /**
     Converts decoded Kinect depth data to RGBA data
     */
    var depthToRGBA = function(input, output) {
		var z, intensity, scale = 1.0 / 4096.0;
		for (var i = 0; i < input.length; i++) {
			z = input[i];
			if (z == 0) {
				output[i * 4 + 0] = 0;
				output[i * 4 + 1] = 0;
				output[i * 4 + 2] = 0;
				output[i * 4 + 3] = 255;
			} else {
				intensity = (1.0 - z * scale) * 255;
				output[i * 4 + 0] = intensity;
				output[i * 4 + 1] = intensity;
				output[i * 4 + 2] = intensity;
				output[i * 4 + 3] = 255;
			}
		}
		
		/*
		var z, hue, rgb, scale = 360 / 4096;
		for (var i = 0; i < input.length; i++) {
			z = input[i];
			
			if (z == 0) {
				output[i * 4 + 0] = 0;
				output[i * 4 + 1] = 0;
				output[i * 4 + 2] = 0;
				output[i * 4 + 3] = 255;
			} else {
				hue = z * scale;
				rgb = hsv2rgb(hue, 1.0, 1.0);
				output[i * 4 + 0] = rgb[0] * 255;
				output[i * 4 + 1] = rgb[1] * 255;
				output[i * 4 + 2] = rgb[2] * 255;
				output[i * 4 + 3] = 255;
			}
		}
		 */
		/*
        var depthValue;
        // If temp is undefined, create it
        if (!temp) {
            temp = new Array(input.length);
        }
        for (var i = 0; i < input.length; i++) {
            temp[i] = (input[i] / 4096) * 255;
        }
        ImageHandling.expandToRGBA(temp, output);
		 */
    };
    
    return {computeDifferenceMask: computeDifferenceMask, applyMask: applyMask, applyMaskOnRGB: applyMaskOnRGB, fillWithOnes: fillWithOnes, fillWithValue: fillWithValue, expandToRGBA: expandToRGBA, RGBAToBinary: RGBAToBinary, depthToRGBA: depthToRGBA};
    
}();

