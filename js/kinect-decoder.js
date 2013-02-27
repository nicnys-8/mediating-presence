/**
 Functions for decoding the raw video data retrieved from the Kinect
 */

var max1 = -999;
var max2 = -999;
var maxTot = -999;

var kinectVideoDecoder = function() {
    
    var codexStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var codexInt = [];
    var idx;
    for (var i = 0; i < 256; i++) {
        idx = codexStr.indexOf(String.fromCharCode(i));
        
        codexInt[i] = idx;
    }
    
    var temp;
        
    /*
    Takes raw Kinect RGB data and stores a decoded version in the output array
    */
    var decodeRGB = function(input, output)     {
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
        // If temp is undefined, create it
        if (!temp) {
            temp = new Array(input.length * 3/4);
        }
        
        var index = 0;
        var undex = 0;
        //What's happening here??
        for (var i = 0; i < input.length / 4; i++) {
            index = i * 4;
            undex = i * 3;
            var enc1 = codexInt[input.charCodeAt(index + 0)];
            var enc2 = codexInt[input.charCodeAt(index + 1)];
            var enc3 = codexInt[input.charCodeAt(index + 2)];
            var enc4 = codexInt[input.charCodeAt(index + 3)];
            
            temp[undex + 0] = (enc1 << 2) | (enc2 >> 4);
            temp[undex + 1] = ((enc2 & 15) << 4) | (enc3 >> 2);
            temp[undex + 2] = ((enc3 & 3) << 6) | enc4;
        }
        
        for (var i = 0; i < input.length * 3/8; i++) { // RIGHT???
            output[i] = temp[2 * i] | (temp[2 * i + 1] << 7);
            if (max1 < temp[2 * i]) max1 = temp[2 * i];
            if (max2 < temp[2 * i + 1]) max2 = temp[2 * i + 1];
            if (maxTot < output[i]) maxTot = output[i];
        }
        /*
        console.log("Max 1: " + max1);
        console.log("Max 2: " + max2);
        console.log("MaxTot: " + maxTot);
         */
    };
    
    return {decodeRGB: decodeRGB, decodeDepth: decodeDepth};
    
}();
