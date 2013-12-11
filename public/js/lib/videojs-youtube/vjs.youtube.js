/**
 * @fileoverview Vimeo Media Controller - Wrapper for Vimeo Media API
 */

var VimeoState = {
UNSTARTED: -1,
ENDED: 0,
PLAYING: 1,
PAUSED: 2,
BUFFERING: 3
};

/**
 * Vimeo Media Controller - Wrapper for Vimeo Media API
 * @param {videojs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
videojs.Vimeo = videojs.MediaTechController.extend({
												   init: function(player, options, ready){
												   
												   var regExp = /^.*(vimeo\.com\/)((channels\/[A-z]+\/)|(groups\/[A-z]+\/videos\/))?([0-9]+)/; // Regex that parse the video ID for any Vimeo URL
												   var params, match = options.source.src.match(regExp);
												   
												   
												   if (match){
												   this.videoId = match[5];
												   // TODO: Get the poster URL using Ajax
												   }
												   
												   this.player_ = player;
												   this.options_ = options;
												   
												   player.controls(false);
												   
												   this.id_ = this.player_.id() + '_vimeo_api';
												   
												   params = {
												   api: 1,
												   byline: 0,
												   portrait: 0,
												   show_title: 0,
												   show_byline: 0,
												   show_portait: 0,
												   fullscreen: 1,
												   player_id: this.id(),
												   autoplay: true,
												   loop: (this.player_.options_.loop)?1:0
												   };
												   
												   this.baseUrl = 'http' + (document.location.href.indexOf('https') === 0 ? 's' : '') + '://player.vimeo.com/video/';
												   
												   this.vimeo = {};
												   this.vimeoInfo = {};
												   
												   this.createEl();
												   
												   this.el_.vjsTech = this;
												   this.el_.onload = function() { this.vjsTech.onLoad(); };
												   
												   this.vimeo = {api: function(){}}; // todo: cache commands prior to vimeo api being ready. for now, they will just be ignored
												   
												   this.el_.src = this.baseUrl + this.videoId + '?' + videojs.Vimeo.makeQueryString(params);
												   }
												   });


videojs.Vimeo.prototype.dispose = function(){
	
	//this.player_.controls(true);
	this.vimeo.api('unload');
	delete this.vimeo;
	this.el_.parentNode.removeChild(this.el_);
	videojs.MediaTechController.prototype.dispose.call(this);
};

videojs.Vimeo.prototype.createEl = function(){
	var player = this.player_;
	
	var iframe = videojs.createEl('iframe', {
								  id: player.id() + '_vimeo_api',
								  className: 'vjs-tech',
								  scrolling: 'no',
								  marginWidth: 0,
								  marginHeight: 0,
								  frameBorder: 0,
								  webkitAllowFullScreen: '',
								  mozallowfullscreen: '',
								  allowFullScreen: ''
								  });
	
	videojs.insertFirst(iframe, player.el());
	
	this.el_ = iframe;
};

videojs.Vimeo.prototype.onLoad = function(){
	this.vimeo = $f(this.el_);
	
	this.vimeoInfo = {
    state: VimeoState.UNSTARTED,
    volume: 1,
    muted: false,
    muteVolume: 1,
    time: 0,
    duration: 0,
    buffered: 0,
    url: this.baseUrl + this.videoId,
    error: null
	};
	
	this.vimeo.addEvent('ready', function(id){ videojs.el(id).vjsTech.onReady(); });
	this.vimeo.addEvent('loadProgress', function(data, id){ videojs.el(id).vjsTech.onLoadProgress(data); });
	this.vimeo.addEvent('playProgress', function(data, id){ videojs.el(id).vjsTech.onPlayProgress(data); });
	this.vimeo.addEvent('play', function(id){ videojs.el(id).vjsTech.onPlay(); });
	this.vimeo.addEvent('pause', function(id){ videojs.el(id).vjsTech.onPause(); });
	this.vimeo.addEvent('finish', function(id){ videojs.el(id).vjsTech.onFinish(); });
	this.vimeo.addEvent('seek', function(id){ videojs.el(id).vjsTech.onSeek(data); });
};

videojs.Vimeo.prototype.src = function(source){
	this.dispose(); // the vimeo API seems to have no way of changing the source, so we have to dispose of the iframe and re-initialize
	this.options_.source = {
    src: source,
    type: "video/vimeo"
	};
	this.init(this.player_,this.options_);
};

videojs.Vimeo.prototype.play = function(){
	if ((vjs.IS_IOS || vjs.IS_ANDROID)){
		return;
	}
	this.vimeo.api('play');
};
videojs.Vimeo.prototype.pause = function(){ this.vimeo.api('pause'); };
videojs.Vimeo.prototype.paused = function(){
	return this.lastState !== VimeoState.PLAYING &&
	this.lastState !== VimeoState.BUFFERING;
};

videojs.Vimeo.prototype.currentTime = function(){ return this.vimeoInfo.time || 0; };

videojs.Vimeo.prototype.setCurrentTime = function(seconds){
	this.vimeo.api('seekTo', seconds);
	this.player_.trigger('timeupdate');
};

videojs.Vimeo.prototype.duration = function(){ return this.vimeoInfo.duration || 0; };
videojs.Vimeo.prototype.buffered = function(){ return videojs.createTimeRange(0, this.vimeoInfo.buffered || 0); };

videojs.Vimeo.prototype.volume = function() { return (this.vimeoInfo.muted)? this.vimeoInfo.muteVolume : this.vimeoInfo.volume; };
videojs.Vimeo.prototype.setVolume = function(percentAsDecimal){
	this.vimeo.api('setvolume', percentAsDecimal);
	this.vimeo.vimeoInfo.volume = percentAsDecimal;
	this.player_.trigger('volumechange');
};

videojs.Vimeo.prototype.muted = function() { return this.vimeoInfo.muted || false; };
videojs.Vimeo.prototype.setMuted = function(muted) {
	if (muted) {
		this.vimeoInfo.muteVolume = this.vimeoInfo.volume;
		this.setVolume(0);
	} else {
		this.setVolume(this.vimeoInfo.muteVolume);
	}
	
	this.vimeoInfo.muted = muted;
	this.player_.trigger('volumechange');
};

videojs.Vimeo.prototype.onReady = function(){
	this.triggerReady();
	this.player_.trigger('canplay');
	
	// We can't hide the Vimeo control bar so we hide the VJS control bar
	// TODO:
	this.player_.bigPlayButton.hide();
	this.player_.posterImage.hide();
	this.player_.controlBar.hide();
};

videojs.Vimeo.prototype.onLoadProgress = function(data){
	var durationUpdate = !this.vimeoInfo.duration;
	this.vimeoInfo.duration = data.duration;
	this.vimeoInfo.buffered = data.percent;
	this.player_.trigger('progress');
	if (durationUpdate) this.player_.trigger('durationchange');
};

videojs.Vimeo.prototype.onPlayProgress = function(data){
	this.vimeoInfo.time = data.seconds;
	this.player_.trigger('timeupdate');
};

videojs.Vimeo.prototype.onPlay = function(){
	this.vimeoInfo.state = VimeoState.PLAYING;
	this.player_.trigger('play');
};

videojs.Vimeo.prototype.onPause = function(){
	this.vimeoInfo.state = VimeoState.PAUSED;
	this.player_.trigger('pause');
};

videojs.Vimeo.prototype.onFinish = function(){
	this.vimeoInfo.state = VimeoState.ENDED;
	this.player_.trigger('ended');
};

videojs.Vimeo.prototype.onSeek = function(data){
	this.vimeoInfo.time = data.seconds;
	this.player_.trigger('timeupdate');
	this.player_.trigger('seeked');
};

videojs.Vimeo.isSupported = function(){
	return true;
};

videojs.Vimeo.canPlaySource = function(srcObj){
	return (srcObj.type == 'video/vimeo');
};

videojs.Vimeo.prototype.features = {
fullscreen: true,
volumeControl: true
};

videojs.Vimeo.makeQueryString = function(args){
	var array = [];
	for (var key in args){
		if (args.hasOwnProperty(key)){
			array.push(encodeURIComponent(key) + '=' + encodeURIComponent(args[key]));
		}
	}
	
	return array.join('&');
};

// Froogaloop API -------------------------------------------------------------

// From https://github.com/vimeo/player-api/blob/master/javascript/froogaloop.js
var Froogaloop = (function(){
				  // Define a local copy of Froogaloop
				  function Froogaloop(iframe) {
				  // The Froogaloop object is actually just the init constructor
				  return new Froogaloop.fn.init(iframe);
				  }
				  
				  var eventCallbacks = {},
				  hasWindowEvent = false,
				  isReady = false,
				  slice = Array.prototype.slice,
				  playerDomain = '';
				  
				  Froogaloop.fn = Froogaloop.prototype = {
				  element: null,
				  
				  init: function(iframe) {
				  if (typeof iframe === "string") {
				  iframe = document.getElementById(iframe);
				  }
				  
				  this.element = iframe;
				  
				  // Register message event listeners
				  playerDomain = getDomainFromUrl(this.element.getAttribute('src'));
				  
				  return this;
				  },
				  
				  /*
				   * Calls a function to act upon the player.
				   *
				   * @param {string} method The name of the Javascript API method to call. Eg: 'play'.
				   * @param {Array|Function} valueOrCallback params Array of parameters to pass when calling an API method
				   *                                or callback function when the method returns a value.
				   */
				  api: function(method, valueOrCallback) {
				  if (!this.element || !method) {
				  return false;
				  }
				  
				  var self = this,
				  element = self.element,
				  target_id = element.id !== '' ? element.id : null,
				  params = !isFunction(valueOrCallback) ? valueOrCallback : null,
				  callback = isFunction(valueOrCallback) ? valueOrCallback : null;
				  
				  // Store the callback for get functions
				  if (callback) {
				  storeCallback(method, callback, target_id);
				  }
				  
				  postMessage(method, params, element);
				  return self;
				  },
				  
				  /*
				   * Registers an event listener and a callback function that gets called when the event fires.
				   *
				   * @param eventName (String): Name of the event to listen for.
				   * @param callback (Function): Function that should be called when the event fires.
				   */
				  addEvent: function(eventName, callback) {
				  if (!this.element) {
				  return false;
				  }
				  
				  var self = this,
				  element = self.element,
				  target_id = element.id !== '' ? element.id : null;
				  
				  
				  storeCallback(eventName, callback, target_id);
				  
				  // The ready event is not registered via postMessage. It fires regardless.
				  if (eventName != 'ready') {
				  postMessage('addEventListener', eventName, element);
				  }
				  else if (eventName == 'ready' && isReady) {
				  callback.call(null, target_id);
				  }
				  
				  return self;
				  },
				  
				  /*
				   * Unregisters an event listener that gets called when the event fires.
				   *
				   * @param eventName (String): Name of the event to stop listening for.
				   */
				  removeEvent: function(eventName) {
				  if (!this.element) {
				  return false;
				  }
				  
				  var self = this,
				  element = self.element,
				  target_id = element.id !== '' ? element.id : null,
				  removed = removeCallback(eventName, target_id);
				  
				  // The ready event is not registered
				  if (eventName != 'ready' && removed) {
				  postMessage('removeEventListener', eventName, element);
				  }
				  }
				  };
				  
				  /**
				   * Handles posting a message to the parent window.
				   *
				   * @param method (String): name of the method to call inside the player. For api calls
				   * this is the name of the api method (api_play or api_pause) while for events this method
				   * is api_addEventListener.
				   * @param params (Object or Array): List of parameters to submit to the method. Can be either
				   * a single param or an array list of parameters.
				   * @param target (HTMLElement): Target iframe to post the message to.
				   */
				  function postMessage(method, params, target) {
				  if (!target.contentWindow.postMessage) {
				  return false;
				  }
				  
				  var url = target.getAttribute('src').split('?')[0],
				  data = JSON.stringify({
										method: method,
										value: params
										});
				  
				  if (url.substr(0, 2) === '//') {
				  url = window.location.protocol + url;
				  }
				  
				  target.contentWindow.postMessage(data, url);
				  }
				  
				  /**
				   * Event that fires whenever the window receives a message from its parent
				   * via window.postMessage.
				   */
				  function onMessageReceived(event) {
				  var data, method;
				  
				  try {
				  data = JSON.parse(event.data);
				  method = data.event || data.method;
				  }
				  catch(e)  {
				  //fail silently... like a ninja!
				  }
				  
				  if (method == 'ready' && !isReady) {
				  isReady = true;
				  }
				  
				  // Handles messages from moogaloop only
				  if (event.origin != playerDomain) {
				  return false;
				  }
				  
				  var value = data.value,
				  eventData = data.data,
				  target_id = target_id === '' ? null : data.player_id,
				  
				  callback = getCallback(method, target_id),
				  params = [];
				  
				  if (!callback) {
				  return false;
				  }
				  
				  if (value !== undefined) {
				  params.push(value);
				  }
				  
				  if (eventData) {
				  params.push(eventData);
				  }
				  
				  if (target_id) {
				  params.push(target_id);
				  }
				  
				  return params.length > 0 ? callback.apply(null, params) : callback.call();
				  }
				  
				  
				  /**
				   * Stores submitted callbacks for each iframe being tracked and each
				   * event for that iframe.
				   *
				   * @param eventName (String): Name of the event. Eg. api_onPlay
				   * @param callback (Function): Function that should get executed when the
				   * event is fired.
				   * @param target_id (String) [Optional]: If handling more than one iframe then
				   * it stores the different callbacks for different iframes based on the iframe's
				   * id.
				   */
				  function storeCallback(eventName, callback, target_id) {
				  if (target_id) {
				  if (!eventCallbacks[target_id]) {
				  eventCallbacks[target_id] = {};
				  }
				  eventCallbacks[target_id][eventName] = callback;
				  }
				  else {
				  eventCallbacks[eventName] = callback;
				  }
				  }
				  
				  /**
				   * Retrieves stored callbacks.
				   */
				  function getCallback(eventName, target_id) {
				  if (target_id) {
				  return eventCallbacks[target_id][eventName];
				  }
				  else {
				  return eventCallbacks[eventName];
				  }
				  }
				  
				  function removeCallback(eventName, target_id) {
				  if (target_id && eventCallbacks[target_id]) {
				  if (!eventCallbacks[target_id][eventName]) {
				  return false;
				  }
				  eventCallbacks[target_id][eventName] = null;
				  }
				  else {
				  if (!eventCallbacks[eventName]) {
				  return false;
				  }
				  eventCallbacks[eventName] = null;
				  }
				  
				  return true;
				  }
				  
				  /**
				   * Returns a domain's root domain.
				   * Eg. returns http://vimeo.com when http://vimeo.com/channels is sbumitted
				   *
				   * @param url (String): Url to test against.
				   * @return url (String): Root domain of submitted url
				   */
				  function getDomainFromUrl(url) {
				  if (url.substr(0, 2) === '//') {
				  url = window.location.protocol + url;
				  }
				  
				  var url_pieces = url.split('/'),
				  domain_str = '';
				  
				  for(var i = 0, length = url_pieces.length; i < length; i++) {
				  if(i<3) {domain_str += url_pieces[i];}
				  else {break;}
				  if(i<2) {domain_str += '/';}
				  }
				  
				  return domain_str;
				  }
				  
				  function isFunction(obj) {
				  return !!(obj && obj.constructor && obj.call && obj.apply);
				  }
				  
				  function isArray(obj) {
				  return toString.call(obj) === '[object Array]';
				  }
				  
				  // Give the init function the Froogaloop prototype for later instantiation
				  Froogaloop.fn.init.prototype = Froogaloop.fn;
				  
				  // Listens for the message event.
				  // W3C
				  if (window.addEventListener) {
				  window.addEventListener('message', onMessageReceived, false);
				  }
				  // IE
				  else {
				  window.attachEvent('onmessage', onMessageReceived);
				  }
				  
				  // Expose froogaloop to the global object
				  return (window.Froogaloop = window.$f = Froogaloop);
				  
				  })();;/**
						 * @fileoverview YouTube Media Controller - Wrapper for YouTube Media API
						 */

