
/**
 
 In the html:
 <div id="pluginContainer">
	<object id="ZigPlugin" type="application/x-zig" width="0" height="0">
		<param name="onload" value="zigPluginLoaded">
	</object>
 </div>
 */
KinectPluginProxy = function() {
	
	var plugin;
	
	const KINECT_RGB_WIDTH = 160, KINECT_RGB_HEIGHT = 120;
	const KINECT_DEPTH_WIDTH = 160, KINECT_DEPTH_HEIGHT = 120;
	
	var depthData;
	var videoData;
	
	var initPlugin() {
		
		var canvas = MediaExt.createCanvas(KINECT_RGB_WIDTH, KINECT_RGB_HEIGHT);
		videoData = canvas.getContext("2d").createImageData(KINECT_RGB_WIDTH, KINECT_RGB_HEIGHT);
		
		depthData = new Array(KINECT_DEPTH_WIDTH * KINECT_DEPTH_HEIGHT);
		
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
	}
	
	var streamsCallbacks = [];
	
	var requestStreams(callback) {
		streamsCallbacks.push(callback);
	}
	
	// Return public API
	return {
		initPlugin : initPlugin,
		requestStreams : requestStreams,
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



