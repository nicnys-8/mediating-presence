
/**
 A timer object with second precision
 @param elemnent The HTML element in which the time is displayed 
 */

Timer = function(element) {
    var intervalId;
    
    // Private variables
    var element = element;
    var timer, sec, min;
    
    /**
     Starts the timer update loop
     */
    var start = function() {
        // If the timer is not already running, start it
        if (!intervalId) {
            intervalId = setInterval(updateTime, 1000);
        }
        timer = 0;
        sec = 0;
        min = 0;
        element.innerHTML = "Time passed: " + getTimeString();
    };

    /**
     Sets the timer to 00:00
     */
    var stop = function() {
        clearInterval(intervalId);
        intervalId = null;
    };
    
    /**
     Update the current time
     */
    var updateTime = function(time) {
        timer++;
        sec = timer % 60;
        min = Math.floor(timer / 60);
        element.innerHTML = "Time passed: " + getTimeString();
    };
    
    /**
     Returns a string representing the current time
     */
    var getTimeString = function() {
        return pad(min) + ":" + pad(sec);
    };
    
    /**
     Returns a two character long string representing the input value
     */
    var pad = function(val) {
        return val > 9 ? val : "0" + val;
    };
    
    // Public methods
    this.start = start;
    this.stop = stop;
    this.getTimeString = getTimeString;
};