/**
 * YouTube Media Controller - Wrapper for YouTube Media API
 * @param {videojs.Player|Object} player
 * @param {Object=} options
 * @param {Function=} ready
 * @constructor
 */
videojs.Youtube = videojs.MediaTechController.extend({
													 init: function(player, options, ready){
													 
													 var source, match;
													 var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/; // Regex that parse the video ID for any YouTube URL
													 
													 videojs.MediaTechController.call(this, player, options, ready);
													 
													 
													 this.features.fullscreenResize = true;
													 this.player_ = player;
													 this.player_el_ = document.getElementById(this.player_.id());
													 
													 source = options.source;
													 
													 
													 this.videoId = videojs.Youtube.getIdByUrl(source.src) || '';
													 
													 if ((vjs.IS_IOS || vjs.IS_ANDROID)){
													 this.player_.options({ytcontrols: true});
													 }
													 
													 /*try{
													  match = source.src.match(regExp);
													  }catch(err){
													  
													  }
													  if (match && match[2].length == 11){
													  this.videoId = match[2];
													  
													  // Show the YouTube poster only if we don't use YouTube poster (otherwise the controls pop, it's not nice)
													  if (!this.player_.options().ytcontrols){
													  this.player_.poster('http://img.youtube.com/vi/' + this.videoId + '/0.jpg');
													  
													  // Cover the entire iframe to have the same poster than YouTube
													  // Doesn't exist right away because the DOM hasn't created it
													  var self = this;
													  setTimeout(function(){ self.player_.posterImage.el().style.backgroundSize = 'cover'; }, 50);
													  }
													  } else {
													  this.videoId = '';
													  }*/
													 
													 this.id_ = this.player_.id() + '_youtube_api';
													 
													 this.el_ = videojs.Component.prototype.createEl('iframe', {
																									 id: this.id_,
																									 className: 'vjs-tech',
																									 scrolling: 'no',
																									 marginWidth: 0,
																									 marginHeight: 0,
																									 frameBorder: 0,
																									 webkitAllowFullScreen: '',
																									 mozallowfullscreen: '',
																									 allowFullScreen: ''
																									 });
													 
													 this.player_el_.insertBefore(this.el_, this.player_el_.firstChild);
													 
													 var params = {
													 enablejsapi: 1,
													 iv_load_policy: 3,
													 playerapiid: this.id(),
													 disablekb: 1,
													 wmode: 'transparent',
													 controls: (this.player_.options().ytcontrols)?1:0,
													 showinfo: 0,
													 modestbranding: 1,
													 rel: 0,
													 autoplay: (this.player_.options().autoplay)?1:0,
													 loop: (this.player_.options().loop)?1:0
													 };
													 
													 // Check if we have a playlist
													 /*var regExp = /[?&]list=([^#\&\?]+)/;
													  try{
													  var match = player.options().src.match(regExp);
													  }catch(err){}
													  
													  if (match != null && match.length > 1) {
													  params.list = match[1];
													  }*/
													 
													 // If we are not on a server, don't specify the origin (it will crash)
													 if (window.location.protocol != 'file:') {
													 params.origin = window.location.origin;
													 }
													 
													 this.el_.src = 'https://www.youtube.com/embed/' + this.videoId + '?' + videojs.Youtube.makeQueryString(params);
													 
													 if (this.player_.options().ytcontrols){
													 // Hide the big play button when using YouTube controls
													 // Doesn't exist right away because the DOM hasn't created it
													 var self = this;
													 setTimeout(function(){ self.player_.bigPlayButton.hide(); }, 50);
													 }
													 
													 if (videojs.Youtube.apiReady){
													 this.loadYoutube();
													 } else {
													 // Add to the queue because the YouTube API is not ready
													 videojs.Youtube.loadingQueue.push(this);
													 
													 // Load the YouTube API if it is the first YouTube video
													 if(!videojs.Youtube.apiLoading){
													 var tag = document.createElement('script');
													 tag.src = 'https://www.youtube.com/iframe_api';
													 var firstScriptTag = document.getElementsByTagName('script')[0];
													 firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
													 videojs.Youtube.apiLoading = true;
													 }
													 }
													 
													 
													 }
													 });

