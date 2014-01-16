
/**
 Bamse Engine API:

 Bamse = {
 
    function Scene(containerId) = {
        this.addEventListener = this.on
        this.removeEventListener = this.off
        
        this.load = function(data)
        this.addObject = function(newObj)
        this.removeObject = function(obj)
        this.update = function()
        this.render = function()
        this.getTemplates = function()
        this.canvas = canvas;
        this.context = context;
        this.container = container;
    }
    Scene.createFromDescription = function(desc) {};
    
    function Character(id) = {
        this.id = uniqueName;
        this.spriteName = null;
        this.spriteIndex = 0;
        this.alpha = 1;
        this.visible = true;
        this.image = null; // Last rendered image
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.scale = 1;
        this.rotation = 0; // not currently in use
        this.responseId = null;
        this.responseType = null;
        
        this.addAction = function(action, name)
        this.removeAction = function(action/name)
        this.clearActions = function()
        this.runActions = function()
        this.resetTransform = function()
    }
    Character.createFromDescription = function({id:,template:,x:,y:,...}, templates)
    
    function Action(stepFunc, time, completion) = {
        this.reset = function()
        this.run = function(character)
    }
    Action.FPS = 60;
    Action.toFrames = function(time)
    Action.createFromDescription = function({name:args:})
 
    Action.Sequence = function({time:actions:} OR actions, completion)
    Action.Group = function({time:actions:} OR actions, completion)
    Action.Wait = function(time OR {time:1}, completion)
    Action.Move = function()
    Action.Accelerate = function({x:0,y:0,maxDx:Inf,maxDy:Inf}, time, completion)
    Action.Bounce = function({minX/left:0,minY/top:0,maxX/right:DEFAULT_WIDTH,maxY/bottom:DEFAULT_HEIGHT, restitution:1/{x:1,y:1}}, completion)
    Action.Friction = function(friction || {x:0,y:0}, time, completion)
    Action.Rotate = function(rot || {speed:0radians:false}, time, completion)
    Action.Scale = function(speed || {speed:0}, time, completion)
    Action.Animate = function({name:,speed:1,first:0}, time, completion)
    Action.FadeToAlpha = function(dstAlpha, time, completion)
    Action.FadeIn = function(time, completion)
    Action.FadeOut = function(time, completion)
 
 }
*/

