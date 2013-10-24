Mediating Presence Project
====================

This project was developed as part of Jimmy Nyström and Nicklas Nyström’s (that’s us!) computer science master’s thesis at Luleå University of Technology. It is a browser based videoconferencing system that uses WebRTC, WebGL and depth sensors (such as Microsoft’s Kinect) to enable three-dimensional video chat, shared viewing of 3D models and a collaborative multiplayer version of Klotski. We run a server on the Amazon cloud here (URL coming soon), but if you want to try and run a server of your own, follow the instructions below!

Server installation guide
----------------------------------

Our *Mediating Presence server* uses the Licode platform for its WebRTC communication. The simplest way to set it up is by editing the basic videoconferencing example that comes with the Licode installation (The server has been tested on Ubuntu 12.04 only, but should also work on Mac OS X):

1. Install Licode by following [their instructions](http://lynckia.com/licode/install.html).
2. Replace the folder `licode/extras/basic_example/public` with the contents of this repository:

        cd install-directory
        cd licode/extras/basic_example
        rm -rf public
        git clone http://github.com/nicnys-8/mediating-presence public

3. Replace the server file with the one from this repository:

        cd install-directory
        mv licode/extras/basic_example/public/basicServer.js licode/extras/basic_example/basicServer.js
        y (to accept overwrite)
        
3.5 (This step will not be needed future versions)
        Edit line 11 of the file basicServer.js to look like this:
            config = require("./../../licode_config"),

4. Start the server by running the following scripts:

        ./licode/scripts/initLicode.sh
        ./licode/scripts/initBasicExample.sh

5. Done! Clients should now be able to connect to the server at http://ip.address.of.server:3001/

Client installation guide
---------------------------------

Clients will need the following to get the most out of the system:

- Google Chrome (the only fully supported browser, but Firefox should work as well)
- A webcam
- A depth sensor (Microsoft Kinect, ASUS Xtion or similar) along with the the [Zigfu browser plugin](http://zigfu.com/en/downloads/browserplugin/).
- [Optional] 3D scanning software, such as [ReconstructMe](http://reconstructme.net/).