videojs.Youtube.prototype.dispose = function(){
	
	this.ytplayer.destroy();
	videojs.MediaTechController.prototype.dispose.call(this);
};


videojs.Youtube.prototype.src = function(src){
	
	var id = videojs.Youtube.getIdByUrl(src);
	this.ytplayer.loadVideoById(id);
};


videojs.Youtube.prototype.play = function(){
	
	if ((vjs.IS_IOS || vjs.IS_ANDROID)){
		return;
	}
	
	if (this.isReady_){
		this.ytplayer.playVideo();
	} else {
		// We will play it when the API will be ready
		this.playOnReady = true;
		
		if (!this.player_.options.ytcontrols) {
			// Keep the big play button until it plays for real
			this.player_.bigPlayButton.show();
		}
	}
};

videojs.Youtube.prototype.pause = function(){
	
	this.ytplayer.pauseVideo();
};
videojs.Youtube.prototype.paused = function(){
	return this.lastState !== YT.PlayerState.PLAYING &&
	this.lastState !== YT.PlayerState.BUFFERING;
};

videojs.Youtube.prototype.currentTime = function(){ return this.ytplayer.getCurrentTime(); };

videojs.Youtube.prototype.setCurrentTime = function(seconds){
	this.ytplayer.seekTo(seconds, true);
	this.player_.trigger('timeupdate');
};

