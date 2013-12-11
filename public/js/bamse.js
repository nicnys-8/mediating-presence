
var bamse = {
	
	src : {src:"http://www.youtube.com/watch?v=DHdGjldEukQ", type:"video/youtube"},
		  /*[{src : "/videos/bamse.ogg", type : "video/ogg"},
		   {src : "/videos/bamse.mp4", type : "video/mp4"}],*/
	
	events : {
		"0.0" : {
			type : "set-background",
			data : {
				name : "trollskogen",
			},
		},
		"5.0" : {
			type : "add-character",
			data : {
				name : "skalman",
				receiver : "random", // all/first/last ???
				response : {
					accepts : "return",
					until : "10.0",
				}
			},
		},
		/*
		"7.5" : {
			type : "set-sprite",
			data : {
				target : "skalman",
				name : "walk",
			}
		},
		 */
		"10.0" : {
			type : "remove-character",
			data : {
				name : "skalman",
			},
		},
	},
	
	/*
	events : [{
			  time : 0.4,
			  type : "show-graphics",
			  // ...
			  }],
	*/
	
	backgroundsBaseURL : "/images/bamse/backgrounds/",
	backgrounds : {
		// "_baseURL" : "/images/bamse/backgrounds/",
		"trollskogen" : "trollskogen.jpg",
	},
	
	characters : {
		/*"_all" : {
			behavior : [ "gravity", "draggable", ],
		},*/
		"skalman" : {
			spritesBaseURL : "/images/bamse/",
			sprites : {
				"_default" : "skalman.jpg",
				"walk" : [ "skalmanWalk1.png", "skalmanWalk2.png", "skalmanWalk3.png" ],
				"stand" : "skalman.png",
			},
			behavior : [ "gravity", "walk", "...", ],
			actions : {
				"walk" : {
					sprite : "walk"
				},
			},
		},
	},
};

/*
for (var i in bamse.events) {
	bamse.events[i].id = (Math.random() * 10e16).toFixed(0).toString();
}
 */




