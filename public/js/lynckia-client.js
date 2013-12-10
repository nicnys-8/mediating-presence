
/**
 A script for multi-user videoconferencing using both
 webcam and Kinect over WebRTC
 */
var LynckiaClient = LynckiaClient || function() {
	
	var localStream, room, API = {};
	
	/**
	 Sends a HTTP POST request to the server
	 @param callback Method which is called when the server responds
	 @param url The URL to send to
	 @param body The body of the request
	 */
	function httpPost(url, body, callback) {
		var req = new XMLHttpRequest();
		
		req.onreadystatechange = function () {
			if (req.readyState === 4 && callback) {
				callback(req.responseText);
			}
		};
		req.open("POST", url, true);
		req.setRequestHeader("Content-Type", "application/json");
		if (body) {
			req.send(JSON.stringify(body));
		} else {
			req.send();
		}
	};

	/**
	 Sends a HTTP GET request to the server
	 @param callback Method which is called when the server responds
	 @param url The URL to send to
	 @param body The body of the request
	 */
	function httpGet(url, callback) {
		var req = new XMLHttpRequest(),
			parsedResponse;
		req.onreadystatechange = function () {
			if (req.readyState === 4 && callback) {
				parsedResponse = JSON.parse(req.responseText);
				callback(parsedResponse);
			}
		};
		req.open("GET", url, true);
		req.send();
	};
	
	/**
	 Create a Lynckia room
	 @param roomName The name of the new room, in string form
	 */
	API.createRoom = function(roomName, callback) {
		console.log("Sending a request to the server to create a new room");
		httpPost("/createRoom/", {roomName : roomName}, callback);
	};

	/**
	 Delete a Lynckia room
	 @param roomName The name of the room that is to be deleted, in string form
	 */
	API.deleteRoom = function(roomName, callback) {
		console.log("Asking server to delete room named " + roomName);
		httpPost("/deleteRoom/", {roomName: roomName}, callback);
	};

	/**
	 Get the specified Lynckia room
	 @param roomName A string with the name of the room
	 */
	API.getRoom = function(roomName) {
		httpPost("/getRoom/", {roomName: roomName}, callback);
	};

	/**
	 Get a list of the available Lynckia rooms
	 @param callBack Method called when the server responds
	 */
	API.getRooms = function(callback) {
		httpGet("/getRooms/", callback);
	};
	
	/**
	 Get a list of the available Lynckia rooms
	 @param callBack Method called when the server responds
	 */
	API.getDemoRooms = function(callback) {
		httpGet("/getDemoRooms/", callback);
	};

	/** ROOM ACCESS: STEP 1
	 Sets up the localstream and ask the server for a Lynckia token, which will be used
	 to gain access to a room
	 @param username The username (string)
	 @param roomId Unique identifier of the Lynckia room (number)
	 */
	API.accessRoom = function(username, roomId, options) {
		
		options = options || {audio: true, video: true, data: true, attributes: {username: username}};
		
		if (username && !options.attributes) {
			options.attributes = {username: username};
		}
		
		// Set up the local stream
		localStream = Erizo.Stream(options);
        var role = "presenter";
		createToken(username, role, roomId, onTokenCreated);
	};

	/** ROOM ACCESS: STEP 2
	 Creates the key used to get access to a Lynckia room
	 @param username Not useful at the moment
	 @param role Not useful at the moment
	 @param roomId A number identifying the  room the caller wishes to access
	 @param callback A function that will be called with the servers response
	 to the request, in string form, as input
	 */
	function createToken(username, role, roomId, callback) {
		httpPost("/createToken/", {username: username, role: role, roomId: roomId}, callback);
	};
	
	/** ROOM ACCESS: STEP 3
	 Called when a user access token is created-
	 the user is asked to grant access to the local user media
	 */
	function onTokenCreated(token) {
		console.log("Received token: " + token);
		room = Erizo.Room({token: token});
		// Add listeners for responding to the media access request
		localStream.addEventListener("access-accepted", onMediaAccessGranted);
		localStream.addEventListener("access-denied", onMediaAccessDenied);
		// Ask for access to local media
        localStream.videoSize = [320, 240, 320, 240];
		localStream.init();
	};

	/** ROOM ACCESS: STEP 4B
	 Called when access to the webcam and microphone is denied-
	 The event is logged in the console
	 */
	function onMediaAccessDenied() {
		console.log("Access to webcam and microphone denied");
	};
	
	/** ROOM ACCESS: STEP 4A
	 Called when access is granted to the webcam and microphone -
	 Initiates listeners for handling future events, and connects
	 the user to the room
	 */
	function onMediaAccessGranted() {
		
		console.log("Access to webcam and microphone accepted");
		
		room.addEventListener("room-connected", function (roomEvent) {
							  localStream.room = room;
							  TabControl.setLocalStream(localStream);
							  room.publish(localStream);
							  subscribeToStreams(roomEvent.streams);
                              
                              if (localStream.video) {
                              	localStream.video.volume = 0; // Mute the local video to avoid feedback
                              }
							  });
		
		room.addEventListener("stream-subscribed", function(streamEvent) {
							  TabControl.addStream(streamEvent.stream);
							  });
		
		room.addEventListener("stream-added", function (streamEvent) {
							  var streams = [streamEvent.stream];
							  subscribeToStreams(streams);
							  });
		
		room.addEventListener("stream-removed", function (streamEvent) {
							  TabControl.removeStream(streamEvent.stream);
							  });
		room.connect();
	};
	
	/** ROOM ACCESS: STEP 5
	 Subscribe to current users' streams
	 */
	function subscribeToStreams(streams) {
		for (var index in streams) {
			var stream = streams[index];
			if (localStream.getID() !== stream.getID()) {
				room.subscribe(stream);
				stream.addEventListener("stream-data", onDataReceived);
			}
		}
	};
	
	/** ROOM ACCESS: STEP 6
	 Handles received data packets from remote users
	 */
	function onDataReceived(event) {
		var senderID = event.stream.getID(), data = event.msg;
		TabControl.onMessageReceived(senderID, null, data);
	};

	/**
	 TODO: Description
	 @param callbacks: An object containing callback methods:
	 {success: func1, fail: func2, progress: func3}
	 */
	API.uploadFile = function(file, callbacks) {
		function logEvent(evt) {
			console.log(evt);
		}
		function postToS3(res) {
			var req = new XMLHttpRequest(),
				url = res.s3Url,
				fd = new FormData(),
				subfolder = "uploads/";
			fd.append("key", subfolder + res.s3Filename);
			fd.append("acl", "public-read");
			fd.append("success_action_redirect", "/");
			fd.append("Content-Type", file.type);
			fd.append("AWSAccessKeyId", res.s3Key);
			fd.append("policy", res.s3PolicyBase64);
			fd.append("signature", res.s3Signature);
			fd.append("file", file);
			req.open("POST", url, true);
			req.addEventListener("load", function() {
								 // Call the callback with the url to the uploaded file
								 // as argument
								 callbacks.success(url + subfolder + res.s3Filename);
								 }, false);
			req.addEventListener("error", callbacks.fail, false);
			req.addEventListener("abort", callbacks.fail, false);
			req.upload.addEventListener("progress", callbacks.progress, false);
			req.send(fd);
		}
		
		httpGet("/gets3policy", postToS3);
	};
	
	return API;
}();

