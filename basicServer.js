/*global require, __dirname, console*/

var MAX_ROOM_LENGTH = 20;

var express = require("express"),
	net = require("net"),
	Nuve = require("./nuve"),
	fs = require("fs"),
	io = require("socket.io").listen(3005),
	https = require("https"),
	config = require("./../../lynckia_config"),
	crypto = require( "crypto" );

/*
 Dictionary containing room information-
 the property names are Lynckia room names,
 and their values are the corresponding room IDs
 */
var publicRooms = {},
	demoRooms = {};

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
			res.header("Access-Control-Allow-Headers", "X-Requested-With");
			if (req.method == "OPTIONS") {
				res.send(200);
			} else {
				next();
			}
        });

Nuve.API.init(config.nuve.superserviceID, config.nuve.superserviceKey, "http://localhost:3000/");

/**
 Deletes all existing rooms, one at a time
 */
function deleteAllRooms() {
    Nuve.API.getRooms(function (roomList) {
                   "use strict";
                   var rooms = JSON.parse(roomList);
                   if (rooms.length > 0) {
                   Nuve.API.deleteRoom(rooms[0]._id, function(result) {
                                    // console.log("Room " + rooms[0].name + " deleted");
                                    // Recursive call
                                    deleteAllRooms();
                                    });
                   } else {
                   return;
                   }
                   });
};

/**
 Creates a new token and returns it to the user
 */
function createToken(req, res) {
	"use strict";
	
	var username = req.body.username,
		role = req.body.role,
		roomId = req.body.roomId;
	
	// Empty strings are not allowed
	if (username.length == 0) {
		res.send("Error: An empty string is not a username");
		return;
	}
	// If the username was not an empty string, create the token
	Nuve.API.createToken(roomId, username, role, function (token) {
					  // console.log("Answering with token", token);
					  res.send(token);
					  });
}
app.post("/createToken/", createToken);


/**
 Creates a new Lynckia room
 */
function createRoom(req, res) {
	"use strict";
	
	var roomName = req.body.roomName;
	
	// console.log("Received a request to create a room with name " + roomName);
	
	// Check if the room name is valid
	var errorMessage;
	if (!roomName) {
		errorMessage = "Error: Missing room name parameter";
	} else if (roomName.length == 0) {
		errorMessage = "Error: An empty string is not a valid room name";
	} else if (roomName.length > MAX_ROOM_LENGTH) {
		errorMessage = "Error: A room name can be no longer than " + MAX_ROOM_LENGTH + " letters";
	} else if (publicRooms[roomName]) {
		errorMessage = "Error: A room with that name already exists";
	}
	
	if (errorMessage) {
		res.send(errorMessage);
		return;
	}
	
	// If the name is unique, create the room
	Nuve.API.createRoom(roomName, function(room) {
					 publicRooms[room.name] = room;
					 // Inform all users that a room was added
					 var roomData = JSON.stringify(room);
					 io.sockets.emit("roomAdded", {room:room});
					 var resultMessage = "Successfully created a room with name " + roomName;
					 // console.log(resultMessage);
					 res.send(resultMessage);
					 });
}
app.post("/createRoom/", createRoom);


/**
 Responds to the client with a list of all Lynckia users in the room
 specified in the request paramater 'room'
 */
function deleteRoom(req, res) {
	"use strict";
	
	var roomName = req.body.roomName,
		room = publicRooms[roomName];
	// console.log("Received a request to delete a room named " + roomName);
	
	// Check if the room ID is valid
	if (!room) {
		res.send("Failed to delete room; the room Id was invalid");
		return;
	}
	
	var roomId = room._id;
	
	// Check if the room is empty
	Nuve.API.getUsers(roomId, function(userList) {
				   var users = JSON.parse(userList);
				   if (users.length > 0) {
				   res.send("Error: Cannot delete nonempty rooms");
				   } else {
				   // If the room is empty, delete it
				   Nuve.API.deleteRoom(roomId, function(result) {
									// console.log("Result of room deletion: " + result);
									delete publicRooms[roomName];
									io.sockets.emit("roomDeleted", {roomId: roomId});
									res.send("Room " + roomName + " successfully deleted");
									});
				   }
				   });
}
app.post("/deleteRoom/", deleteRoom);