videojs.Youtube.prototype.duration = function(){ return this.ytplayer.getDuration(); };
videojs.Youtube.prototype.buffered = function(){
	var loadedBytes = this.ytplayer.getVideoBytesLoaded();
	var totalBytes = this.ytplayer.getVideoBytesTotal();
	if (!loadedBytes || !totalBytes) return 0;
	
	var duration = this.ytplayer.getDuration();
	var secondsBuffered = (loadedBytes / totalBytes) * duration;
	var secondsOffset = (this.ytplayer.getVideoStartBytes() / totalBytes) * duration;
	return videojs.createTimeRange(secondsOffset, secondsOffset + secondsBuffered);
};

videojs.Youtube.prototype.volume = function() {
	if (isNaN(this.volumeVal)) {
		this.volumeVal = this.ytplayer.getVolume() / 100.0;
	}
	
	return this.volumeVal;
};

videojs.Youtube.prototype.setVolume = function(percentAsDecimal){
	if (percentAsDecimal && percentAsDecimal != this.volumeVal) {
		this.ytplayer.setVolume(percentAsDecimal * 100.0);
		this.volumeVal = percentAsDecimal;
		this.player_.trigger('volumechange');
	}
};

videojs.Youtube.prototype.muted = function() { return this.ytplayer.isMuted(); };
videojs.Youtube.prototype.setMuted = function(muted) {
	if (muted) {
		this.ytplayer.mute();
	} else {
		this.ytplayer.unMute();
	}
	
	var self = this;
	setTimeout(function() { self.player_.trigger('volumechange'); }, 50);
};

