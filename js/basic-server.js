/*global require, __dirname, console*/

const MAX_ROOM_LENGTH = 20;

var express = require("express"),
net = require("net"),
N = require("./nuve"),
fs = require("fs"),
io = require("socket.io").listen(3005),
https = require("https"),
config = require("./../../lynckia_config");

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

// Delete all rooms that exist form before
deletionLoop();
app.listen(3001);
var server = https.createServer(options, app);
server.listen(3004);