/**
 Responds to the client with a list of all Lynckia rooms
 */
function getRooms(req, res) {
	"use strict";
	var rooms = [], name;
	for (name in publicRooms) {
		rooms.push(publicRooms[name]);
	}
	res.send(rooms);
	/*
	Nuve.API.getRooms(function (rooms) {
					res.send(rooms);
				   });
	 */
}
app.get("/getRooms/", getRooms);


/**
 Responds to the client with the specified room
 */
function getRoom(req, res) {
	"use strict";
	var roomName = req.body.roomName;
	Nuve.API.getRooms(function(roomList) {
					var rooms = JSON.parse(roomList);
					for (var i = 0; i < rooms.length; i++) {
						if (rooms[i].name == roomName) {
						// console.log("Answering with room named", rooms[i].name);
						res.send(rooms[i]);
						return;
						}
					}
					// console.log("No room with name " + roomName + " was found" );
					res.send();
				   });
}
app.post("/getRoom/", getRoom);


/*========================
 ------ Demo rooms ------
 =======================*/

function createDemoRooms() {
	Nuve.API.createRoom("peek", function(room) { demoRooms["peek"] = room });
	Nuve.API.createRoom("share", function(room) { demoRooms["share"] = room });
	Nuve.API.createRoom("play", function(room) { demoRooms["play"] = room });
}

function getDemoRooms() {
	"use strict";
	/*var rooms = [], name;
	for (name in demoRooms) {
		rooms.push(demoRooms[name]);
	}*/
	res.send(demoRooms);
}
app.get("/getDemoRooms/", getDemoRooms);

/**
 Responds to the client with a list of all Lynckia users in the room
 specified in the request paramater 'room'

app.get("/getUsers/:room", function (req, res) {
        "use strict";
        var room = req.params.room;
        Nuve.API.getUsers(room, function (users) {
                       res.send(users);
                       });
        });
  */


/*========================
 --- Amazon S3 storage ---
 =======================*/

var POLICIES_PER_DAY = 100,
	// The number of seconds that passes before the number of policies are refreshed:
	POLICY_REFRESH_TIME = 1000 * 60 * 60 * 24, // 24 hours
	remainingPolicies = POLICIES_PER_DAY;

setInterval(function() {
            remainingPolicies = POLICIES_PER_DAY;
            }, POLICY_REFRESH_TIME);

function createS3Policy() {
    
	var s3Policy, s3PolicyBase64, date, filename;
	
    date = new Date();
    filename = remainingPolicies; // This gives us a unique filename
	
    s3Policy = {
        expiration: "" +
			(date.getFullYear()) + "-" +
			(date.getMonth() + 1) + "-" +
			(date.getDate()) + "T" +
			(date.getHours()) + ":" +
			(date.getMinutes() + 5) + ":" +
			(date.getSeconds()) + "Z", // set to expire in five minutes
        conditions: [
					 {"bucket": "mediating-presence"},
					 // ["starts-with", "$key", "uploads/" + filename],
					 {"key": "uploads/" + filename},
					 {"acl": "public-read"},
					 {"success_action_redirect": "/"}, // TODO: Remove
					 ["starts-with", "$Content-Type", ""], // TODO: Remove?
					 ["content-length-range", 0, 20000000]
					 ]
    };
	
    s3PolicyBase64 = new Buffer(JSON.stringify(s3Policy)).toString("base64");
	
    s3Credentials = {
		s3PolicyBase64: s3PolicyBase64,
		s3Signature: crypto.createHmac("sha1", config.cloudProvider.secretAccessKey).update(s3PolicyBase64).digest("base64"),
		s3Key: config.cloudProvider.accessKey,
		s3Redirect: "/",
		s3Policy: s3Policy,
		s3Filename: filename,
		s3Url: "https://mediating-presence.s3.amazonaws.com/"
    };
	
    return s3Credentials;
};

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


// Delete all rooms that exist from before
deleteAllRooms();
// Create demo rooms
createDemoRooms();

app.listen(3001);

var options = {
	key: fs.readFileSync("cert/key.pem").toString(),
	cert: fs.readFileSync("cert/cert.pem").toString()
};
var server = https.createServer(options, app);
server.listen(3004);

