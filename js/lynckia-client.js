/**
 A script for multi-user videoconferencing using both
 webcam and Kinect over WebRTC
 */

var serverUrl = "/";
var localStream, room;
var tabController;

var LynckiaClient = LynckiaClient || {};

/**
 Creates the key used to get access to a Lynckia room
 @param username Not useful at the moment
 @param role Not useful at the moment
 @param roomId A number identifying the room the caller wishes to access
 @param callback A function that will be called with the servers response
 to the request, in string form, as input
 */
LynckiaClient.createToken = function(username, role, roomId, callback) {
    var req = new XMLHttpRequest();
    var url = serverUrl + "createToken/";
    var body = {username: username, role: role, roomId: roomId};
    
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            console.log("Response from server:");
            callback(req.responseText);
        }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(body));
};

/**
 Create a Lynckia room
 @param roomName The name of the new room, in string form
 */
LynckiaClient.createRoom = function(roomName, callback) {
    console.log("Sending a request to the server to create a new room");
    var req = new XMLHttpRequest();
    var url = serverUrl + "createRoom/";
    var body = {roomName: roomName};
    
    /*
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            handleServerMessage(req.responseText);
        }
    };*/
    
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            callback(req.responseText);
        }
    };
    
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(body));
};

/**
 Delete a Lynckia room
 @param roomName The name of the room that is to be deleted, in string form
 */
LynckiaClient.deleteRoom = function(roomName, callback) {
    console.log("Asking server to delete room named " + roomName);
    var req = new XMLHttpRequest();
    var url = serverUrl + "deleteRoom/";
    var body = {roomName: roomName};
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            callback(req.responseText);
        }
    };
    /*req.onreadystatechange = function() {
        if (req.readyState === 4) {
            handleServerMessage(req.responseText);
        }
    };*/
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(body));
};

/**
 Get the specified Lynckia room
 @param roomName A string with the name of the room
 */
LynckiaClient.getRoom = function(roomName) {
    var req = new XMLHttpRequest();
    var url = serverUrl + "getRoom/";
    var body = {roomName: roomName};
    
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            console.log(req.responseText);
        }
    };
    req.open("POST", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send(JSON.stringify(body));
};

/**
 Get a list of the available Lynckia rooms
 @param callBack Method called when the server responds
 */
LynckiaClient.getRooms = function(callback) {
    var req = new XMLHttpRequest();
    var url = serverUrl + "getRooms/";
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            callback(req.responseText);
        }
    };
    req.open("GET", url, true);
    req.setRequestHeader("Content-Type", "application/json");
    req.send();
};

/**
 Sets up the localstream and ask the server for a Lynckia token, which will be used
 to gain access to a room
 @param username The username (string)
 @param roomId Unique identifier of the Lynckia room (number)
 */
LynckiaClient.accessRoom = function(username, roomId) {
    // Set up the local stream
    localStream = Erizo.Stream({audio: true, video: true, data: true, attributes: {username: username}});
    LynckiaClient.createToken(username, "role", roomId, onTokenCreated);
};

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
 Called when a user access token is created-
 A Lynckia room is created, and the user is
 asked to grant access to the local user media
 */
var onTokenCreated = function(token) {
    console.log("Received token: " + token);
    room = Erizo.Room({token: token});
    // Add listeners for responding to the media access request
    localStream.addEventListener("access-accepted", onMediaAccessGranted);
    localStream.addEventListener("access-denied", onMediaAccessDenied);
    // Ask for access to local media
    localStream.init();
};

/**
 Called when access to the webcam and microphone is denied-
 The event is logged in the console
 */
var onMediaAccessDenied = function() {
    console.log("Access to webcam and microphone denied");
};

/**
 Called when access is granted to the webcam and microphone -
 Initiates listeners for handling future events, and connects
 the user to the room
 */
var onMediaAccessGranted = function() {
    console.log("Access to webcam and microphone accepted");
    
    room.addEventListener("room-connected", function (roomEvent) {
                          localStream.room = room; //BLAAAH
                          tabController.setLocalStream(localStream);
                          // After this, it doesn't work
                          room.publish(localStream);
                          subscribeToStreams(roomEvent.streams);
                          });
    
    room.addEventListener("stream-subscribed", function(streamEvent) {
                          tabController.addStream(streamEvent.stream);
                          });
    
    room.addEventListener("stream-added", function (streamEvent) {
                          var streams = [streamEvent.stream];
                          subscribeToStreams(streams);
                          });
    
    room.addEventListener("stream-removed", function (streamEvent) {
                          tabController.removeStream(streamEvent.stream);
                          });
    room.connect();
};

/**
 Set the clients tabControl object
 */
LynckiaClient.setTabControl = function(tabControllerArg) {
    tabController = tabControllerArg;
};








