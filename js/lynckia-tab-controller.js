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
    var data = event.msg.data;
    tabController.onMessageReceived(senderId, null, data);
}

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
 Access a Lynckia room
 @param token The key used to gain access to a room
 */
var accessRoom = function(token) {
    room = Erizo.Room({token: token});
    localStream.addEventListener("access-accepted", onRoomAccessGranted);
    localStream.init();
    tabController.setLocalStream(localStream);
}

/**
 Called when access is granted to a room -
 Initiates listeners for handling future events
 */
var onRoomAccessGranted = function() {
    room.addEventListener("room-connected", function (roomEvent) {
                          room.publish(localStream);
                          subscribeToStreams(roomEvent.streams);
                          });
    
    room.addEventListener("stream-subscribed", function(streamEvent) {
                          });
    
    room.addEventListener("stream-added", function (streamEvent) {
                          var streams = [];
                          streams.push(streamEvent.stream);
                          subscribeToStreams(streams);
                          tabController.onStreamAdded(streamEvent.stream);
                          });
    
    room.addEventListener("stream-removed", function (streamEvent) {
                          tabController.onStreamRemoved(streamEvent.stream);
                          });
    room.connect();
};

/**
 Connect to a Lynckia room
 */
initLynckia = function (tabController) {
    tabController = tabController;
    localStream = Erizo.Stream({audio: true, video: true, data: true});
    createToken("user", "role", accessRoom);
};

