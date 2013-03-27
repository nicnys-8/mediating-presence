/**
 A script for multi-user videoconferencing using both
 webcam and Kinect over WebRTC
 */

var serverUrl = "/";
var localStream, room;


//Kinect constants
const KINECT_WIDTH = 160;
const KINECT_HEIGHT = 120;

// Variables for local Kinect video
var VIDEO_WIDTH;
var VIDEO_HEIGHT;

var kinectCanvas;
var kinectContext;
var tempData;


/**
 On click, start the Kinect
 */
buttonClicked = function() {
    startKinectStream();
}


/**
 Start the Kinect video stream
 */
initKinect = function() {
    // Variables for local Kinect video
    kinectCanvas = document.createElement("canvas");
    kinectCanvas.width = KINECT_WIDTH;
    kinectCanvas.height = KINECT_HEIGHT;
    kinectContext = kinectCanvas.getContext("2d");
    tempData = kinectContext.createImageData(KINECT_WIDTH, KINECT_HEIGHT);
    plugin = document.getElementById("ZigPlugin");
}


/**
 Start sending Kinect video data to all users
 */
startKinectStream = function() {
    if (plugin) { // This check doesn't do anything! Replace with something real later...
        plugin.requestStreams({updateDepth:true, updateImage:true});
        plugin.addEventListener("NewFrame", sendImage);
    } else {
        alert("Can't access the Kinect... Are you sure it's connected to the computer?");
    }
}


/**
 Send the latest Kinect image to all subscribers
 */
sendImage = function() {
    KinectDecoder.decodeRGB(plugin.imageMap, tempData.data);
    //kinectContext.putImageData(tempData, 0, 0, 0, 0, 640, 480);
    kinectContext.putImageData(tempData, 0, 0);
    
    var dataURL = kinectCanvas.toDataURL();
    if (localStream) localStream.sendData({dataURL:dataURL});
}


/**
 Display received Kinect frames
 */
receiveData = function(event) {
    var senderID = event.stream.getID();
    var update = event.msg.klotskiUpdate;
    
    console.log(update);
    
    update = JSON.parse(update);
    level.externalBlockMove(update.id, update.x, update.y);
    
    /*
     var image = new Image();
     var senderID = event.stream.getID();
     var dataURL = event.msg.dataURL;
     
     image.onload = function() {
     var senderCanvas = document.getElementById("kinect" + senderID);
     senderContext = senderCanvas.getContext("2d");
     senderContext.drawImage(this, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
     };
     image.src = dataURL;
     */
}


/**
 ...
 */
function blockSnappedCallback(id, x, y) {
    var message = {id:id, x:x, y:y};
    message = JSON.stringify(message);
    if (localStream) localStream.sendData({klotskiUpdate:message});
}

/**
 When the winow loads, stuff starts to happen... subscribing to streams, adding listeners to
 the room, stuff like that... Good comment, this.
 */
window.onload = function () {
    
    VIDEO_WIDTH = parseInt(document.getElementById("myVideo").style.width);
    VIDEO_HEIGHT = parseInt(document.getElementById("myVideo").style.height);
    
    initKinect();
    // initKinectButton();
    
    localStream = Erizo.Stream({audio: true, video: true, data: true});
    
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
    
    createToken("user", "role", function(response) {
                var token = response;
                room = Erizo.Room({token: token});
                
                localStream.addEventListener("access-accepted", function () {
                                             
                                             /**
                                              Subscribe to current users' streams
                                              */
                                             var subscribeToStreams = function (streams) {
                                             for (var index in streams) {
                                             var stream = streams[index];
                                             if (localStream.getID() !== stream.getID()) {
                                             room.subscribe(stream);
                                             stream.addEventListener("stream-data", receiveData);
                                             }
                                             }
                                             };
                                             
                                             room.addEventListener("room-connected", function (roomEvent) {
                                                                   room.publish(localStream);
                                                                   subscribeToStreams(roomEvent.streams);
                                                                   });
                                             
                                             room.addEventListener("stream-subscribed", function(streamEvent) {
                                                                   var stream = streamEvent.stream;
                                                                   
                                                                   // Set up a canvas for displaying webcam media from this stream
                                                                   var div = document.createElement('div');
                                                                   div.setAttribute("style", "width: 320px; height: 240px;");
                                                                   //div.setAttribute("style", "width: " + VIDEO_WIDTH + "px; height: " + VIDEO_HEIGHT + "px;");
                                                                   div.setAttribute("id", "test" + stream.getID());
                                                                   document.body.appendChild(div);
                                                                   stream.show("test" + stream.getID());
                                                                   
                                                                   // Set up a canvas for displaying Kinect video from this stream
                                                                   var canvas = document.createElement("canvas");
                                                                   canvas.setAttribute("style", "width: " + VIDEO_WIDTH + "px; height: " + VIDEO_HEIGHT + "px;");
                                                                   canvas.setAttribute("id", "kinect" + stream.getID());
                                                                   canvas.width = VIDEO_WIDTH;
                                                                   canvas.height = VIDEO_HEIGHT;
                                                                   document.body.appendChild(canvas);
                                                                   });
                                             
                                             room.addEventListener("stream-added", function (streamEvent) {
                                                                   var streams = [];
                                                                   streams.push(streamEvent.stream);
                                                                   subscribeToStreams(streams);
                                                                   });
                                             
                                             
                                             room.addEventListener("stream-removed", function (streamEvent) {
                                                                   var stream = streamEvent.stream;
                                                                   if (stream.elementID !== undefined) {
                                                                   var element = document.getElementById(stream.elementID);
                                                                   document.body.removeChild(element);
                                                                   }
                                                                   });
                                             
                                             room.connect();
                                             
                                             localStream.show("myVideo");
                                             });
                localStream.init();
                });
    
    initKlotski();
};