var Bamse = Bamse || function() {
    "use strict";
    
    var DEFAULT_WIDTH = 800,
        DEFAULT_HEIGHT = 600,
        ASPECT = DEFAULT_WIDTH / DEFAULT_HEIGHT;

    
    // ********************
    // Helper functions
    // ********************
    
    function noop() {
    }
    
    function pod(obj, prop, def) {
        return obj.hasOwnProperty(prop) ? obj[prop] : def;
    }
    
    function poda(array, prop, def) {
        var obj, i, len = array.length;
        for (i = 0; i < len; i++) {
            obj = array[i];
            if (obj.hasOwnProperty(prop)) {
                return obj[prop];
            }
        }
        return def;
    }
    
    function sign(x) {
        return (x && Number(x)) ? x < 0 ? -1 : 1 : 0;
    }
    
    function degToRad(x) {
        return x * Math.PI / 180;
    }
    
    function isString(x) {
        return (x + "" === x);
    }
    
    function uniqueName() {
        return (Math.random() * 10e16).toFixed(0).toString();
    }
    
    function arrayRemove(array, object) {
        var index = array.indexOf(object);
        if (index >= 0) {
            array.splice(index, 1);
        }
        return array;
    }
    
    
    // ********************
    // Scene constructor
    // ********************
    
    function Scene(containerId) {
        
        var ASPECT = DEFAULT_WIDTH / DEFAULT_HEIGHT,
            container = document.getElementById(containerId),
            children, canvas, context,
            canvasScale = 1,
            sprites = {},
            objects = [],
            objectsById = {},
            templates = {},
            eventListeners = {};
        
        children = container.getElementsByTagName("canvas");
        
        if (children && children.length > 0) {
            canvas = children[0];
        } else {
            canvas = document.createElement("canvas");
            container.appendChild(canvas);
        }
        
        canvas.style.left = "50%";
        canvas.style.top = "50%";
        context = canvas.getContext("2d");
        
        function resizeCanvas() {
            /*
            var w = Math.min(container.offsetWidth, container.offsetHeight * ASPECT),
                h = w / ASPECT;
             */
            var h = container.offsetHeight,
                w = h * ASPECT;
            
            canvas.width = w;
            canvas.height = h;
            canvasScale = w / DEFAULT_WIDTH;
            
            canvas.style.marginLeft = -w * 0.5 + "px";
            canvas.style.marginTop = -h * 0.5 + "px";
        }
        
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas, false);
        
        function handleClick(e) {
            var mx = e.offsetX / canvasScale,
                my = e.offsetY / canvasScale;
            
            // console.log(mx,my);
            
            for (var i in objects) {
                var obj = objects[i];
                if (obj.visible && obj.image) {
                    
                    var w = obj.image.width * obj.scale * 0.5,
                        h = obj.image.height * obj.scale * 0.5,
                        left = obj.x - w,
                        right = obj.x + w,
                        top = obj.y - h,
                        bottom = obj.y + h;
                    
                    if (mx >= left &&
                        mx <= right &&
                        my >= top &&
                        my <= bottom) {
                        console.log("click" + i);
                        triggerEvent("click", obj);
                    }
                }
            }
        }
        canvas.onclick = handleClick;
        

        function addEventListener(name, callback) {
            var listeners = eventListeners[name] || [];
            listeners.push(callback);
            eventListeners[name] = listeners;
        }
        function removeEventListener(name, callback) {
            var listeners, index;
            if (!callback) {
                delete eventListeners[name];
            } else {
                listeners = eventListeners[name];
                if (listeners) {
                    index = listeners.indexOf(callback);
                    if (index >= 0) {
                        eventListeners.splice(index, 1);
                    }
                }
            }
        }
        function triggerEvent(name, args) {
            var listeners = eventListeners[name], i;
            if (listeners) {
                for (i = 0; i < listeners.length; i++) {
                    listeners[i](args);
                }
            }
        }
        this.addEventListener = this.on = addEventListener;
        this.removeEventListener = this.off = removeEventListener;
        
        this.load = function(data) {
            
            function imageWithSrc(src) {
                var img = new Image(),
                    canvas = document.createElement("canvas"),
                    ctx = canvas.getContext("2d");
                img.onload = function() {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                };
                img.src = src;
                
                return canvas;
            }
            
            // Clear old objects and sprites
            objects = [];
            objectsById = {};
            sprites = {};
            templates = {};
            
            var name, desc, sprite, i;
            for (name in data.sprites) {
                
                // Load each sprite as an array of images
                desc = data.sprites[name];
                sprite = [];
                
                if (isString(desc)) {
                    sprite.push(imageWithSrc(desc));
                } else if (Array.isArray(desc)) {
                    for (i in desc) {
                        sprite.push(imageWithSrc(desc[i]));
                    }
                } else if (desc.rows && desc.cols && desc.frames) {
                    // extract subimages
                }
                
                if (sprite) {
                    sprites[name] = sprite;
                }
            }
            
            for (i in data.templates) {
                // Copy the properties (or just assign?)
                templates[i] = data.templates[i];
            }
            
            // Set the title
            if (data.title) {
                // TODO: Create the title element instead?
                var header = document.createElement("h1"),
                    text = document.createTextNode(data.title),
                    titleContainer = document.getElementById("title");
                
                if (titleContainer) {
                    while (titleContainer.hasChildNodes()) {
                        titleContainer.removeChild(titleContainer.lastChild);
                    }
                    header.appendChild(text);
                    titleContainer.appendChild(header);
                }
            }
            // file = obj;
        };
        
        this.addObject = function(newObj) {
            if (newObj) {
                objects.push(newObj);
                
                // Replace old object if one with the same id exists
                var oldObj = objectsById[newObj.id];
                if (oldObj) {
                    arrayRemove(objects, oldObj);
                }
                objectsById[newObj.id] = newObj;
            }
        };
        
        this.removeObject = function(obj) {
            
            if (isString(obj)) {
                obj = objectsById[obj];
            }
            
            if (obj) {
                arrayRemove(objects, obj);
                delete objectsById[obj.id];
            }
        };
        
        this.update = function() {
           
            var i, len = objects.length, obj;
            
            for (i = 0; i < len; i++) {
                obj = objects[i];
                obj.runActions();
            }
        };
        
        this.render = function() {
            
            var i, len = objects.length, obj, sprite,
                x, y, w, h, img;
            
            context.clearRect(0, 0, canvas.width, canvas.height);
            
            for (i = 0; i < len; i++) {
                
                obj = objects[i];
                obj.image = null;
                
                if (obj.visible && obj.alpha > 0) {
                    
                    sprite = sprites[obj.spriteName];
                    
                    if (sprite) {
                        
                        obj.spriteIndex = obj.spriteIndex % sprite.length;
                        
                        img = sprite[obj.spriteIndex];
                        
                        if (img) {
                            x = obj.x * canvasScale;
                            y = obj.y * canvasScale;
                            w = img.width * obj.scale * canvasScale;
                            h = img.height * obj.scale * canvasScale;
                            
                            context.save();
                            context.translate(x, y);
                            context.rotate(obj.rotation);
                            context.globalAlpha = obj.alpha;
                            context.drawImage(img, -w * 0.5, -h * 0.5, w, h);
                            context.restore();
                            
                            obj.image = img;
                        }
                    }
                }
            }
        };
        
        this.getTemplates = function() {
            return templates;
        };
        this.getObjectById = function(id) {
            return objectsById[id];
        };
        
        this.canvas = canvas;
        this.context = context;
        this.container = container;
    }
    Scene.createFromDescription = function(desc) {};
    

    // ********************
    // Character constructor
    // ********************

    function Character(id) {
        
        this.id = id || uniqueName();
        
        this.spriteName = null;
        this.spriteIndex = 0;
        this.alpha = 1;
        this.visible = true;
        this.image = null; // Last rendered image
        
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.scale = 1;
        this.rotation = 0; // not currently in use
        
        this.responseId = null;
        this.responseType = null;
        
        var actions = [],
            actionsByName = {},
            newActions = [],
            removedActions = [];
        
        this.addAction = function(action, name) {
            
            // Check if action with the same name already exists
            if (name) {
                var oldAction = actionsByName[name];
                
                // Replace it if it exists
                if (oldAction) {
                    this.removeAction(oldAction);
                }
                
                actionsByName[name] = action;
            }
            
            newActions.push(action);
        };
        
        /**
         @param action - a running Action or its name string
         */
        this.removeAction = function(action) {
            
            if (isString(action)) {
                var namedAction = actionsByName[action];
                if (namedAction) {
                    removedActions.push(namedAction);
                    delete actionsByName[action];
                }
            } else {
                // Assume action is instance of Action
                removedActions.push(action);
            }
        };
        
        this.clearActions = function() {
            removedActions.length = 0;
            newActions.length = 0;
            actions.length = 0;
            actionsByName = {};
        };
        
        this.runActions = function() {
            
            var i, index, action;
            
            for (i in removedActions) {
                action = removedActions[i];
                index = actions.indexOf(action);
                if (index >= 0) {
                    actions.splice(index, 1);
                }
            }
            removedActions.length = 0;
            
            for (i in newActions) {
                action = newActions[i];
                actions.push(action);
            }
            newActions.length = 0;
            
            for (i in actions) {
                action = actions[i];
                action.run(this);
            }
        };
        
        this.resetTransform = function() {
            this.rotation = 0;
            this.scale = 1;
            this.x = 0;
            this.y = 0;
        };
    }

    Character.createFromDescription = function(data, templates) {
        
        var obj = new Character(data.id),
            template = templates[data.template] || {},
            sprite = data.sprite || template.sprite,
            inputs = [data, template];
        
        if (sprite) {
            // data.sprite can be either just the name OR {name:index:}
            obj.spriteName = sprite.name || sprite;
            obj.spriteIndex = sprite.index || obj.spriteIndex;
        }
        
        obj.x = poda(inputs, "x", Math.random() * DEFAULT_WIDTH);
        obj.y = poda(inputs, "y", Math.random() * DEFAULT_HEIGHT);
        
        var dir = Math.random() * Math.PI * 2;
        obj.dx = poda(inputs, "dx", Math.cos(dir) * poda(inputs, "speed", 5));
        obj.dy = poda(inputs, "dy", Math.sin(dir) * poda(inputs, "speed", 5));
        
        obj.scale = poda(inputs, "scale", obj.scale);
        obj.rotation = poda(inputs, "rotation", obj.rotation);
        obj.alpha = poda(inputs, "alpha", obj.alpha);
        
        if (data.response) {
            obj.responseId = data.response.id;
            obj.responseType = data.response.type;
        }
        obj.visible = true;
        
        function addActions(a) {
            for (var i in a) {
                var action = Action.createFromDescription(a[i]);
                if (action) {
                    obj.addAction(action);
                }
            }
        }
        
        if (template.actions) {
            addActions(template.actions);
        }
        if (data.actions) {
            addActions(data.actions);
        }
        
        return obj;
    };

    
    // ********************
    // Character actions
    // ********************

    function Action(stepFunc, time, completion) {
        
        var completions = [],
            forever = time < 0,
            totalFrames = Action.toFrames(time),
            frames = totalFrames;
        
        if (typeof stepFunc !== "function") {
            stepFunc = noop;
        }
        
        function runCompletions(obj) {
            for (var i in completions) {
                // try/catch?
                completions[i](obj);
            }
        }
        
        this.reset = function() {
            frames = totalFrames;
        };
        
        this.addCompletion = function(callback) {
            if (typeof callback === "function") {
                completions.push(callback);
            }
        };
        
        this.run = function(obj) {
            var done = false;
            if (forever) {
                done = stepFunc(obj);
            } else {
                if (frames > 0) {
                    frames--;
                    done = stepFunc(obj);
                } else {
                    done = true;
                }
            }
            
            if (done) {
                obj.removeAction(this);
                runCompletions(obj);
            }
        };
        
        this.addCompletion(completion);
    }

    Action.FPS = 60;
    Action.toFrames = function(time) {
        var frameCount = isNaN(time) ? Infinity : Math.max(1, time * Action.FPS);
        return isFinite(frameCount) ? (frameCount | 0) : frameCount;
    };

    /**
     @param name - name of the action
     @param args - list of arguments to the constructor/factory method
     */
    Action.createFromDescription = function(desc) {
        var name = desc.name,
            args = desc.args,
            constr = Action[name];
        if (constr) {
            return constr.apply(this, args);
        }
    };

    Action.Sequence = function(data, completion) {
        var actions = [],
            action, index = 0, i,
            time = Number(data.time) || Infinity,
            list = data.actions || data;
        
        for (i = 0; i < list.length; i++) {
            action = list[i];
            if (typeof action.run !== "function") {
                action = Action.createFromDescription(action);
            }
            if (action) {
                action.addCompletion(swap);
                actions.push(action);
            }
        }
        
        function swap(c) {
            index++;
        }
        
        function step(c) {
            if (index >= actions.length) {
                return true;
            }
            actions[index].run(c);
        }
        
        return new Action(step, time, completion);
    };
    
    Action.Group = function(data, completion) {
        
        var actions = [], // All actions in the group
            run = [], // true/false = run/don't run for each action
            doneCount = 0,
            action, i,
            time = Number(data.time) || Infinity,
            list = data.actions || data;
        
        for (i = 0; i < list.length; i++) {
            action = list[i];
            if (typeof action.run !== "function") {
                action = Action.createFromDescription(action);
            }
            if (action) {
                // Add completion that disables the action in question
                action.addCompletion(doneFunc(run.length));
                run.push(true);
                actions.push(action);
            }
        }
        
        function doneFunc(index) {
            return function() {
                run[index] = false;
                doneCount++;
            }
        }
        
        function step(c) {
            if (doneCount >= actions.length) {
                return true;
            }
            for (i in actions) {
                if (run[i]) {
                    actions[i].run(c);
                }
            }
        }
        
        return new Action(step, time, completion);
    };

    Action.Wait = function(data, completion) {
        var time = Number(data) || Number(data.time) || 1;
        return new Action(null, time, completion);
    }
    
    /**
     */
    Action.Move = function(data, completion) {
        var step, dx, dy, time, frames, calcAction, moveAction;
        
        function first(c) {
            dx = (data.to.x - c.x) / frames;
            dy = (data.to.y - c.y) / frames;
        }
        
        if (data && data.to) {
            time = isNaN(data.time) ? 1 : Number(data.time);
            frames = Action.toFrames(time);
            
            step = function(c) {
                c.x += dx;
                c.y += dy;
            }
            
            calcAction = new Action(first, 0);
            moveAction = new Action(step, time);
            
            return Action.Sequence([calcAction, moveAction], completion);
        }
        
        step = function(c) {
            c.x += c.dx;
            c.y += c.dy;
        };
        
        return new Action(step, (data && data.time), completion);
    };


    /**
     data = {
     ddx: horizontal acceleration,
     ddy: vertical acceleration,
     maxDx: maximum horizontal speed,
     maxDy: maximum vertical speed
     }
     actions:{
     Accelerate:[{ddx:4, ddy:5}, 5],
     
     }
     */
    Action.Accelerate = function(data, completion) {
        
        data = data || {};
        
        var ddx = Number(data.x) || 0,
            ddxDir = sign(ddx),
            ddy = Number(data.y) || 0,
            ddyDir = sign(ddy),
            maxDx = Math.abs(Number(data.maxDx)) || Infinity,
            maxDy = Math.abs(Number(data.maxDy)) || Infinity,
            step;
        
        if (ddx == 0 && ddy == 0) {
            step = noop;
        } else {
            step = function(c) {
                
                var dx = c.dx + ddx,
                dy = c.dy + ddy,
                dxDir = sign(dx),
                dyDir = sign(dy);
                
                if (dxDir === ddxDir && dx * dxDir > maxDx) {
                    dx = maxDx * dxDir;
                }
                if (dyDir == ddyDir && dy * dyDir > maxDy) {
                    dy = maxDy * dyDir;
                    // console.log("maxy");
                }
                
                c.dx = dx;
                c.dy = dy;
            };
        }
        return new Action(step, data.time, completion);
    };


    /**
     data = {
     minX OR left: left bound,
     minY OR top: top bound,
     maxX OR right: right bound,
     maxY OR bottom: bottom bound,
     restitution: ratio of preserved velocity after bounce, Number or {x:y:}, defaults to 1
     }
     */
    Action.Bounce = function(data, completion) {
        
        data = data || {};
        
        var minX = Number(data.minX || data.left) || 0,
            minY = Number(data.minY || data.top) || 0,
            maxX = Number(data.maxX || data.right) || DEFAULT_WIDTH,
            maxY = Number(data.maxY || data.bottom) || DEFAULT_HEIGHT,
            restitutionX = 1, restitutionY = 1;
        
        if (data.restitution) {
            if (!isNaN(data.restitution)) {
                restitutionX = restitutionY = Number(data.restitution);
            } else {
                restitutionX = isNaN(data.restitution.x) ? 1 : Number(data.restitution.x);
                restitutionY = isNaN(data.restitution.y) ? 1 : Number(data.restitution.y);
            }
        }
        
        function step(c) {
            
            // Bounce horizontally
            if (c.x < minX) {
                c.x = minX;
                c.dx = -c.dx * restitutionX;
            } else if (c.x > maxX) {
                c.x = maxX;
                c.dx = -c.dx * restitutionX;
            }
            
            // Bounce vertically
            if (c.y < minY) {
                c.y = minY;
                c.dy = -c.dy * restitutionY;
            } else if (c.y > maxY) {
                c.y = maxY;
                c.dy = -c.dy * restitutionY;
            }
        };
        
        return new Action(step, data.time, completion);
    };


    /**
     data = {
     x: horizontal friction,
     y: vertical friction
     }
     */
    Action.Friction = function(data, completion) {
        
        var frictionX = Math.abs(Number(data && data.x)) || 0,
            frictionY = Math.abs(Number(data && data.y)) || 0,
            step;
        
        if (frictionX == 0 && frictionY == 0) {
            step = noop;
        } else {
            step = function(c) {
                
                if (Math.abs(c.dx) < frictionX) {
                    c.dx = 0;
                } else {
                    c.dx = (c.dx < 0) ? c.dx + frictionX : c.dx - frictionX;
                }
                
                if (Math.abs(c.dy) < frictionY) {
                    c.dy = 0;
                } else {
                    c.dy = (c.dy < 0) ? c.dy + frictionY : c.dy - frictionY;
                }
            };
        }
        return new Action(step, data.time, completion);
    };


    /**
     data = {
     speed: rotation speed  (degrees or radians per second)
     OR
     rotation: total rotation
     
     radians: true => rotation is in radians, false => rotation is in degrees
     }
     OR
     data = total rotation (in degrees)
     */
    Action.Rotate = function(data, completion) {
        
        var totalRotation, rotationSpeed,
            time = data.time, // isNaN(data.time) ? 1 : Number(data.time),
            frames = (time > 0) ? Action.toFrames(time) : Action.FPS;
        
        if (Number(data)) {
            totalRotation = Number(data);
        } else if (data.rotation) {
            totalRotation = Number(data.rotation);
        } else if (data.speed) {
            totalRotation = Number(data.speed) * ((time > 0) ? time : 1);
        }
        
        if (!data.radians) {
            totalRotation = degToRad(totalRotation);
        }
        
        rotationSpeed = totalRotation / frames;
        
        function step(c) {
            c.rotation += rotationSpeed;
        }
        
        return new Action(step, time, completion);
    };

    /**
     TODO: Should be goal scale instead
     data = {
     speed: scaling speed
     rel:?
     dst:?
     }
     OR
     data = relative scale
     */
    Action.Scale = function(data, completion) {
        
        var dstScale = Number((data && data.speed) || data) || 0, // TODO: don't use data.speed like this!
            time = isNaN(data.time) ? 1 : Number(data.time),
            scalingSpeed,
            calcAction, scaleAction;
        
        function first(c) {
            scalingSpeed = (dstScale - c.scale) / Action.toFrames(time);
            // console.log("first", scalingSpeed);
        }
        function step(c) {
            c.scale += scalingSpeed;
            // console.log("step");
        }
        
        calcAction = new Action(first, 0);
        scaleAction = new Action(step, time);
        
        return Action.Sequence([calcAction, scaleAction], completion);
    };

    Action.Animate = function(data, completion) {
        /*
         var sprite,
         imageIndex = Number(data.first) || 0,
         imageSpeed;
         
         if (isString(data)) {
         sprite = Sprites[data];
         } else if (Array.isArray(data)) {
         sprite = data;
         } else {
         // What else can it be?? :)
         }
         
         if (!sprite) {
         return new Action(null, 0);
         }
         
         imageSpeed = sprite.length / Action.toFrames(time);
         
         function step(c) {
         imageIndex += imageSpeed;
         c.image = sprite[imageIndex % sprite.length];
         }
         */
        
        var name = data.name,
            imageIndex = Number(data.first) || 0,
            imageSpeed = 1 / Action.toFrames(Number(data.speed) || 1);
        
        if (!name) {
            return new Action(null, 0);
        }
        
        function step(c) {
            imageIndex += imageSpeed;
            c.spriteName = name;
            c.spriteIndex = imageIndex | 0;
        }
        
        return new Action(step, data.time, completion);
    };

    Action.FadeToAlpha = function(data, completion) {
        
        var dstAlpha = Number(data.alpha || data) || 0,
            time = isNaN(data.time) ? 1 : Number(data.time),
            fadeSpeed,
            calcAction, fadeAction;
        
        function first(c) {
            fadeSpeed = (dstAlpha - c.alpha) / Action.toFrames(time);
        }
        function step(c) {
            c.alpha += fadeSpeed;
        }
        
        calcAction = new Action(first, 0);
        fadeAction = new Action(step, time);
        
        return Action.Sequence([calcAction, fadeAction], completion);
    };

    Action.FadeIn = function(time, completion) {
        return Action.FadeToAlpha({alpha:1, time:time}, completion);
    };
    Action.FadeOut = function(time, completion) {
        return Action.FadeToAlpha({alpha:0, time:time}, completion);
    };
    
    return {
        Scene : Scene,
        Character : Character,
        Action : Action
    };
}();


