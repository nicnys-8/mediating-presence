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
	
	var onMessageReceived = function(senderId, type, packet) {
		// Called when a data packet is received from a WebRTC stream
	}
	
	var onKinectPluginProxyCreated = function(proxy) {
		// Called when the KinectPluginProxy is created.
		// Add listeners for video and depth data here
	}
	
	var setLocalStream = function(stream) {
		localStream = stream;
	}
	
	var sendData = function(data) {
		if (localStream != null) {
			localStream.sendData(data);
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
		sendData : sendData,
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



