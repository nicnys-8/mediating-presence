/**
 Functions for decoding the raw video data retrieved from the Kinect
 
 This is a Base64 decoder with some Zigfu specific stuff.
 The code has been moved to kinect-plugin-proxy-zigfu.js!
 */


var temp;
var KinectDecoder = function() {
    
    var codexStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var codexInt = [];
    var idx;
    for (var i = 0; i < 256; i++) {
        idx = codexStr.indexOf(String.fromCharCode(i));
        
        codexInt[i] = idx;
    }
    
    /*
     Takes raw Kinect RGB data and stores a decoded version in the output array
     */
    var decodeRGB = function(input, output) {
        var inLength = input.length;
        var enc1, enc2, enc3, enc4;
        for (var i = 0; i < inLength; i += 4) {
            enc1 = codexInt[input.charCodeAt(i + 0)];
            enc2 = codexInt[input.charCodeAt(i + 1)];
            enc3 = codexInt[input.charCodeAt(i + 2)];
            enc4 = codexInt[input.charCodeAt(i + 3)];
            
            output[i + 0] = (enc1 << 2) | (enc2 >> 4);
            output[i + 1] = ((enc2 & 15) << 4) | (enc3 >> 2);
            output[i + 2] = ((enc3 & 3) << 6) | enc4;
            output[i + 3] = 255; // Full opacity
        }
    };
    
    
    /*
     Takes raw Kinect depth data and stores a decoded version in the output array
     */
    var decodeDepth = function(input, output) {
        
        var nrOfPoints = input.length * 3/8;
        
        // If temp is undefined, create it
        if (!temp) {
            temp = new Array(2 * nrOfPoints);
        }
        
        var j = 0;
        for (var i = 0; i < input.length; i) {
            
            var enc1 = codexInt[input.charCodeAt(i++)];
            var enc2 = codexInt[input.charCodeAt(i++)];
            var enc3 = codexInt[input.charCodeAt(i++)];
            var enc4 = codexInt[input.charCodeAt(i++)];
            
            temp[j++] = (enc1 << 2) | (enc2 >> 4);
            temp[j++] = ((enc2 & 15) << 4) | (enc3 >> 2);
            temp[j++] = ((enc3 & 3) << 6) | enc4;
        }
        
        var leftBits, rightBits;
        for (var i = 0; i < nrOfPoints; i++) {
            
            leftBits = temp[2 * i + 1] << 8;
            rightBits = temp[2 * i];
            // if (temp[2 * i + 1] & parseInt("00000100",2)) check = true;
            output[i] =  leftBits | rightBits;
        }
    };
    
    return {
		decodeRGB: decodeRGB,
		decodeDepth: decodeDepth,
	};
    
    
}();
