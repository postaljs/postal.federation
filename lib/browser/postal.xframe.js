/*
 postal.federation
 Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 License: Dual licensed MIT (http://www.opensource.org/licenses/mit-license) & GPL (http://www.opensource.org/licenses/gpl-license)
 Version 0.1.0
 */
/*
 postal.federation
 Author: Jim Cowart (http://freshbrewedcode.com/jimcowart)
 License: Dual licensed MIT (http://www.opensource.org/licenses/mit-license) & GPL (http://www.opensource.org/licenses/gpl-license)
 Version 0.1.0
 */
// the plugin should hook into the window

var xframe = (function(window, _, postal) {

  var XFRAME = "xframe";
  var _active = true;

  var plugin = {

    config: {
      autoReciprocate: true,
      allowedOrigins: [ window.location.origin ],
      originUrl: window.location.origin
    },

    shouldProcess: function(event) {
      var hasDomainFilters = !!this.config.allowedOrigins.length;
      return _active && (hasDomainFilters && _.contains(this.config.allowedOrigins, event.origin) || !hasDomainFilters ) && (event.data.postal)
    },

    clientOptionsFromEvent : function(event) {
      var self = this;
      var payload = event.data;
      var clientOptions = {
        id       : payload.instanceId,
        type     : XFRAME,
        manifest : payload.manifest,
        send     : function(payload) {
          event.source.postMessage(payload, self.config.originUrl || "*");
        }
      };
      if(this.config.autoReciprocate){
        clientOptions.postSetup = function() {
          postal.fedx.clients[payload.instanceId].send(_.extend({ manifest: postal.fedx.getManifest(payload.instanceId) }, postal.fedx.getFedxWrapper("ready")), XFRAME);
        }
      }
      return clientOptions;
    },

    onPostMessage: function( event ) {
      console.log(event);
      if(this.shouldProcess(event)) {
        var payload = event.data;
        postal.fedx._processingIds = [payload.instanceId];
        if(payload.type === 'ready') {
          postal.fedx.addClient(this.clientOptionsFromEvent(event));
        } else {
          postal.fedx.onFederatedMsg(payload);
        }
        postal.fedx._processingIds = [];
      }
    },

    disable: function() {
      _active = false;
    },

    enable: function() {
      _active = true;
    },

    getTargets: function() {
      return _.map(document.getElementsByTagName('iframe'), function(i) { return i.contentWindow; })
    },

    signalReady: function(manifest) {
      var self = this;
      var targets = self.getTargets();
      if(window.parent && window.parent !== window) {
        targets.push(window.parent);
      }
      _.each(targets, function(target) {
        target.postMessage(_.extend({ manifest: manifest }, postal.fedx.getFedxWrapper("ready")),  self.config.originUrl || "*");
      });
    }
  };

  _. bindAll(plugin);

  postal.fedx.transports.xframe = plugin;

  window.addEventListener("message", plugin.onPostMessage, false);

}(window, _, postal));