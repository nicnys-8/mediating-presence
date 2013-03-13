/**
 A script for multi-user videoconferencing using both
 webcam and Kinect using WebRTC
 */

var serverUrl = "/";
var localStream, room;


//Kinect constants
const WIDTH = 160;
const HEIGHT = 120;

// Variables for local Kinect video
var kinectCanvas;
var kinectContext;
var imageData;

// Variables for remote Kinect video
var remoteKinectCanvas;
var remoteKinectContext;


/**
 Start the Kinect video stream
 */
initKinect = function() {
    // Variables for local Kinect video
    kinectCanvas = document.createElement("canvas");
    kinectCanvas.width = WIDTH;
    kinectCanvas.height = HEIGHT;
    kinectContext = kinectCanvas.getContext("2d");
    imageData = kinectContext.createImageData(WIDTH, HEIGHT);
    
    // Variables for remote Kinect video
    remoteKinectCanvas = document.createElement("canvas");
    remoteKinectCanvas.widht = WIDTH;
    remoteKinectCanvas.height = HEIGHT;
    remoteKinectContext = remoteKinectCanvas.getContext("2d");
    document.body.appendChild(remoteKinectCanvas);
    
    plugin = document.getElementById("ZigPlugin");
}

/**
 */
startKinectStream = function() {
    if (plugin) {
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
    KinectDecoder.decodeRGB(plugin.imageMap, imageData.data);
    kinectContext.putImageData(imageData, 0, 0);
    
    var dataURL = kinectCanvas.toDataURL();
    if (localStream) localStream.sendData({dataURL:dataURL});
}


/**
 Display received Kinect frames
 */

receiveData = function(event) {
    var image = new Image();
    image.onload = function() {
        remoteKinectContext.drawImage(this, 0, 0);
    };
    image.src = event.msg.dataURL;
}


/**
 Subscribe to current users' streams
 */
subscribeToStreams = function (streams) {
    for (var index in streams) {
        var stream = streams[index];
        if (localStream.getID() !== stream.getID()) {
            room.subscribe(stream);
            stream.addEventListener("stream-data", receiveData);
        }
    }
}


/**
 When the winow loads, stuff starts to happen... subscribing to streams, adding listeners to
 the room, stuff like that...
 */
window.onload = function () {
    
    // Set up the Kinect
    initKinect();
    
    // Set uo the button
    var button = document.createElement("button");
    document.body.appendChild(button);
    button.innerHTML = "Start Kinect";
    button.onclick = startKinectStream;
    
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
    
    
    /**
     ...
     */
    createToken("user", "role", function (response) {
                var token = response;
                room = Erizo.Room({token: token});
                
                localStream.addEventListener("access-accepted", function () {
                                             room.addEventListener("room-connected", function (roomEvent) {
                                                                   room.publish(localStream);
                                                                   subscribeToStreams(roomEvent.streams);
                                                                   });
                                             
                                             room.addEventListener("stream-subscribed", function(streamEvent) {
                                                                   var stream = streamEvent.stream;
                                                                   var div = document.createElement('div');
                                                                   div.setAttribute("style", "width: 320px; height: 240px;");
                                                                   div.setAttribute("id", "test" + stream.getID());
                                                                   
                                                                   document.body.appendChild(div);
                                                                   stream.show("test" + stream.getID());
                                                                   });
                                             
                                             room.addEventListener("stream-added", function (streamEvent) {
                                                                   var streams = [];
                                                                   streams.push(streamEvent.stream);
                                                                   subscribeToStreams(streams);
                                                                   });
                                             
                                             
                                             room.addEventListener("stream-removed", function (streamEvent) {
                                                                   // Remove stream from DOM
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
};