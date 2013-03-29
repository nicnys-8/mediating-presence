
/**

 ***** KinectPluginProxy *****
 
 If this script is included in the html, the Kinect plugin is 
 loaded and initialized automatically. Should another plugin be 
 used, just update this script.
 Everthing else should work, as long as it exposes the following API:
 
 initPlugin()
	called automatically in the top window to initialize the plugin
 
 requestStreams(callback)
	used for registering callbacks when new data is available
 
 Video resolution information, in pixels:
 RGB_DATA_WIDTH
 RGB_DATA_HEIGHT
 DEPTH_DATA_WIDTH
 DEPTH_DATA_HEIGHT
 
 
 // *********
 // Zigfu specific stuff:
 // *********
 
 Required scripts:
 kinect-decoder.js
 kinect-touch-controller.js (maybe)
 
 In the html:
 <div id="pluginContainer">
	<object id="ZigPlugin" type="application/x-zig" width="0" height="0">
		<param name="onload" value="zigPluginLoaded">
	</object>
 </div>
 */

KinectPluginProxy = function() {
	
	const	RGB_DATA_WIDTH = 160,
			RGB_DATA_HEIGHT = 120,
			DEPTH_DATA_WIDTH = 160,
			DEPTH_DATA_HEIGHT = 120;
	
	var plugin;
	var depthData;
	var videoData;
	var listeners = [];
	
	var initPlugin() {
		
		var ctx = document.createElement("canvas").getContext("2d");
		videoData = ctx.createImageData(RGB_DATA_WIDTH, RGB_DATA_HEIGHT);
		
		depthData = new Array(DEPTH_DATA_WIDTH * DEPTH_DATA_HEIGHT);
		
		plugin = document.getElementById("ZigPlugin");
		// Start the video streams
		plugin.requestStreams({updateDepth:true, updateImage:true});
		// Start updating the canvases every new kinect frame
		plugin.addEventListener("NewFrame", onNewKinectData);
	}
	
	var onNewKinectData() {
		
		// Decode the video data
		KinectDecoder.decodeRGB(plugin.imageMap, videoData.data);
		
		// Decode the depth data
		KinectDecoder.decodeDepth(plugin.depthMap, depthData);
		
		for (var i = 0; i < listeners.length; i++) {
			listeners[i](videoData, depthData);
		}
	}
	
	var requestStreams(callback) {
		listeners.push(callback);
	}
	
	// Return public API
	return {
		
		initPlugin			: initPlugin,
		requestStreams		: requestStreams,
		
		RGB_DATA_WIDTH		: RGB_DATA_WIDTH,
		RGB_DATA_HEIGHT		: RGB_DATA_HEIGHT,
		DEPTH_DATA_WIDTH	: DEPTH_DATA_WIDTH,
		DEPTH_DATA_HEIGHT	: DEPTH_DATA_HEIGHT,
	};
}();


/**
 Init the plugin proxy when window has loaded, if this is the
 top level window (not in an iframe).
 */
if (window.self === window.top) {
	window.addEventListener("load", function() {
								KinectPluginProxy.initPlugin();
							}, false);
}



