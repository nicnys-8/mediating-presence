
var bamse = {
	
    title : "Bamse världens starkaste björn",
    
	src : { src:"http://www.youtube.com/watch?v=DHdGjldEukQ", type:"video/youtube" },
		  /*[{src : "/videos/bamse.ogg", type : "video/ogg"},
		   {src : "/videos/bamse.mp4", type : "video/mp4"}],*/
	
	events : [
			  /*{
			  time : 0.0,
			  type : "set-background",
			  data : { name : "trollskogen", },
			  },*/
              
              {
			  time : 1.0,
			  type : "add-object",
			  data : {
                sprite : "title",
                x : 400,
                y : 300,
                scale : 0,
                actions : [
                           {name : "Scale", args : [1, 2]},
                           {name : "Rotate", args : [720, 2]},
                           ],
                },
			  },
              
			  {
			  time : 5.0,
			  type : "add-object",
			  data : {
				id : "skalman",
                template : "skalman",
				responseTime:5,
				responseType:"click",
				responseId:"123", // this will be set by the dispatcher
                },
			  },
			  
              {
			  time : 10.0,
			  type : "remove-object",
			  data : { id : "skalman", },
			  },
              
              {
			  time : 15.0,
			  type : "add-object",
			  data : {
                id : "lilleskutt",
                template : "lilleskutt",
                responseTime:15,
                responseType:"click",
                },
			  },
             
              {
			  time : 20.0,
			  type : "add-object",
			  data : {
                id : "bamse",
                template : "bamse",
                responseTime:10,
                responseType:"click",
                },
			  },
			  
              {
			  time : 30.0,
			  type : "remove-object",
			  data : { id : "bamse", },
			  },
			  
              {
			  time : 30.0,
			  type : "remove-object",
			  data : { id : "lilleskutt", },
			  },
			  ],
	
	backgrounds : {
		// "urlBase" : "/images/bamse/backgrounds/",
		"trollskogen" : "/images/bamse/backgrounds/trollskogen.jpg",
	},
    
    sprites : {
        // "urlBase" : "/images/bamse/",
        "bamse" : "/images/bamse/bamse.png",
        "skalman" : "/images/bamse/skalman.png",
        "lilleskutt" : "/images/bamse/lilleskutt.png",
        "title" : "/images/bamse/bamse-title.gif",
    },
	
    templates : {
		"bamse" : {
			sprite : "bamse",
            speed : 5,
            actions : [
                       {name : "Bounce"},
                       {name : "Move"},
                       {name : "Rotate", args : [{speed:180}, -1]},
                       ],
            // x:y:dx:dy:rotation:scale:alpha:
		},
		"skalman" : {
            alpha : 0,
			sprite : "skalman",
            actions : [ {name : "FadeIn", args : [1]} ],
		},
		"lilleskutt" : {
			sprite : "lilleskutt",
            x : 400,
            y : 300,
            dx : 10,
            dy : -30,
            actions : [
                       {name : "Move"},
                       {name : "Bounce", args : [{restitution : 0.8}]},
                       {name : "Accelerate", args : [{y : 1, maxDy : 30}, -1]},
                       {name : "Friction", args : [{x : 0.05}, -1]},
                       ],
        },
    },
};