videojs.Youtube.prototype.onReady = function(){
	
	
	this.isReady_ = true;
	
	this.ytplayer.addEventListener('onStateChange', function(e) {
								   e.target.vjsTech.onStateChange(e.data);
								   });
	
	this.player_.trigger('techready');
	
	// Hide the poster when ready because YouTube has it's own
	this.player_.posterImage.hide();
	this.triggerReady();
	this.player_.trigger('durationchange');
	
	// Play right away if we clicked before ready
	if (this.playOnReady){
		this.player_.bigPlayButton.hide();
		this.ytplayer.playVideo();
	}
	
	this.stashedControls = this.player_.controls();
    
	
	if (this.player_.options().ytcontrols){
		// Hide the VideoJS controls
		//var p_options = this.player_.options();
		//p_options.controls = false;
		//this.player_.options(p_options);
		this.player_.controls(false);
		//this.player_.options({controls: false});
	} else{
		
		this.player_.controls(true);
	}
};

videojs.Youtube.prototype.onStateChange = function(state){
	
	if (state != this.lastState){
		switch(state){
			case -1:
				this.player_.trigger('durationchange');
				break;
				
			case YT.PlayerState.ENDED:
				this.player_.trigger('ended');
				
				if (!this.player_.options().ytcontrols){
					this.player_.bigPlayButton.show();
				}
				break;
				
			case YT.PlayerState.PLAYING:
				this.player_.trigger('timeupdate');
				this.player_.trigger('durationchange');
				this.player_.trigger('playing');
				this.player_.trigger('play');
				
				break;
				
			case YT.PlayerState.PAUSED:
				this.player_.trigger('pause');
				break;
				
			case YT.PlayerState.BUFFERING:
				this.player_.trigger('timeupdate');
				this.player_.trigger('waiting');
				
				// Hide the waiting spinner since YouTube has its own
				this.player_.loadingSpinner.hide();
				break;
				
			case YT.PlayerState.CUED:
				break;
		}
		
		this.lastState = state;
	}
};

