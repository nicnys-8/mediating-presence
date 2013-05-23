/**
 
 */
var TabControl = function() {
	
	var localStream = null,
		remoteStreams = {},
		streamIDs = [],
		API = {};
	
	API.onLoad = function() {
		// OVERRIDE THIS
		// Called from window.onload
	};
	
	API.onActivate = function() {
		// OVERRIDE THIS
		// Called when the tab has become active,
		// that is, when it has slid into view
	};
	
	API.onDeactivate = function() {
		// OVERRIDE THIS
		// Called when the tab will become inactive,
		// that is, when it will slide out of view
	};
	
	API.onStreamAdded = function(stream) {
		// OVERRIDE THIS
		// Called when a new WebRTC stream is added
	};
	
	API.onStreamRemoved = function(stream) {
		// OVERRIDE THIS
		// Called when a WebRTC stream is removed
	};
	
	API.onMessageReceived = function(senderId, type, data) {
		// OVERRIDE THIS
		// Called when a data packet is received from a WebRTC stream
	};
	
	API.onKinectInit = function(proxy) {
		// OVERRIDE THIS
		// Called when the KinectPluginProxy is created.
		// Add listeners for video and depth data here
	};
	
	API.onNewKinectData = function(videoData, depthData, rawVideo, rawDepth) {
		// OVERRIDE THIS
		// Called when a new frame of video is
		// available from the Kinect
		// rawVideo and rawDepth are undecoded data from the plugin
	};
	
	API.onLocalStreamInit = function(stream) {
		// OVERRIDE THIS
		// Called when the local stream is set
	};
	
	API.setLocalStream = function(stream) {
		localStream = stream;
		TabControl.onLocalStreamInit(stream);
	};
	
	API.getLocalStream = function() {
		return localStream;
	};
	
	API.getRemoteStreams = function() {
		return remoteStreams;
	};
	
	API.getStreamIDs = function() {
		return streamIDs;
	};
	
	API.addStream = function(stream) {
		var streamID = stream.getID();
		streamIDs.push(streamID);
		remoteStreams[streamID] = stream;
		
		TabControl.onStreamAdded(stream);
	};
	
	API.removeStream = function(stream) {
		var streamID = stream.getID(),
			index = streamIDs.indexOf(streamID);
		
		if (index !== -1) {
			streamIDs.splice(index, 1);
			delete remoteStreams[streamID];
		}
		
		TabControl.onStreamRemoved(stream);
	};
	
	API.getStreamCount = function() {
		return streamIDs.length;
	};
	
	API.getStream = function(id) {
		if (streamIDs.indexOf(id) !== -1) {
			return remoteStreams[id];
		}
		// return undefined
	};
	
	API.forEachStream = function(func, includeLocal) {
		
		var i, len = streamIDs.length;
		
		if (includeLocal && localStream) {
			func(localStream);
		}
		
		for (i = 0; i < len; ++i) {
			func(remoteStreams[streamIDs[i]]);
		}
	};
	
	API.sendMessage = function(dst, type, data) {
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
			// console.warn("Trying to send message of type '" + type + "' to frame '" + dst +"', but no local stream is available.");
		}
	};
	
	return API;
	
	/*
	// Return public API
	return {
		// Overridable callbacks:
		onLoad : onLoad,
		onActivate : onActivate,
		onDeactivate : onDeactivate,
		onStreamAdded : onStreamAdded,
		onStreamRemoved : onStreamRemoved,
		onMessageReceived : onMessageReceived,
		onKinectInit : onKinectInit,
		onNewKinectData : onNewKinectData,
		onLocalStreamInit : onLocalStreamInit,
		
		// For "internal" TabControl communication:
		setLocalStream : setLocalStream,
		addStream : addStream,
		removeStream : removeStream,
		
		// Sending messages:
		sendMessage : sendMessage,
	};
	 */
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



