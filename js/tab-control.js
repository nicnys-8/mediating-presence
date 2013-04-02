/**
 
 */
TabControl = function() {
	
	var localStream = null;
	
	var onLoad = function() {
		// Called from window.onload
	}
	
	var onActivate = function() {
		// Called when the tab has become active,
		// that is, when it has slid into view
	}
	
	var onDeactivate = function() {
		// Called when the tab will become inactive,
		// that is, when it will slide out of view
	}
	
	var onStreamAdded = function(stream) {
		// Called when a new WebRTC stream is added
	}
	
	var onStreamRemoved = function(stream) {
		// Called when a WebRTC stream is removed
	}
	
	var onMessageReceived = function(senderId, type, data) {
		// Called when a data packet is received from a WebRTC stream
	}
	
	var onKinectInit = function(proxy) {
		// Called when the KinectPluginProxy is created.
		// Add listeners for video and depth data here
	}
	
	var onNewKinectData = function(videoData, depthData) {
		// Called when a new frame of video is
		// available from the Kinect
	}
	
	var setLocalStream = function(stream) {
		localStream = stream;
	}
	
	var sendMessage = function(dst, type, data) {
		if (localStream != null) {
			localStream.sendData({
								 dst:dst,
								 type:type,
								 data:data,
								 });
		} else {
			// TODO: queue the message and wait for a stream?
			// Maybe add a timeout and discard messages from
			// the queue after a while
			console.warn("Trying to send message of type '" + type + "' to frame '" + dst +"', but no local stream is available.");
		}
	}
	
	// Return public API
	return {
		onLoad : onLoad,
		onActivate : onActivate,
		onDeactivate : onDeactivate,
		onStreamAdded : onStreamAdded,
		onStreamRemoved : onStreamRemoved,
		onMessageReceived : onMessageReceived,
		onKinectPluginProxyCreated : onKinectPluginProxyCreated,
		setLocalStream : setLocalStream,
		sendMessage : sendMessage,
	};
}();

/**
 Run onLoad when the window has loaded
 */
window.addEventListener("load", function() {
							TabControl.onLoad();
						}, false);

/**
 Activate the tab when window has loaded, if this is the
 top level window (not in an iframe).
 This lets you run the html separately as well as in an iframe tab
 */
if (window.self === window.top) {
	window.addEventListener("load", function() {
								TabControl.onActivate();
							}, false);
}