/*

 minified:
 
var Bamse=Bamse||function(){function l(a,c,f){var d,b,e=a.length;for(b=0;b<e;b++)if(d=a[b],d.hasOwnProperty(c))return d[c];return f}function s(a){return a&&Number(a)?0>a?-1:1:0}function v(a,c){var f=a.indexOf(c);0<=f&&a.splice(f,1);return a}function z(a){function c(){var a=d.offsetHeight,e=a*f;b.width=e;b.height=a;g=e/p;b.style.marginLeft=0.5*-e+"px";b.style.marginTop=0.5*-a+"px"}var f=p/t,d=document.getElementById(a),b,e,g=1,m={},n=[],r={},l={},q={};(a=d.getElementsByTagName("canvas"))&&0<a.length?
b=a[0]:(b=document.createElement("canvas"),d.appendChild(b));b.style.left="50%";b.style.top="50%";e=b.getContext("2d");c();window.addEventListener("resize",c,!1);b.onclick=function(a){var e=a.offsetX/g;a=a.offsetY/g;console.log(e,a);for(var d in n){var b=n[d];if(b.visible&&b.image){var c=b.image.width*b.scale*0.5,f=b.image.height*b.scale*0.5,m=b.x+c,k=b.y-f,f=b.y+f;if(e>=b.x-c&&e<=m&&a>=k&&a<=f&&(console.log("click"+d),c=q.click,m=void 0,c))for(m=0;m<c.length;m++)c[m](b)}}};this.addEventListener=
this.on=function(a,e){var b=q[a]||[];b.push(e);q[a]=b};this.removeEventListener=this.off=function(a,e){var b;if(e){if(b=q[a])b=b.indexOf(e),0<=b&&q.splice(b,1)}else delete q[a]};this.load=function(a){function e(a){var b=new Image;b.src=a;return b}n=[];r={};m={};l={};var b,g,d,c;for(b in a.sprites){g=a.sprites[b];d=[];if(g+""===g)d.push(e(g));else if(Array.isArray(g))for(c in g)d.push(e(g[c]));d&&(m[b]=d)}for(c in a.templates)l[c]=a.templates[c];a.title&&(b=document.createElement("h1"),a=document.createTextNode(a.title),
b.appendChild(a),document.getElementById("title").appendChild(b))};this.addObject=function(a){if(a){n.push(a);var e=r[a.id];e&&v(n,e);r[a.id]=a}};this.removeObject=function(a){a+""===a&&(a=r[a]);a&&(v(n,a),delete r[a.id])};this.update=function(){var a,e=n.length,b;for(a=0;a<e;a++)b=n[a],b.runActions()};this.render=function(){var a,d=n.length,c;e.clearRect(0,0,b.width,b.height);for(a=0;a<d;a++)if(c=n[a],c.image=null,c.visible&&0<c.alpha&&(sprite=m[c.spriteName]))if(c.spriteIndex%=sprite.length,img=
sprite[c.spriteIndex])x=c.x*g,y=c.y*g,w=img.width*c.scale*g,h=img.height*c.scale*g,e.save(),e.translate(x,y),e.rotate(c.rotation),e.globalAlpha=c.alpha,e.drawImage(img,0.5*-w,0.5*-h,w,h),e.restore(),c.image=img};this.getTemplates=function(){return l};this.canvas=b;this.context=e;this.container=d}function u(a){this.id=a||(1E17*Math.random()).toFixed(0).toString();this.spriteName=null;this.spriteIndex=0;this.alpha=1;this.visible=!0;this.image=null;this.dy=this.dx=this.y=this.x=0;this.scale=1;this.rotation=
0;this.responseType=this.responseId=null;var c=[],f={},d=[],b=[];this.addAction=function(a,b){if(b){var c=f[b];c&&this.removeAction(c);f[b]=a}d.push(a)};this.removeAction=function(a){if(a+""===a){var c=f[a];c&&(b.push(c),delete f[a])}else b.push(a)};this.clearActions=function(){b.length=0;d.length=0;c.length=0;f={}};this.runActions=function(){var a,g;for(a in b)g=b[a],g=c.indexOf(g),0<=g&&c.splice(g,1);b.length=0;for(a in d)g=d[a],c.push(g);d.length=0;for(a in c)g=c[a],g.run(this)};this.resetTransform=
function(){this.rotation=0;this.scale=1;this.y=this.x=0}}function f(a,c,k){var d=0>c,b=f.toFrames(c),e=b;"function"!==typeof k&&(k=function(){});"function"!==typeof a&&(a=function(){});this.reset=function(){e=b};this.run=function(b){d?a(b):0<e?(a(b),e--):(k(b),b.removeAction(this))}}var p=800,t=600;z.createFromDescription=function(a){};u.createFromDescription=function(a,c){function k(a){for(var b in a){var c=f.createFromDescription(a[b]);c&&d.addAction(c)}}var d=new u(a.id),b=c[a.template]||{},e=
a.sprite||b.sprite,g=[a,b];e&&(d.spriteName=e.name||e,d.spriteIndex=e.index||d.spriteIndex);d.x=l(g,"x",Math.random()*p);d.y=l(g,"y",Math.random()*t);e=Math.random()*Math.PI*2;d.dx=l(g,"dx",Math.cos(e)*l(g,"speed",5));d.dy=l(g,"dy",Math.sin(e)*l(g,"speed",5));d.scale=l(g,"scale",d.scale);d.rotation=l(g,"rotation",d.rotation);d.alpha=l(g,"alpha",d.alpha);d.responseId=a.responseId;d.responseType=a.responseType;d.visible=!0;b.actions&&k(b.actions);a.actions&&k(a.actions);return d};f.FPS=60;f.toFrames=
function(a){return isNaN(a)?Infinity:Math.max(1,a*f.FPS)|0};f.createFromDescription=function(a){var c=a.args;if(a=f[a.name])return a.apply(this,c)};f.Move=function(){return new f(function(a){a.x+=a.dx;a.y+=a.dy})};f.Accelerate=function(a,c,k){a=a||{};var d=Number(a.x)||0,b=s(d),e=Number(a.y)||0,g=s(e),m=Math.abs(Number(a.maxDx))||Infinity,l=Math.abs(Number(a.maxDy))||Infinity;return new f(0==d&&0==e?function(){}:function(a){var c=a.dx+d,f=a.dy+e,k=s(c),p=s(f);k===b&&c*k>m&&(c=m*k);p==g&&f*p>l&&(f=
l*p,console.log("maxy"));a.dx=c;a.dy=f},c,k)};f.Bounce=function(a){a=a||{};var c=Number(a.minX||a.left)||0,k=Number(a.minY||a.top)||0,d=Number(a.maxX||a.right)||p,b=Number(a.maxY||a.bottom)||t,e=1,g=1;a.restitution&&(isNaN(a.restitution)?(e=isNaN(a.restitution.x)?1:Number(a.restitution.x),g=isNaN(a.restitution.y)?1:Number(a.restitution.y)):e=g=Number(a.restitution));return new f(function(a){a.x<c?(a.x=c,a.dx=-a.dx*e):a.x>d&&(a.x=d,a.dx=-a.dx*e);a.y<k?(a.y=k,a.dy=-a.dy*g):a.y>b&&(a.y=b,a.dy=-a.dy*
g)},-1)};f.Friction=function(a,c,k){var d=Math.abs(Number(a&&a.x))||0,b=Math.abs(Number(a&&a.y))||0;return new f(0==d&&0==b?function(){}:function(a){Math.abs(a.dx)<d?a.dx=0:a.dx=0>a.dx?a.dx+d:a.dx-d;Math.abs(a.dy)<b?a.dy=0:a.dy=0>a.dy?a.dy+b:a.dy-b},c,k)};f.Rotate=function(a,c,k){var d,b,e=0<c?f.toFrames(c):f.FPS;Number(a)?d=Number(a):a.speed&&(d=Number(a.speed)*(0<c?c:1));a.radians||(d=d*Math.PI/180);b=d/e;return new f(function(a){a.rotation+=b},c,k)};f.Scale=function(a,c,k){function d(a){a.scale+=
e}var b=Number(a&&a.speed||a)||0,e;return new f(function(a){e=(b-a.scale)/f.toFrames(c)},0,function(a){a.addAction(new f(d,c,k))})};f.Animate=function(a,c,k){var d=a.name,b=Number(a.first)||0,e=1/f.toFrames(Number(a.speed)||1);return d?new f(function(a){b+=e;a.spriteName=d;a.spriteIndex=b|0},c,k):new f(null,0)};f.FadeToAlpha=function(a,c,k){function d(a){a.alpha+=e}var b=Number(a)||0,e;return new f(function(a){e=(b-a.alpha)/f.toFrames(c)},0,function(a){a.addAction(new f(d,c,k))})};f.FadeIn=function(a,
c){return f.FadeToAlpha(1,a,c)};f.FadeOut=function(a,c){return f.FadeToAlpha(0,a,c)};return{Scene:z,Character:u,Action:f}}();
 
 */