videojs.Youtube.prototype.onPlaybackQualityChange = function(quality){
	switch(quality){
		case 'medium':
			this.player_.videoWidth = 480;
			this.player_.videoHeight = 360;
			break;
			
		case 'large':
			this.player_.videoWidth = 640;
			this.player_.videoHeight = 480;
			break;
			
		case 'hd720':
			this.player_.videoWidth = 960;
			this.player_.videoHeight = 720;
			break;
			
		case 'hd1080':
			this.player_.videoWidth = 1440;
			this.player_.videoHeight = 1080;
			break;
			
		case 'highres':
			this.player_.videoWidth = 1920;
			this.player_.videoHeight = 1080;
			break;
			
		case 'small':
			this.player_.videoWidth = 320;
			this.player_.videoHeight = 240;
			break;
			
		default:
			this.player_.videoWidth = 0;
			this.player_.videoHeight = 0;
			break;
	}
	
	this.player_.trigger('ratechange');
};

videojs.Youtube.prototype.onError = function(error){
	this.player_.error = error;
	this.player_.trigger('error');
};

videojs.Youtube.isSupported = function(){
	return true;
};

videojs.Youtube.canPlaySource = function(srcObj){
	return (srcObj.type == 'video/youtube');
};

// All videos created before YouTube API is loaded
videojs.Youtube.loadingQueue = [];

