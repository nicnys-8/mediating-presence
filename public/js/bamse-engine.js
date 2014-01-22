
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
    Action.SetProperty = function({key:value, ...}, completion)
    Action.Move = function({to:{x:y:},time:} OR nothing)
    Action.Accelerate = function({x:0,y:0,maxDx:Inf,maxDy:Inf}, time, completion)
    Action.Bounce = function({minX/left:0,minY/top:0,maxX/right:DEFAULT_WIDTH,maxY/bottom:DEFAULT_HEIGHT, restitution:1/{x:1,y:1}}, completion)
    Action.Friction = function(friction || {x:0,y:0}, time, completion)
    Action.Rotate = function(rot || {speed:0radians:false}, time, completion)
    Action.Scale = function(speed || {speed:0}, time, completion)
    Action.Animate = function({name:,speed:1,first:0}, time, completion)
    Action.FadeToAlpha = function(dstAlpha, time, completion)
    Action.FadeIn = function(time, completion)
    Action.FadeOut = function(time, completion)
 
    Action.CreateObject = function({obj:{description}, parent:"root/parent/node"}, completion)
    Action.RemoveAction = function({actions:[]}, completion)
    Action.ClearActions = function(data, completion)
    Action.ChildAction = function({child:action:}, completion)
    Action.Repeat = function({times:action:}, completion)
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
    
    function capitalise(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    function Proxy(target, handler) {
        var prop, i, caps, parent, func;
        
        handler = handler || {};
        parent = handler.parent || {};
        parent.parent = target.parent || null;
        
        for (i in target) {
            
            if (i === "parent") {
                continue;
            }
            
            prop = target[i];
            if (typeof prop === "function") {
                func = wrapFunction(prop);
            } else {
                /*caps = capitalise(i);
                handler["get" + caps] = getter(i);
                handler["set" + caps] = setter(i);*/
                func = wrapProperty(i);
            }
            
            if (parent[i]) {
                console.warn("Namespace collision, skipping property " + i + "...");
            } else {
                parent[i] = (typeof prop === "function") ? prop : func;
            }
            if (!handler[i]) {
                handler[i] = func;
            }
        }
        
        function wrapFunction(func) {
            return function() {
                return func.apply(/*handler, arguments); /*/ target, arguments);
            };
        }
        function wrapProperty(name) {
            return function(val) {
                if (arguments.length > 0) {
                    target[name] = val;
                }
                return target[name];
            };
        }
        /*
        function getter(name) {
            return function() {
                return target[name];
            };
        }
        function setter(name) {
            return function(val) {
                target[name] = val;
            };
        }
         */
        handler.parent = parent;
        return handler;
    }
    
    function SafeList() {
        
        var objects = [],
            objectsById = {},
            removedObjects = [],
            newObjects = [];
        
        this.add = function(newObj) {
            if (newObj) {
                
                newObjects.push(newObj);
                
                // Replace old object if one with the same id exists
                var oldObj = objectsById[newObj.id];
                if (oldObj) {
                    removedObjects.push(oldObj);
                    // arrayRemove(objects, oldObj);
                }
                if (newObj.id) {
                    objectsById[newObj.id] = newObj;
                }
            }
        };
        
        this.remove = function(obj) {
            
            if (isString(obj)) {
                obj = objectsById[obj];
            }
            
            if (obj) {
                removedObjects.push(obj);
                // delete objectsById[obj.id];
                return true;
            }
            return false;
        };
        
        this.empty = function() {
            for (var i in objects) {
                removedObjects.push(objects[i]);
            }
            objectsById = {};
        };
        
        this.count = function() {
            return objects.length; // + newObjects.length - removedObjects.length; // eller?
        };
        
        this.flush = function() {
            
            var i, obj;
            
            for (i in removedObjects) {
                obj = removedObjects[i];
                arrayRemove(objects, obj);
                
                if (objectsById[obj.id] === obj) {
                    delete objectsById[obj.id];
                }
            }
            removedObjects.length = 0;
            
            for (i in newObjects) {
                obj = newObjects[i];
                objects.push(obj);
                
                if (obj.id) {
                    objectsById[obj.id] = obj;
                }
            }
            newObjects.length = 0;
        };
        
        this.forEach = function(func) {
            for (var i = 0; i < objects.length; i++) {
                func(objects[i], i);
            }
        };
        
        this.objectWithId = function(name) {
            return objectsById[name];
        };
        this.objectAtIndex = function(index) {
            return objects[index];
        };
    }
    
    
    function Node(id) {
        
        var children = new SafeList(),
            actions = new SafeList(),
            me = this;
        
        this.scene = null;
        this.parent = null;
        this.children = children;
        this.actions = actions;
        
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
        this.responseUrl = null;
        
        // TODO: Change to Controller objects or onEvent functions instead
        this.control = {
            clickable : false,
            draggable : false,
            isDragged : false,
            dragOffset : {x:0, y:0}
        };
        
        this.addObject = function(obj, name) {
            if (obj) {
                obj.id = name || obj.id;
                children.add(obj);
                obj.parent = this;
                obj.scene = this.scene;
            }
        };
        
        this.removeObject = function(obj) {
            if (children.remove(obj)) {
                obj.parent = null;
                obj.scene = null;
            }
        };
        
        this.addAction = function(action, name) {
            if (action) {
                action.id = name || action.id;
                actions.add(action);
            }
        };
        
        this.removeAction = function(action) {
            actions.remove(action);
        };
        
        this.update = function() {
            
            actions.flush();
            children.flush();
            
            actions.forEach(runAction);
            children.forEach(updateChild);
        };
        
        function runAction(action) {
            action.run(me);
        }
        function updateChild(child) {
            child.update();
        }
        
        this.render = function(context, sprites) {
            
            var sprite, w, h, img;

            function renderChild(child) {
                child.render(context, sprites);
            }
            
            sprite = sprites[this.spriteName];
            
            if (sprite) {
                this.spriteIndex = this.spriteIndex % sprite.length;
                img = sprite[this.spriteIndex];
            } else {
                img = null;
            }
                
            context.save();
            context.translate(this.x, this.y);
            context.rotate(this.rotation);
            context.scale(this.scale, this.scale);
            context.globalAlpha *= this.alpha;
            
            if (img) {
                w = isNaN(this.width) ? img.width : this.width; // * this.scale;
                h = isNaN(this.height) ? img.height: this.height; // * this.scale;
                context.drawImage(img, -w * 0.5, -h * 0.5, w, h);
                this.image = img;
            }
            if (children.count()) {
                children.forEach(renderChild);
            }
            context.restore();
        };
        
        this.resetTransform = function() {
            this.rotation = 0;
            this.scale = 1;
            this.x = 0;
            this.y = 0;
            this.alpha = 1;
        };
    }
    
    Node.prototype.find = function(name) {
        
        var scene = this.scene,
            child,
            root;
        
        if (scene) {
            root = scene.getRootNode();
        } else {
            root = this;
            while (root.parent) {
                root = root.parent;
            }
        }
        
        if (Array.isArray(name)) {
            child = this;
            for (i = 0; i < name.length; i++) {
                switch (parent[i]) {
                    case "/":
                        child = root;
                        break;
                    case "..":
                        child = child.parent;
                        break;
                    default:
                        child = child.children.getObjectById(name);
                        break;
                }
                if (!child) {
                    break;
                }
            }
        } else if (isString(name)) {
            child = this.children.getObjectById(name);
        }
        
        return child || this;
    };
    
    /**
     */
    Node.prototype.containsPoint = function(px, py) {
        
        // TODO: Transform point to root node coordinates!?
        var w = (isNaN(this.width) ? this.image.width : this.width) * this.scale * 0.5,
            h = (isNaN(this.height) ? this.image.height : this.height) * this.scale * 0.5,
            left = this.x - w,
            right = this.x + w,
            top = this.y - h,
            bottom = this.y + h;
        
        return (px >= left && px <= right && py >= top && py <= bottom);
    };
    
    Node.createFromDescription = function(data, templates) {
        
        var obj = new Node(data.id),
            template = (templates && templates[data.template]) || {},
            sprite = data.sprite || template.sprite,
            inputs = [data, template];
        
        if (sprite) {
            // data.sprite can be either just the name OR {name:index:}
            obj.spriteName = sprite.name || sprite;
            obj.spriteIndex = sprite.index || obj.spriteIndex;
        }
        
        obj.x = poda(inputs, "x", Math.random() * DEFAULT_WIDTH);
        obj.y = poda(inputs, "y", Math.random() * DEFAULT_HEIGHT);
        
        var dir = poda(inputs, "dir", Math.random() * Math.PI * 2);
        obj.dx = poda(inputs, "dx", Math.cos(dir) * poda(inputs, "speed", 5));
        obj.dy = poda(inputs, "dy", Math.sin(dir) * poda(inputs, "speed", 5));
        
        obj.scale = poda(inputs, "scale", obj.scale);
        obj.rotation = poda(inputs, "rotation", obj.rotation);
        obj.alpha = poda(inputs, "alpha", obj.alpha);
        
        obj.width = poda(inputs, "width");
        obj.height = poda(inputs, "height");
        
        obj.control.clickable = poda(inputs, "clickable");
        obj.control.draggable = poda(inputs, "draggable");
        
        if (data.response) {
            obj.responseId = data.response.id;
            obj.responseType = data.response.type;
            obj.responseUrl = data.response.url;
            
            obj.control.clickable = obj.responseType === "click";
        }
        
        obj.visible = true;
        
        function addActions(a) {
            for (var i in a) {
                var action = Action.createFromDescription(a[i], templates);
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
    // Scene constructor
    // ********************
    
    function Scene(containerId) {
        
        var width = DEFAULT_WIDTH,
            height = DEFAULT_HEIGHT,
            aspect = width / height,
            container = document.getElementById(containerId),
            domChildren, canvas, context,
            canvasScale = 1,
            sprites = {},
            templates = {},
            eventListeners = {},
            rootNode = new Node("root");
        
        rootNode.scene = this;
        domChildren = container.getElementsByTagName("canvas");
        
        if (domChildren && domChildren.length > 0) {
            canvas = domChildren[0];
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
                w = h * aspect;
            
            canvas.width = w;
            canvas.height = h;
            canvasScale = w / width;
            
            canvas.style.marginLeft = -w * 0.5 + "px";
            canvas.style.marginTop = -h * 0.5 + "px";
        }
        
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas, false);
        
        this.control = {
            clickable : false,
            draggable : false,
            isDragged : false,
            dragOffset : {x:0, y:0}
        };
        
        function handleClick(e) {
            var mx = e.offsetX / canvasScale,
                my = e.offsetY / canvasScale;
            
            rootNode.children.forEach(function(node, i) {
                                      if (node.control.clickable && node.containsPoint(mx, my)) {
                                            // console.log("click" + i);
                                            triggerEvent("click", node);
                                      }});
        }
        canvas.onclick = handleClick;
        
        function handleMouseDown(e) {
            var mx = e.offsetX / canvasScale,
                my = e.offsetY / canvasScale;
            
            rootNode.children.forEach(function(node, i) {
                                        if (node.control.draggable && node.containsPoint(mx, my)) {
                                            // console.log("down" + i);
                                            triggerEvent("mousedown", node);
                                            node.control.isDragged = true;
                                            node.control.dragOffset.x = node.x - mx;
                                            node.control.dragOffset.y = node.y - my;
                                        }
                                      });
        }
        function handleMouseMove(e) {
            var mx = e.offsetX / canvasScale,
                my = e.offsetY / canvasScale;
            
            rootNode.children.forEach(function(node, i) {
                                        if (node.control.isDragged) {
                                            // console.log("move" + i);
                                            triggerEvent("mousemove", node);

                                            node.x = mx + node.control.dragOffset.x;
                                            node.y = my + node.control.dragOffset.y;
                                        }
                                      });
        }
        function handleMouseUp(e) {
            rootNode.children.forEach(function(node, i) {
                                        node.control.isDragged = false;
                                        // console.log("up" + i);
                                        triggerEvent("mouseup", node);
                                      });
        }
        canvas.onmousedown = handleMouseDown;
        canvas.onmousemove = handleMouseMove;
        canvas.onmouseup = handleMouseUp;
        
        
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
            
            // Resize the canvas?
            width = Number(data.canvas && data.canvas.width) || width;
            height = Number(data.canvas && data.canvas.height) || height;
            aspect = width / height;
            resizeCanvas();
            
            // Clear old objects and sprites
            sprites = {};
            templates = {};
            rootNode = new Node("scene");
            rootNode.scene = this;
            
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
                } /*else if (desc.rows && desc.cols && desc.frames) {
                    // extract subimages
                }*/
                
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
                var header = document.createElement("h2"),
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
        
        this.addObject = function(obj) {
            rootNode.addObject(obj);
            obj.scene = this;
        };
        
        this.removeObject = function(obj) {
            rootNode.removeObject(obj);
            obj.scene = null;
        };
        
        this.addAction = function(action) {
            rootNode.addAction(action);
        };
        
        this.removeAction = function(action) {
            rootNode.removeAction(action);
        };
        
        this.update = function() {
            rootNode.update();
        };
        
        this.render = function() {
            // context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.save();
            context.scale(canvasScale, canvasScale);
            rootNode.render(context, sprites);
            context.restore();
        };
        
        this.getTemplates = function() {
            return templates;
        };
        this.getRootNode = function() {
            return rootNode;
        };
        this.getObjectById = function(id) {
            return rootNode.children.objectWithId(id);
        };
        
        this.createAction = function(desc) {
            return Action.createFromDescription(desc, templates);
        };
        this.createObject = function(desc) {
            return Node.createFromDescription(desc, templates);
        };
        
        this.canvas = canvas;
        this.context = context;
        this.container = container;
    }
    Scene.createFromDescription = function(desc) {};
    
    function Controller() {
    }
    
    Controller.Draggable = function(obj) {
        function mouseDown(e) {
            
        }
    };
    
    
    // ********************
    // Character actions
    // ********************

    function Action(stepFunc, time, completion, setup) {
        
        var completions = [],
            forever = time < 0,
            totalFrames = Action.toFrames(time),
            frames = totalFrames,
            needsSetup = true;
        
        if (typeof stepFunc !== "function") {
            stepFunc = noop;
        }
        if (typeof setup !== "function") {
            setup = noop;
            needsSetup = false;
        }
        
        function runCompletions(obj) {
            for (var i in completions) {
                // try/catch?
                completions[i](obj);
            }
        }
        
        this.reset = function() {
            frames = totalFrames;
            needsSetup = true;
        };
        
        this.addCompletion = function(callback) {
            if (typeof callback === "function") {
                completions.push(callback);
            }
        };
        
        this.run = function(obj) {
            var done = false;
            
            if (needsSetup) {
                setup(obj);
                needsSetup = false;
            }
            
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
    Action.createFromDescription = function(desc, templates) {
        
        var action;
        
        if (templates && desc.template) {
            var template = templates[desc.template];
            if (template) {
                action = Action.createFromDescription(template, templates);
            }
        } else {
            var name = desc.name,
                args = desc.args,
                constr = Action[name];
            if (constr) {
                action = constr.apply(this, args);
            }
        }
        
        if (action) {
            action.id = desc.id;
        }
        
        return action;
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
        
        function setup(c) {
            for (var i = 0; i < actions.length; i++) {
                actions[i].reset();
            }
            index = 0;
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
        
        return new Action(step, time, completion, setup);
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
        
        function setup(c) {
            for (i = 0; i < actions.length; i++) {
                run[i] = true;
                actions[i].reset();
                doneCount = 0;
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
        
        return new Action(step, time, completion, setup);
    };

    Action.Wait = function(data, completion) {
        var time = Number(data) || Number(data.time) || 1;
        return new Action(null, time, completion);
    };
    
    var ALLOWED_NUMBER_PROPERTIES = ["x", "y", "dx", "dy", "width", "height", "scale", "alpha", "rotation", "spriteIndex" ],
        ALLOWED_STRING_PROPERTIES = ["spriteName"];
    
    Action.SetProperty = function(data, completion) {
        function step(c) {
            for (var prop in data) {
                if (ALLOWED_STRING_PROPERTIES.indexOf(prop) >= 0) {
                    c[prop] = String(data[prop]);
                } else if (ALLOWED_NUMBER_PROPERTIES.indexOf(prop) >= 0) {
                    c[prop] = Number(data[prop]) || 0;
                }
            }
        }
        return new Action(step, 0, completion);
    };
    
    /**
     */
    Action.Move = function(data, completion) {
        var step, dx, dy, time, frames;
        
        function setup(c) {
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
            
            return new Action(step, time, completion, setup);
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
            scalingSpeed;
        
        function setup(c) {
            scalingSpeed = (dstScale - c.scale) / Action.toFrames(time);
            // console.log("first", scalingSpeed);
        }
        function step(c) {
            c.scale += scalingSpeed;
            // console.log("step");
        }
        
        return new Action(step, time, completion, setup);
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
            fadeSpeed;
        
        function setup(c) {
            fadeSpeed = (dstAlpha - c.alpha) / Action.toFrames(time);
        }
        function step(c) {
            c.alpha = Math.max(0, c.alpha + fadeSpeed);
        }
        return new Action(step, time, completion, setup);
    };

    Action.FadeIn = function(time, completion) {
        return Action.FadeToAlpha({alpha:1, time:time}, completion);
    };
    Action.FadeOut = function(time, completion) {
        return Action.FadeToAlpha({alpha:0, time:time}, completion);
    };
    
    Action.CreateObject = function(data, completion) {
        function createObject(node) {
            var scene = node.scene,
                parent, obj, i;
            
            obj = scene ? scene.createObject(data.obj) : Node.createFromDescription(data.obj);
            parent = node.find(data.parent);
            parent.addObject(obj);
        }
        return new Action(createObject, 0, completion);
    };
    
    Action.RemoveAction = function(data, completion) {
        function step(node) {
            for (var i in data.actions) {
                node.removeAction(data.actions[i]);
            }
        }
        return new Action(step, 0, completion);
    };
    
    Action.ClearActions = function(data, completion) {
        function step(node) {
            node.actions.empty();
        }
        return new Action(step, 0, completion);
    };
    
    Action.ChildAction = function(data, completion) {

        var child, childName = data.child,
            action = data.action,
            isDone = false,
            isSetup = false;
        
        function setup(node) {
            if (!isSetup) {
                if (typeof (action && action.run) !== "function") {
                    action = node.scene ? node.scene.createAction(action) : Action.createFromDescription(action);
                }
                action.addCompletion(done);
                isSetup = true;
            }
            
            child = node.find(childName);
            action.reset();
            isDone = false;
        }
        
        function done(node) {
            isDone = true;
        }
        
        function step(node) {
            if (child) {
                action.run(child);
            }
            return isDone;
        }
        
        return new Action(step, -1, completion, setup);
    };
    
    Action.Repeat = function(data, completion) {
        
        var times = isNaN(data.times) ? Infinity : Math.max(data.times, 1),
            totalTimes = times,
            action = data.action,
            isSetup = false;
        
        // if (data.action.template) { /* ... */ }
        
        function setup(node) {
            if (!isSetup) {
                if (typeof action.run !== "function") {
                    action = node.scene.createAction(action);
                }
                action.addCompletion(repeat);
                isSetup = true;
            } else {
                action.reset();
            }
            times = totalTimes;
        }
        function repeat(node) {
            action.reset();
            times--;
        }
        function step(node) {
            if (times > 0) {
                action.run(node);
                return false;
            }
            return true;
        }
        
        return new Action(step, -1, completion, setup);
    };
    
    Action.Completions = {};
    Action.Completions.Remove = function(obj) {
        obj.scene.removeObject(obj);
    }
    
    return {
        Scene : Scene,
        Node : Node,
        Action : Action
    };
}();

/*
 
 minified:
 
var Bamse=Bamse||function(){function r(){}function m(a,f,e){var b,c,d=a.length;for(c=0;c<d;c++)if(b=a[c],b.hasOwnProperty(f))return b[f];return e}function s(a){return a&&Number(a)?0>a?-1:1:0}function v(){var a=[],f={},e=[],b=[];this.add=function(a){if(a){b.push(a);var d=f[a.id];d&&e.push(d);a.id&&(f[a.id]=a)}};this.remove=function(a){a+""===a&&(a=f[a]);return a?(e.push(a),delete f[a.id],!0):!1};this.empty=function(){for(var b in a)e.push(a[b]);f={}};this.count=function(){return a.length};this.flush=
function(){var c,d;for(c in e){d=e[c];var h=a;d=h.indexOf(d);0<=d&&h.splice(d,1)}e.length=0;for(c in b)d=b[c],a.push(d);b.length=0};this.forEach=function(b){for(var d=0;d<a.length;d++)b(a[d],d)};this.objectWithId=function(a){return f[a]};this.objectAtIndex=function(b){return a[b]}}function p(a){function f(a){a.run(d)}function e(a){a.update()}var b=new v,c=new v,d=this;this.parent=this.scene=null;this.children=b;this.actions=c;this.id=a||(1E17*Math.random()).toFixed(0).toString();this.spriteName=null;
this.spriteIndex=0;this.alpha=1;this.visible=!0;this.image=null;this.dy=this.dx=this.y=this.x=0;this.scale=1;this.rotation=0;this.responseUrl=this.responseType=this.responseId=null;this.addObject=function(a,c){a&&(a.id=c||a.id,b.add(a),a.parent=this)};this.removeObject=function(a){b.remove(a)&&(a.parent=null)};this.addAction=function(a,b){a&&(a.id=b||a.id,c.add(a))};this.removeAction=function(a){c.remove(a)};this.update=function(){c.flush();b.flush();c.forEach(f);b.forEach(e)};this.render=function(a,
c){function d(b){b.render(a,c)}var e,f,g;(e=c[this.spriteName])?(this.spriteIndex%=e.length,g=e[this.spriteIndex]):g=null;a.save();a.translate(this.x,this.y);a.rotate(this.rotation);a.scale(this.scale,this.scale);a.globalAlpha*=this.alpha;g&&(e=g.width,f=g.height,a.drawImage(g,0.5*-e,0.5*-f,e,f),this.image=g);b.count()&&b.forEach(d);a.restore()};this.resetTransform=function(){this.rotation=0;this.scale=1;this.y=this.x=0;this.alpha=1}}function w(a){function f(){var a=b.offsetHeight,d=a*e;c.width=d;
c.height=a;h=d/t;c.style.marginLeft=0.5*-d+"px";c.style.marginTop=0.5*-a+"px"}var e=t/u,b=document.getElementById(a),c,d,h=1,k={},l={},q={},n=new p("root");n.scene=this;(a=b.getElementsByTagName("canvas"))&&0<a.length?c=a[0]:(c=document.createElement("canvas"),b.appendChild(c));c.style.left="50%";c.style.top="50%";d=c.getContext("2d");f();window.addEventListener("resize",f,!1);c.onclick=function(a){var b=a.offsetX/h,c=a.offsetY/h;n.children.forEach(function(a,d){if(a.visible&&a.image){var e=a.image.width*
a.scale*0.5,g=a.image.height*a.scale*0.5,f=a.x+e,l=a.y-g,g=a.y+g;if(b>=a.x-e&&b<=f&&c>=l&&c<=g&&(console.log("click"+d),e=q.click))for(f=0;f<e.length;f++)e[f](a)}})};this.addEventListener=this.on=function(a,b){var c=q[a]||[];c.push(b);q[a]=c};this.removeEventListener=this.off=function(a,b){var c;if(b){if(c=q[a])c=c.indexOf(b),0<=c&&q.splice(c,1)}else delete q[a]};this.load=function(a){function b(a){var c=new Image,d=document.createElement("canvas"),e=d.getContext("2d");c.onload=function(){d.width=
c.width;d.height=c.height;e.drawImage(c,0,0,c.width,c.height)};c.src=a;return d}k={};l={};n=new p("scene");n.scene=this;var c,d,e,f;for(c in a.sprites){d=a.sprites[c];e=[];if(d+""===d)e.push(b(d));else if(Array.isArray(d))for(f in d)e.push(b(d[f]));e&&(k[c]=e)}for(f in a.templates)l[f]=a.templates[f];if(a.title&&(c=document.createElement("h2"),a=document.createTextNode(a.title),d=document.getElementById("title"))){for(;d.hasChildNodes();)d.removeChild(d.lastChild);c.appendChild(a);d.appendChild(c)}};
this.addObject=function(a){n.addObject(a);a.scene=this};this.removeObject=function(a){n.removeObject(a);a.scene=null};this.addAction=function(a){n.addAction(a)};this.removeAction=function(a){n.removeAction(a)};this.update=function(){n.update()};this.render=function(){d.fillStyle="white";d.fillRect(0,0,c.width,c.height);d.save();d.scale(h,h);n.render(d,k);d.restore()};this.getTemplates=function(){return l};this.getRootNode=function(){return n};this.getObjectById=function(a){return n.children.objectWithId(a)};
this.createAction=function(a){return g.createFromDescription(a,l)};this.createObject=function(a){return p.createFromDescription(a,l)};this.canvas=c;this.context=d;this.container=b}function g(a,f,e,b){var c=[],d=0>f,h=g.toFrames(f),k=h,l=!0;"function"!==typeof a&&(a=r);"function"!==typeof b&&(b=r,l=!1);this.reset=function(){k=h;l=!0};this.addCompletion=function(a){"function"===typeof a&&c.push(a)};this.run=function(e){var f=!1;l&&(b(e),l=!1);d?f=a(e):0<k?(k--,f=a(e)):f=!0;if(f){e.removeAction(this);
for(var g in c)c[g](e)}};this.addCompletion(e)}var t=800,u=600;p.createFromDescription=function(a,f){function e(a){for(var c in a){var d=g.createFromDescription(a[c],f);d&&b.addAction(d)}}var b=new p(a.id),c=f&&f[a.template]||{},d=a.sprite||c.sprite,h=[a,c];d&&(b.spriteName=d.name||d,b.spriteIndex=d.index||b.spriteIndex);b.x=m(h,"x",Math.random()*t);b.y=m(h,"y",Math.random()*u);d=m(h,"dir",Math.random()*Math.PI*2);b.dx=m(h,"dx",Math.cos(d)*m(h,"speed",5));b.dy=m(h,"dy",Math.sin(d)*m(h,"speed",5));
b.scale=m(h,"scale",b.scale);b.rotation=m(h,"rotation",b.rotation);b.alpha=m(h,"alpha",b.alpha);a.response&&(b.responseId=a.response.id,b.responseType=a.response.type,b.responseUrl=a.response.url);b.visible=!0;c.actions&&e(c.actions);a.actions&&e(a.actions);return b};w.createFromDescription=function(a){};g.FPS=60;g.toFrames=function(a){a=isNaN(a)?Infinity:Math.max(1,a*g.FPS);return isFinite(a)?a|0:a};g.createFromDescription=function(a,f){if(f&&a.template){var e=f[a.template];return e?g.createFromDescription(e,
f):null}var e=a.args,b=g[a.name];if(b)return b.apply(this,e)};g.Sequence=function(a,f){function e(a){d++}var b=[],c,d=0,h,k=Number(a.time)||Infinity,l=a.actions||a;for(h=0;h<l.length;h++)c=l[h],"function"!==typeof c.run&&(c=g.createFromDescription(c)),c&&(c.addCompletion(e),b.push(c));return new g(function(a){if(d>=b.length)return!0;b[d].run(a)},k,f,function(a){for(a=0;a<b.length;a++)b[a].reset();d=0})};g.Group=function(a,f){function e(a){return function(){c[a]=!1;d++}}var b=[],c=[],d=0,h,k,l=Number(a.time)||
Infinity,q=a.actions||a;for(k=0;k<q.length;k++)h=q[k],"function"!==typeof h.run&&(h=g.createFromDescription(h)),h&&(h.addCompletion(e(c.length)),c.push(!0),b.push(h));return new g(function(a){if(d>=b.length)return!0;for(k in b)c[k]&&b[k].run(a)},l,f,function(a){for(k=0;k<b.length;k++)c[k]=!0,b[k].reset(),d=0})};g.Wait=function(a,f){return new g(null,Number(a)||Number(a.time)||1,f)};var x="x y dx dy scale alpha rotation spriteIndex".split(" "),y=["spriteName"];g.SetProperty=function(a,f){return new g(function(e){for(var b in a)0<=
y.indexOf(b)?e[b]=String(a[b]):0<=x.indexOf(b)&&(e[b]=Number(a[b])||0)},0,f)};g.Move=function(a,f){function e(b){c=(a.to.x-b.x)/k;d=(a.to.y-b.y)/k}var b,c,d,h,k;if(a&&a.to)return h=isNaN(a.time)?1:Number(a.time),k=g.toFrames(h),b=function(a){a.x+=c;a.y+=d},new g(b,h,f,e);b=function(a){a.x+=a.dx;a.y+=a.dy};return new g(b,a&&a.time,f)};g.Accelerate=function(a,f){a=a||{};var e=Number(a.x)||0,b=s(e),c=Number(a.y)||0,d=s(c),h=Math.abs(Number(a.maxDx))||Infinity,k=Math.abs(Number(a.maxDy))||Infinity;return new g(0==
e&&0==c?r:function(a){var f=a.dx+e,g=a.dy+c,m=s(f),p=s(g);m===b&&f*m>h&&(f=h*m);p==d&&g*p>k&&(g=k*p);a.dx=f;a.dy=g},a.time,f)};g.Bounce=function(a,f){a=a||{};var e=Number(a.minX||a.left)||0,b=Number(a.minY||a.top)||0,c=Number(a.maxX||a.right)||t,d=Number(a.maxY||a.bottom)||u,h=1,k=1;a.restitution&&(isNaN(a.restitution)?(h=isNaN(a.restitution.x)?1:Number(a.restitution.x),k=isNaN(a.restitution.y)?1:Number(a.restitution.y)):h=k=Number(a.restitution));return new g(function(a){a.x<e?(a.x=e,a.dx=-a.dx*
h):a.x>c&&(a.x=c,a.dx=-a.dx*h);a.y<b?(a.y=b,a.dy=-a.dy*k):a.y>d&&(a.y=d,a.dy=-a.dy*k)},a.time,f)};g.Friction=function(a,f){var e=Math.abs(Number(a&&a.x))||0,b=Math.abs(Number(a&&a.y))||0;return new g(0==e&&0==b?r:function(a){Math.abs(a.dx)<e?a.dx=0:a.dx=0>a.dx?a.dx+e:a.dx-e;Math.abs(a.dy)<b?a.dy=0:a.dy=0>a.dy?a.dy+b:a.dy-b},a.time,f)};g.Rotate=function(a,f){var e,b,c=a.time,d=0<c?g.toFrames(c):g.FPS;Number(a)?e=Number(a):a.rotation?e=Number(a.rotation):a.speed&&(e=Number(a.speed)*(0<c?c:1));a.radians||
(e=e*Math.PI/180);b=e/d;return new g(function(a){a.rotation+=b},c,f)};g.Scale=function(a,f){var e=Number(a&&a.speed||a)||0,b=isNaN(a.time)?1:Number(a.time),c;return new g(function(a){a.scale+=c},b,f,function(a){c=(e-a.scale)/g.toFrames(b)})};g.Animate=function(a,f){var e=a.name,b=Number(a.first)||0,c=1/g.toFrames(Number(a.speed)||1);return e?new g(function(a){b+=c;a.spriteName=e;a.spriteIndex=b|0},a.time,f):new g(null,0)};g.FadeToAlpha=function(a,f){var e=Number(a.alpha||a)||0,b=isNaN(a.time)?1:Number(a.time),
c;return new g(function(a){a.alpha=Math.max(0,a.alpha+c)},b,f,function(a){c=(e-a.alpha)/g.toFrames(b)})};g.FadeIn=function(a,f){return g.FadeToAlpha({alpha:1,time:a},f)};g.FadeOut=function(a,f){return g.FadeToAlpha({alpha:0,time:a},f)};g.CreateObject=function(a,f){return new g(function(e){var b=e.scene,c;c=b?b.createObject(a.obj):p.createFromDescription(a.obj);(b&&"root"===a.parent?b.getRootNode:e).addObject(c)},0,f)};g.RemoveAction=function(a,f){return new g(function(e){for(var b in a.actions)e.removeAction(a.actions[b])},
0,f)};g.ClearActions=function(a,f){return new g(function(a){a.actions.empty()},0,f)};g.ChildAction=function(a,f){function e(a){h=!0}var b,c=a.child,d=a.action,h=!1,k=!1;return new g(function(a){b&&d.run(b);return h},-1,f,function(a){if(!k){"function"!==typeof(d&&d.run)&&(d=a.scene?a.scene.createAction(d):g.createFromDescription(d));d.addCompletion(e);if(Array.isArray(c)){b=a;for(var f in c)b=b.children.objectWithId(c[f])}else b=a.children.objectWithId(c);k=!0}d.reset();h=!1})};g.Repeat=function(a,
f){function e(a){d.reset();b--}var b=isNaN(a.times)?1:Math.max(a.times,1),c=b,d=a.action,h=!1;return new g(function(a){return 0<b?(d.run(a),!1):!0},-1,f,function(a){h||("function"!==typeof d.run&&(d=a.scene.createAction(d)),d.addCompletion(e),h=!0);b=c})};g.Completions={};g.Completions.Remove=function(a){a.scene.removeObject(a)};return{Scene:w,Node:p,Action:g}}();
*/

/*
var msg = "",
    seed = 7,
    secret = [229, 88, 114, 103, 72, 228,
              103, 32, 51, 112, 111, 73,
              32, 32, 76, 33, 117, 108,
              121, 84, 85, 81, 32, 97,
              115, 97, 80, 79, 81, 87];

function rnd() {
    seed = (seed * 214013 + 2531011) % 32768;
    return seed;
}

for (var i = seed * 2; i > 0; i--) {
    msg += String.fromCharCode(secret[rnd() % secret.length]);
}

alert(msg);
*/



/*

 minified:
 

 
 */
