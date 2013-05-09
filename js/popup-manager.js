
/**
 Used for showing popup messages on top of a page.
 Manages popups for iframes as well; just include the script
 in the html for the iframe and it should work there.
 Currently does not support nested iframes (within the iframes).
 
 **Dependencies**
 Scripts: jQuery
 Style sheet: popup.css (soon)
 HTML:
	<div id="popupBlanket">
		<div id="popupContainer"></div>
	</div>
 */
PopupManager = function() {
	
	var parent = null;
	var isTop = false;
	var isShowingMessage = false;
	var queue = [];
	var container, blanket;
	
	/**
	 This is called automatically on the top level PopupManager
	 and initializes it.
	 "Top level" refers to the PopupManager not in an iframe.
	 */
	var setAsTop = function() {
		
		if (typeof jQuery === "undefined") {
			// TODO: Load the script?
			console.warn("PopupManager needs jQuery to work, please include the script somewhere!");
			return;
		}
		
		isTop = true;
		
		// TODO: Inject style?
		// TODO: Create blanket and container here?
		container = $("#popupContainer");
		blanket = $("#popupBlanket");
		
		// Show a popup if any has been enqueued
		dequeueMessage();
		
		// Set the parent
		$("iframe").each(function() {
						 var manager = this.contentWindow.PopupManager;
						 if (manager) {
							manager.setParent(PopupManager);
						 }
				  });
	}
	
	/**
	 Sets the parent object and passes on enqueued popups
	 */
	var setParent = function(aParent) {
		
		parent = aParent;
		
		// Pass enqueued messages to parent
		for (var i = 0; i < queue.length; i++) {
			parent.showPopup(queue[i]);
		}
		
		queue = [];
	}
	
	/**
	 Creates a popup div with text, image and buttons
	 @param messageText The text to display
	 @param imageUrl URL of an image or null
	 @param button1 object describing button with properties text and func
	 @param button2 optional second button description
	 */
	var createPopup = function(messageText, imageUrl, button1, button2) {
		
		// Create content div
		var content = document.createElement("div");
		content.className = "popup-content";
		
		// Create the image (if specified)
		if (imageUrl) {
			var image = new Image();
			image.className = "popup-icon";
			image.src = imageUrl;
			content.appendChild(image);
		}
		
		// Create a span for the text
		var message = document.createElement("span");
		message.innerHTML = messageText;
		content.appendChild(message);
		content.appendChild(document.createElement("br"));
		
		// Create first button
		var b1 = document.createElement("button");
		b1.innerHTML = button1.text;
		b1.onclick = function() {
			var func = button1.func;
			if (func) {
				func();
			}
			hidePopup();
		};
		content.appendChild(b1);
		
		// Create second button (if specified)
		if (button2) {
			var b2 = document.createElement("button");
			b2.innerHTML = button2.text;
			b2.onclick = function() {
				var func = button2.func;
				if (func) {
					func();
				}
				hidePopup();
			};
			content.appendChild(b2);
		}
		
		return content;
	}
	
	/**
	 Used internally to show popups from the queue 
	 */
	var dequeueMessage = function() {
		if (queue.length > 0) {
			var popup = queue[0];
			queue.splice(0, 1);
			isShowingMessage = false;
			showPopup(popup);
		}
	}
	
	/**
	 Displays a popup message, or enqueues it if another 
	 one is already displayed
	 */
	var showPopup = function(popup) {
		
		if (isTop) {
			
			if (isShowingMessage) {
				
				queue.push(popup);
				
			} else {
				
				isShowingMessage = true;
				
				container.children().detach();
				container.append(popup);
				container.show();
				container.animate({ top:"50%", },
								  500, function() {});
				blanket.show();
				blanket.animate({ opacity:1.0, },
								500, function() {});
			}
			
		} else if (parent) {
			parent.showPopup(popup);
		} else {
			// If not top, or parent has not been set yet, queue the message
			queue.push(popup);
		}
	}
	
	/**
	 Hides the popup. Do not use! :)
	 */
	var hidePopup = function() {
		
		if (isTop) {

			if (queue.length == 0) {
				
				container.animate({ top:"100%", },
							  500, function() {
									isShowingMessage = false;
								  
									// Dequeue a message in case someone has managed
									// to enqueue a message during the animation
									dequeueMessage();
									$(this).hide();
							  });
				
				blanket.animate({ opacity:0.0, },
								500, function() {
									$(this).hide();
								});
			} else {
				
				// If the queue is not empty, hide the popup, but not the "blanket"
				container.animate({ top:"100%", },
							  500, function() {
									dequeueMessage();
							  });
			}
			
		} else {
			// Is this right? :)
			parent.hidePopup();
		}
	}

	// Return public API
	return {
		createPopup : createPopup,
		showPopup : showPopup,
		hidePopup : hidePopup,
		setAsTop : setAsTop,
		setParent : setParent,
	};
}();

/**
 This lets you run the html separately as well as in an iframe tab
 */
if (window.self === window.top) {
	window.addEventListener("load", function() {
								PopupManager.setAsTop();
							}, false);
}



