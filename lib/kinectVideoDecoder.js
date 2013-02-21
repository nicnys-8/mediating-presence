
var kinectVideoDecoder = function() {
    
    var codexStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var codexInt = [];
    for (var i = 0; i < 256; i++) {
        var idx = codexStr.indexOf(String.fromCharCode(i));
        codexInt[i] = idx;
    }
    
    /*
    Takes raw Kinect RGB data as input and returns
    regular RGBA data
    */
    var decodeRGB = function (input, output) {
        var outIndex = 0;
        var output = new Array(input.length);
        for (var i = 0; i < input.length; i += 4) {
            var enc1 = codexInt[input.charCodeAt(i + 0)];
            var enc2 = codexInt[input.charCodeAt(i + 1)];
            var enc3 = codexInt[input.charCodeAt(i + 2)];
            var enc4 = codexInt[input.charCodeAt(i + 3)];
            
            var chr1 = (enc1 << 2) | (enc2 >> 4);
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            var chr3 = ((enc3 & 3) << 6) | enc4;
            
            output[outIndex++] = chr1;
            output[outIndex++] = chr2;
            output[outIndex++] = chr3;
            output[outIndex++] = 255; // always full opacity
        }
        return output;
    };
    
    
    /*
     This method will probably be more useful in the future;
     it produces an array with one value for each pixel. 
     */
    var decodeDepth = function (input) {
        var temp = new Array(input.length * 3/4);
        var outIndex = 0;
        for (var i = 0; i < input.length; i += 4) {
            var enc1 = codexInt[input.charCodeAt(i + 0)];
            var enc2 = codexInt[input.charCodeAt(i + 1)];
            var enc3 = codexInt[input.charCodeAt(i + 2)];
            var enc4 = codexInt[input.charCodeAt(i + 3)];
            
            var chr1 = (enc1 << 2) | (enc2 >> 4);
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            var chr3 = ((enc3 & 3) << 6) | enc4;
            
            temp[outIndex++] = chr1;
            temp[outIndex++] = chr2;
            temp[outIndex++] = chr3;
        }
        
        var output = new Array(input.length / 4);
        for (var i = 0; i < temp.length; i += 2) {
            depthValue = temp[i] | (temp[i + 1] << 8);
            depthValue = depthValue / 2047;
            depthValue = depthValue * 255;
            output[i] = depthValue;
        }
        return output;
    }
    
    return {decodeRGB: decodeRGB, decodeDepth: decodeDepth};
    
}();
