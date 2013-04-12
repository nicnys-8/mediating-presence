/**
 A script for multi-user videoconferencing using both
 webcam and Kinect over WebRTC
 */

var serverUrl = "/";
var localStream, room;
var tabController;

/**
 Subscribe to current users' streams
 */
var subscribeToStreams = function (streams) {
    for (var index in streams) {
        var stream = streams[index];
        if (localStream.getID() !== stream.getID()) {
            room.subscribe(stream);
            stream.addEventListener("stream-data", onDataReceived);
        }
    }
};

/**
 Handles received data packets from remote users
 */
var onDataReceived = function(event) {
    var senderID = event.stream.getID();
    var data = event.msg;
	
    tabController.onMessageReceived(senderID, null, data);
};

/**
 Create the key used to get access to a room
 */
var createToken = function(userName, role, callback) {
    var req = new XMLHttpRequest();
    var url = serverUrl + 'createToken/';
    var body = {username: userName, role: role};
    
    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            callback(req.responseText);
        }
    };
    req.open('POST', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(body));
};

/**
 Create a Lynckia room
 */
var createRoom = function(roomName, callback) {
    var req = new XMLHttpRequest();
    var url = serverUrl + 'createRoom/';
    var body = {roomName: roomName};
    
    req.onreadystatechange = function () {
        if (req.readyState === 4) {
            callback(req.responseText);
        }
    };
    req.open('POST', url, true);
    req.setRequestHeader('Content-Type', 'application/json');
    req.send(JSON.stringify(body));
};


/**
 Called when a user access token is created-
 A Lynckia room is created, and the user is
 asked to grant access to the local user media
 */
var onTokenCreated = function(token) {
    room = Erizo.Room({token: token});
    // Add listeners for responding to the media access request
    localStream.addEventListener("access-accepted", onMediaAccessGranted);
    localStream.addEventListener("access-denied",
                                 console.log("Access to webcam and microphone denied"));
    // Ask for access to local media
    localStream.init();
};

/**
 Called when access is granted to the webcam and microphone -
 Initiates listeners for handling future events, and connects
 the user to the room
 */
var onMediaAccessGranted = function() {
    room.addEventListener("room-connected", function (roomEvent) {tabController.setLocalStream(localStream);
                          room.publish(localStream);
                          subscribeToStreams(roomEvent.streams);
                          });
    
    room.addEventListener("stream-subscribed", function(streamEvent) {
                          tabController.onStreamAdded(streamEvent.stream);
                          });
    
    room.addEventListener("stream-added", function (streamEvent) {
                          var streams = [streamEvent.stream];
                          subscribeToStreams(streams);
                          });
    
    room.addEventListener("stream-removed", function (streamEvent) {
                          tabController.onStreamRemoved(streamEvent.stream);
                          });
    room.connect();
};

/**
 Connect to a Lynckia room
 */
initLynckia = function (tabControllerArg) {
    tabController = tabControllerArg;
    localStream = Erizo.Stream({audio: true, video: true, data: true});
    createToken("user", "role", onTokenCreated);
};