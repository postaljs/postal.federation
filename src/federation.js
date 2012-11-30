// BROWSER semi-uuid - it's ghetto and will need to be replaced
// the eventual node version won't need this kind of hackery
if(!postal.utils.getUUID) {
  postal.utils.getUUID = function() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";
    return s.join("");
  };
}

postal.fedx = _.extend({

  clients: {},

  transports: {},

  knownIds: [ postal.instanceId ],

  manifest: {},

  _processingIds: [],

  addToManifest: function(channel, topic, instanceId) {
    instanceId = instanceId || postal.instanceId;
    var manifest = this.manifest[instanceId];
    if(!manifest) {
      manifest = this.manifest[instanceId] = {}
    }
    if(!manifest[channel]) {
      manifest[channel] = [ topic ];
    } else {
      if(!_.contains(manifest[channel], topic)) {
        manifest[channel].push(topic);
      }
    }
  },

  getManifest: function(remoteInstance) {
    return _.reduce(this.manifest, function(memo, mfst, id){
      if(!remoteInstance || (remoteInstance && id !== remoteInstance)){
        _.each(mfst, function(topicList, channel){
          if(!memo[channel]) {
            memo[channel] = [];
          }
          _.each(topicList, function(topic){
            if(!_.include(memo[channel], topic)) {
              memo[channel].push(topic);
            }
          });
        });
      }
      return memo;
    }, {});
  },

  send : function(payload, blacklist) {
    blacklist = blacklist || this._processingIds;
    _.each(this.clients, function(client, id) {
      if(!_.contains(blacklist, id)) {
        client.send(payload);
      }
    }, this);
  },

  calculateKnownIds : function() {
    this.knownIds = [postal.instanceId].concat(_.keys(this.clients));
  },

  signalReady: function(transportName) {
    if(transportName) {
      this.transports[transportName].signalReady(this.getManifest());
    } else {
      _.each(this.transports, function(transport) {
        transport.signalReady(this.getManifest());
      }, this);
    }
  },

  getFedxWrapper: function(type) {
    return {
      postal     : true,
      type       : type,
      instanceId : postal.instanceId
    }
  },

  onFederatedMsg: function(payload) {
    postal.publish(payload.envelope);
  },

  addClient: function(options) {
    var client = this.clients[options.id];
    if(!client) {
      client = this.clients[options.id] = {
        subscriptions: {},
        activeTransport: options.type
      };
      client.send = function(payload, transport) {
        transport = transport || client.activeTransport;
        client[transport].send(payload);
      };
      this.calculateKnownIds();
    }
    if(!client[options.type]) {
      client[options.type] = {
        send: options.send
      };
      if(options.postSetup) {
        options.postSetup();
      }
      _.each(options.manifest, function(topicList, channel){
        _.each(topicList, function(topic){
          this.addClientSubscription(options.id, channel, topic);
        }, this);
      }, this);
    }
  },

  addClientSubscription: function(id, channel, topic) {
    var self = this;
    var subs = self.clients[id].subscriptions;
    if(!subs[channel]) {
      subs[channel] = {};
    }
    if(!subs[channel][topic]) {
      subs[channel][topic] = postal.subscribe({
        channel  : channel,
        topic    : topic,
        callback : function(data, env) {
          env = _.clone(env);
          env.originId = postal.instanceId;
          self.clients[id].send(_.extend({
            envelope: env
          }, self.getFedxWrapper("message")));
        }
      });
    }
  }

}, postal.fedx);

postal.subscribe({
  channel  : postal.configuration.SYSTEM_CHANNEL,
  topic    : "subscription.created",
  callback : function(data, env) {
    postal.fedx.addToManifest(data.channel, data.topic);
    var payload = _.extend({
      envelope: {
        channel  : "postal.federation",
        topic    : "remote.subscription.created",
        originId : postal.instanceId,
        knownIds : postal.fedx.knownIds,
        data     : { channel: data.channel, topic: data.topic }
      }
    }, postal.fedx.getFedxWrapper("subscription.created"));
    postal.fedx.send(payload);
  }
}).withConstraint(function(d, e){
    return d.channel !== "postal.federation" && d.channel !== postal.configuration.SYSTEM_CHANNEL;
  });

postal.subscribe({
  channel  : postal.configuration.SYSTEM_CHANNEL,
  topic    : "subscription.removed",
  callback : function(data, env) {
    if(!postal.utils.getSubscribersFor(data).length) {
      var payload = _.extend({
        envelope: {
          channel  : "postal.federation",
          topic    : "remote.subscription.removed",
          originId : postal.instanceId,
          knownIds : postal.fedx.knownIds,
          data     : { channel: data.channel, topic: data.topic }
        }
      }, postal.fedx.getFedxWrapper("subscription.created"));
      postal.fedx.send(payload);
    }
  }
}).withConstraint(function(d, e){
    return d.channel !== "postal.federation" && d.channel !== postal.configuration.SYSTEM_CHANNEL;
  });

postal.subscribe({
  channel  : "postal.federation",
  topic    : "remote.subscription.created",
  callback : function(d, e) {
    postal.fedx._processingIds = e.knownIds;
    postal.fedx.addClientSubscription(e.originId, d.channel, d.topic);
    postal.fedx._processingIds = [];
    var env = _.clone(e);
    env.knownIds = _.union(postal.fedx.knownIds, e.knownIds);
    env.originId = postal.instanceId;
    var payload = _.extend({ envelope: env }, postal.fedx.getFedxWrapper("subscription.created"));
    postal.fedx.send(payload, e.knownIds);
  }
});

postal.subscribe({
  channel  : "postal.federation",
  topic    : "remote.subscription.removed",
  callback : function(d, e) {
    var subs = postal.fedx.clients[e.originId].subscriptions;
    if(subs[d.channel] && subs[d.channel][d.topic]) {
      postal.fedx._processingIds = e.knownIds;
      subs[d.channel][d.topic].unsubscribe();
      postal.fedx._processingIds = [];
    }
  }
});