// Create the YouTube player
videojs.Youtube.prototype.loadYoutube = function(){
	this.ytplayer = new YT.Player(this.id_, {
								  events: {
								  onReady: function(e) { e.target.vjsTech.onReady(); },
								  /*onStateChange: function(e) {
								   
								   e.target.vjsTech.onStateChange(e.data); 
								   },*/
								  onPlaybackQualityChange: function(e){ e.target.vjsTech.onPlaybackQualityChange(e.data); },
								  onError: function(e){ e.target.vjsTech.onError(e.data); }
								  }
								  });
	
	this.ytplayer.vjsTech = this;
};

videojs.Youtube.makeQueryString = function(args){
	var array = [];
	for (var key in args){
		if (args.hasOwnProperty(key)){
			array.push(encodeURIComponent(key) + '=' + encodeURIComponent(args[key]));
		}
	}
	
	return array.join('&');
};


videojs.Youtube.getIdByUrl = function (url){
	
	var match, id,
	regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/; // Regex that parse the video ID for any YouTube URL
	
	try{
		match = url.match(regExp);
	}catch(err){}
	
	if (match && match[2].length == 11){
		id = match[2];
	}
	return id;
};

// Called when YouTube API is ready to be used
window.onYouTubeIframeAPIReady = function(){
	
	var yt;
	while ((yt = videojs.Youtube.loadingQueue.shift())){
		yt.loadYoutube();
	}
	videojs.Youtube.loadingQueue = [];
	videojs.Youtube.apiReady = true;
};