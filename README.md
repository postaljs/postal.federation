# postal.federation (POC)

###What is it?
postal.federation is an add-on for [postal.js](https://github.com/postaljs/postal.js) that provides the core facilities used by other postal.federation plugins to federate (or bridge) multiple instances of postal together, across various boundaries (frame/window, websocket, redis pub/sub, 0mq, etc.).  Federated 'postal.js peers' means, for example, that a message published in one instance of postal can be sent across the boundary (say, to an iframe) and published by the instance of postal in that environment as if it had originated there. This enables real time communication across multiple kinds of 'transports', while using a consistent envelope structure.  postal.js subscribers would continue to subscribe as they always have (same with publishers), but the reach of the messages could be extended from client, to server, to client, to other clients, etc.

###How do I use it?
#####Including it in your project
This plugin is a required dependency for any other postal.federation plugin, but it does not enable federation over any particular transport/boundary - it just provides core behavior. To use it, just include it in your project (after postal.js, if you're using standar js libs w/o any sort of amd/commonjs module approach).
#####API/Configuration
…More to Come...


### What plugins exist?

* [postal.xframe](https://github.com/postaljs/postal.xframe) - for federating across iframe/window & web worker boundaries