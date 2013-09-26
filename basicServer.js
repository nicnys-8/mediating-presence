/*global require, __dirname, console*/

const MAX_ROOM_LENGTH = 20;

var express = require("express"),
net = require("net"),
N = require("./nuve"),
fs = require("fs"),
io = require("socket.io").listen(3005),
https = require("https"),
config = require("./../../lynckia_config");

/*========================
 --- Amazon S3 storage ---
 =======================*/
var s3Signature,
s3Credentials,
POLICIES_PER_DAY = 100,
// The number of seconds that passes before the number of policies are refreshed:
policyRefreshTime = 1000 * 60 * 60 * 24, // 24 hours
remainingPolicies = POLICIES_PER_DAY;

setInterval(function() {
            remainingPolicies = POLICIES_PER_DAY;
            }, policyRefreshTime);

var createS3Policy = function() {
    var s3PolicyBase64, date, s3Policy, filename;
    date = new Date();
    filename = remainingPolicies; // This gives us a unique filename
    s3Policy = {
        "expiration": "" + (date.getFullYear()) + "-" + (date.getMonth() + 1) + "-" + (date.getDate()) + "T" + (date.getHours()) + ":" + (date.getMinutes() + 5) + ":" + (date.getSeconds()) + "Z", // set to expire in five minutes
        "conditions": [
                       {"bucket": "idipity-data"},
                       //["starts-with", "$key", "uploads/" + filename],
                       {"key": "uploads/" + filename},
                       {"acl": "public-read"},
                       {"success_action_redirect": "/"}, // TODO: Remove
                       ["starts-with", "$Content-Type", ""], // TODO: Remove?
                       ["content-length-range", 0, 20000000]
                       ]
    };
    s3PolicyBase64 = new Buffer(JSON.stringify(s3Policy)).toString("base64")
    
    s3Credentials = {
    s3PolicyBase64: s3PolicyBase64,
    s3Signature: crypto.createHmac("sha1", config.cloudProvider.secretAccessKey).update(s3PolicyBase64).digest("base64"),
    s3Key: config.cloudProvider.accessKey,
        
    s3Redirect: "/",
    s3Policy: s3Policy,
    s3Filename: filename,
    s3Url: "https://mediating-presence.s3.amazonaws.com/"
    }
    return s3Credentials;
};


/*
 Dictionary containing room information-
 the property names are Lynckia room names,
 and their values are the corresponding room IDs
 */
var localRoomList = {};

var options = {
key: fs.readFileSync("cert/key.pem").toString(),
cert: fs.readFileSync("cert/cert.pem").toString()
};

var app = express();

app.use(express.bodyParser());

app.configure(function () {
              "use strict";
              app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
              app.use(express.logger());
              app.use(express.static(__dirname + "/public"));
              });

app.use(function (req, res, next) {
        "use strict";
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE");
        res.header("Access-Control-Allow-Headers", "origin, content-type");
        if (req.method == "OPTIONS") {
        res.send(200);
        }
        else {
        next();
        }
        });

N.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, "http://localhost:3000/");

/**
 Deletes all existing rooms, one at a time
 */
var deletionLoop = function() {
    N.API.getRooms(function (roomList) {
                   "use strict";
                   var rooms = JSON.parse(roomList);
                   if (rooms.length > 0) {
                   N.API.deleteRoom(rooms[0]._id, function(result) {
                                    console.log("Room " + rooms[0].name + " deleted");
                                    // Recursive call
                                    deletionLoop();
                                    });
                   } else {
                   return;
                   }
                   });
};

/**
 Creates a new token and returns it to the user
 */
app.post("/createToken/", function(req, res) {
         "use strict";
         var username = req.body.username;
         var role = req.body.role;
         var roomId = req.body.roomId;
         // Empty strings are not allowed
         if (username.length == 0) {
         res.send("Error: An empty string is not a username");
         return;
         }
         // If the username was not an empty string, create the token
         N.API.createToken(roomId, username, role, function (token) {
                           console.log("Answering with token", token);
                           res.send(token);
                           });
         });

/**
 Creates a new Lynckia room
 */
app.post("/createRoom/", function(req, res) {
         "use strict";
         var roomName = req.body.roomName;
         console.log("Received a request to create a room with name " + roomName);
         // Check if the room name is valid
         var errorMessage;
         if (localRoomList[roomName]) {
         errorMessage = "Error: A room with that name already exists";
         }
         if (roomName.length == 0) {
         errorMessage = "Error: An empty string is not a valid room name";
         }
         if (roomName.length > MAX_ROOM_LENGTH) {
         errorMessage = "Error: A room name can be no longer than " + MAX_ROOM_LENGTH + " letters";
         }
         if (errorMessage) {
         res.send(errorMessage);
         return;
         }
         // If the name is unique, create the room
         N.API.createRoom(roomName, function(room) {
                          localRoomList[room.name] = room._id;
                          // Inform all users that a room was added
                          var roomData = JSON.stringify(room);
                          io.sockets.emit("roomAdded", {room:room});
                          var resultMessage = "Successfully created a room with name " + roomName;
                          console.log(resultMessage);
                          res.send(resultMessage);
                          });
         });

/**
 Responds to the client with a list of all Lynckia users in the room
 specified in the request paramater 'room'
 */
app.post("/deleteRoom/", function(req, res) {
         "use strict";
         var roomName = req.body.roomName;
         var roomId = localRoomList[roomName];
         console.log("Received a request to delete a room named " + roomName);

         // Check if the room ID is valid
         if (!roomId) {
         res.send("Failed to delete room; the room Id was invalid");
         return;
         }
         // Check if the room is empty
         N.API.getUsers(roomId, function(userList) {
                        var users = JSON.parse(userList);
                        if (users.length > 0) {
                        res.send("Error: Cannot delete nonempty rooms");
                        } else {
                        // If the room is empty, delete it
                        N.API.deleteRoom(roomId, function(result) {
                                         console.log("Result of room deletion: " + result);
                                         delete localRoomList[roomName];
                                         io.sockets.emit("roomDeleted", {roomId: roomId});
                                         res.send("Room " + roomName + " successfully deleted");
                                         });                        
                        }
                        });
         });

/**
 Responds to the client with a list of all Lynckia rooms
 */
app.get("/getRooms/", function (req, res) {
        "use strict";
        N.API.getRooms(function (rooms) {
                       res.send(rooms);
                       });
        });

/**
 Responds to the client with the specified room
 */
app.post("/getRoom/", function(req, res) {
         "use strict";
         var roomName = req.body.roomName;
         N.API.getRooms(function(roomList) {
                        var rooms = JSON.parse(roomList);
                        for (var i = 0; i < rooms.length; i++) {
                        if (rooms[i].name == roomName) {
                        console.log("Answering with room named", rooms[i].name);
                        res.send(rooms[i]);
                        return;
                        }
                        }
                        console.log("No room with name " + roomName + " was found" );
                        res.send();
                        });
         });

/**
 Responds to the client with a list of all Lynckia users in the room
 specified in the request paramater 'room'

app.get("/getUsers/:room", function (req, res) {
        "use strict";
        var room = req.params.room;
        N.API.getUsers(room, function (users) {
                       res.send(users);
                       });
        });
  */

/**
 TODO: Description
 */
app.get("/gets3policy", function(req, res) {
        "use strict";
        if (remainingPolicies > 0) {
        remainingPolicies--;
        var credentials = createS3Policy();
        res.json(credentials);
        } else {
        res.json({error: "No more policies available today"});
        }
        });

// Delete all rooms that exist form before
deletionLoop();
app.listen(3001);
var server = https.createServer(options, app);
server.listen(3004);