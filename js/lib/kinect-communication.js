var serverUrl = "/";
var localStream, room;

onClick = function() {
    var image = document.createElement("img");
    image.src = "liggaa.gif";
    
    image.width = 34;
    image.height = 14;
    
    image.onload = function () {
        var c = document.createElement("canvas");

        var ctx = c.getContext("2d");
        ctx.drawImage(image, 34, 14);
        
        var data = c.toDataURL()
        localStream.sendData({image:data});
    };
    
}

receiveData = function(event) {
    var data = event.msg.image;
    var img = document.createElement("img");
    img.src = data;
    
    var div = document.createElement("div");
    document.body.appendChild(div);
    div.appendChild(img);
}


// Kinect stuff-----------------------------------
const WIDTH = 160;
const HEIGHT = 120;

var kinectCanvas = document.createElement("canvas");

kinectCanvas.width = WIDTH;
kinectCanvas.height = HEIGHT;

var kinectContext = kinectCanvas.getContext("2d");

imageData = kinectContext.createImageData(WIDTH, HEIGHT);

initKinect = function() {
    plugin = document.getElementById("ZigPlugin");
    plugin.requestStreams({updateDepth:true, updateImage:true});
    plugin.addEventListener("NewFrame", sendImage);
}

sendImage = function() {
    KinectDecoder.decodeRGB(plugin.imageMap, imageData.data);
    kinectCanvas.putImageData(temp, 0, 0);
    
    var data = kinectCanvas.toDataURL();
    if (localStream) localStream.sendData({image:data});
    
}
//------------------------------------------------



window.onload = function () {
    
    initKinect();
    
    var button = document.createElement("button");
    document.body.appendChild(button);
    button.innerHTML = "Send message";
    button.onclick = onClick;
    
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
    
    createToken("user", "role", function (response) {
                var token = response;
                console.log(token);
                room = Erizo.Room({token: token});
                
                localStream.addEventListener("access-accepted", function () {
                                             
                                             var subscribeToStreams = function (streams) {
                                             for (var index in streams) {
                                             var stream = streams[index];
                                             if (localStream.getID() !== stream.getID()) {
                                             room.subscribe(stream);
                                             }
                                             }
                                             };
                                             
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
                                                                   
                                                                   streamEvent.stream.addEventListener("stream-data", receiveData);
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