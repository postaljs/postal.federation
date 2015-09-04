/*!
 *  * postal.federation - A base plugin for federating instances of postal.js across various boundaries.
 *  * Author: Jim Cowart (http://ifandelse.com)
 *  * Version: v0.4.0
 *  * Url: http://github.com/postaljs/postal.federation
 *  * License(s): (MIT OR GPL-2.0)
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("_"), require("postal"));
	else if(typeof define === 'function' && define.amd)
		define(["_", "postal"], factory);
	else if(typeof exports === 'object')
		exports["postalFedx"] = factory(require("_"), require("postal"));
	else
		root["postalFedx"] = factory(root["_"], root["postal"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__, __WEBPACK_EXTERNAL_MODULE_2__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	// istanbul ignore next
	
	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };
	
	var _ = _interopRequire(__webpack_require__(1));
	
	var postal = _interopRequire(__webpack_require__(2));
	
	if (!postal.createUUID) {
		postal.createUUID = function () {
			var s = [];
			var hexDigits = "0123456789abcdef";
			for (var i = 0; i < 36; i++) {
				s[i] = hexDigits.substr(Math.floor(Math.random() * 16), 1);
			}
			s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
			/* jshint ignore:start */
			s[19] = hexDigits.substr(s[19] & 3 | 8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
			/* jshint ignore:end */
			s[8] = s[13] = s[18] = s[23] = "-";
			return s.join("");
		};
	}
	if (!postal.instanceId) {
		postal.instanceId = (function () {
			var _id = undefined,
			    _oldId = undefined;
			return function (id) {
				if (id) {
					_oldId = _id;
					_id = id;
					postal.publish({
						channel: postal.configuration.SYSTEM_CHANNEL,
						topic: "instanceId.changed",
						data: {
							oldId: _oldId,
							newId: _id
						}
					});
				}
				return _id;
			};
		})();
	}
	
	var NO_OP = function NO_OP() {};
	var _ready = false;
	var _inboundQueue = [];
	var _outboundQueue = [];
	var _signalQueue = [];
	var _defaults = {
		enabled: true,
		filterMode: "whitelist",
		filterDirection: "both"
	};
	var _config = _defaults;
	function _matchesFilter(channel, topic, direction) {
		var channelPresent = Object.prototype.hasOwnProperty.call(fedx.filters[direction], channel);
		var topicMatch = channelPresent && _.any(fedx.filters[direction][channel], function (binding) {
			return postal.configuration.resolver.compare(binding, topic);
		});
		var blacklisting = _config.filterMode === "blacklist";
		return _config.enabled && (blacklisting && (!channelPresent || channelPresent && !topicMatch) || !blacklisting && channelPresent && topicMatch);
	};
	
	var packingSlips = {
		ping: function ping() {
			return {
				type: "federation.ping",
				instanceId: postal.instanceId(),
				timeStamp: new Date(),
				ticket: postal.createUUID()
			};
		},
		pong: function pong(ping) {
			return {
				type: "federation.pong",
				instanceId: postal.instanceId(),
				timeStamp: new Date(),
				pingData: {
					instanceId: ping.instanceId,
					timeStamp: ping.timeStamp,
					ticket: ping.ticket
				}
			};
		},
		message: function message(env) {
			return {
				type: "federation.message",
				instanceId: postal.instanceId(),
				timeStamp: new Date(),
				envelope: env
			};
		},
		disconnect: function disconnect() {
			return {
				type: "federation.disconnect",
				instanceId: postal.instanceId(),
				timeStamp: new Date()
			};
		},
		bundle: function bundle(packingSlips) {
			return {
				type: "federation.bundle",
				instanceId: postal.instanceId(),
				timeStamp: new Date(),
				packingSlips: packingSlips
			};
		}
	};
	var handlers = {
		"federation.ping": function federationPing(data /*, callback */) {
			data.source.setInstanceId(data.packingSlip.instanceId);
			if (data.source.handshakeComplete) {
				data.source.sendPong(data.packingSlip);
			} else {
				data.source.sendBundle([fedx.getPackingSlip("pong", data.packingSlip), fedx.getPackingSlip("ping")]);
			}
		},
		"federation.pong": function federationPong(data) {
			data.source.handshakeComplete = true;
			data.source.setInstanceId(data.packingSlip.instanceId);
			if (data.source.pings[data.packingSlip.pingData.ticket]) {
				data.source.pings[data.packingSlip.pingData.ticket].callback({
					ticket: data.packingSlip.pingData.ticket,
					instanceId: data.packingSlip.instanceId,
					source: data.source
				});
				data.source.pings[data.packingSlip.pingData.ticket] = undefined;
			}
			if (!_.contains(fedx.clients, data.packingSlip.instanceId)) {
				fedx.clients.push(data.packingSlip.instanceId);
			}
			postal.publish({
				channel: "postal.federation",
				topic: "client.federated",
				data: {
					remoteId: data.source.instanceId,
					localId: postal.instanceId(),
					transport: data.transport
				}
			});
		},
		"federation.disconnect": function federationDisconnect(data) {
			fedx.clients = _.without(fedx.clients, data.source.instanceId);
			fedx.disconnect({
				transport: data.source.transportName,
				instanceId: data.source.instanceId,
				doNotNotify: true
			});
		},
		"federation.message": function federationMessage(data) {
			var env = data.packingSlip.envelope;
			if (_matchesFilter(env.channel, env.topic, "in")) {
				env.lastSender = data.packingSlip.instanceId;
				postal.publish(env);
			}
		},
		"federation.bundle": function federationBundle(data) {
			_.each(data.packingSlip.packingSlips, function (slip) {
				fedx.onFederatedMsg(_.extend({}, data, {
					packingSlip: slip
				}));
			});
		}
	};
	
	function FederationClient(target, options, instanceId) {
		this.target = target;
		this.options = options || {};
		this.pings = {};
		this.instanceId = instanceId;
		this.handshakeComplete = false;
	};
	
	FederationClient.prototype.sendPing = function (callback) {
		var packingSlip = fedx.getPackingSlip("ping");
		this.pings[packingSlip.ticket] = {
			ticket: packingSlip.ticket,
			callback: callback || NO_OP
		};
		this.send(packingSlip);
	};
	
	FederationClient.prototype.sendPong = function (origPackingSlip) {
		this.send(fedx.getPackingSlip("pong", origPackingSlip));
	};
	
	FederationClient.prototype.sendBundle = function (slips) {
		this.send(fedx.getPackingSlip("bundle", slips));
	};
	
	FederationClient.prototype.sendMessage = function (envelope) {
		if (!this.handshakeComplete) {
			return;
		}
		envelope.originId = envelope.originId || postal.instanceId();
		var env = _.clone(envelope);
		if (this.instanceId && this.instanceId !== env.lastSender && (!env.knownIds || !env.knownIds.length || env.knownIds && !_.include(env.knownIds, this.instanceId))) {
			env.knownIds = (env.knownIds || []).concat(_.without(fedx.clients, this.instanceId));
			this.send(fedx.getPackingSlip("message", env));
		}
	};
	
	FederationClient.prototype.disconnect = function () {
		this.send(fedx.getPackingSlip("disconnect"));
	};
	
	FederationClient.prototype.onMessage = function (packingSlip) {
		if (this.shouldProcess()) {
			fedx.onFederatedMsg({
				transport: this.transportName,
				packingSlip: packingSlip,
				source: this
			});
		}
	};
	
	FederationClient.prototype.shouldProcess = function () {
		return true;
	};
	
	FederationClient.prototype.send = function () {
		throw new Error("An object deriving from FederationClient must provide an implementation for 'send'.");
	};
	
	FederationClient.prototype.setInstanceId = function (id) {
		this.instanceId = id;
	};
	
	FederationClient.extend = function (props, ctrProps) {
		function FedXClient() {
			FederationClient.apply(this, arguments);
		}
	
		FedXClient.prototype = Object.create(FederationClient.prototype);
		_.extend(FedXClient.prototype, props);
		_.extend(FedXClient, ctrProps);
	
		return FedXClient;
	};
	
	module.exports = fedx = postal.fedx = {
		FederationClient: FederationClient,
		packingSlips: packingSlips,
		handlers: handlers,
		clients: [],
		transports: {},
		filters: {
			"in": {}, // jscs:ignore disallowQuotedKeysInObjects
			out: {}
		},
		addFilter: function addFilter(filters) {
			filters = _.isArray(filters) ? filters : [filters];
			_.each(filters, function (filter) {
				filter.direction = filter.direction || _config.filterDirection;
				_.each(filter.direction === "both" ? ["in", "out"] : [filter.direction], function (dir) {
					if (!this.filters[dir][filter.channel]) {
						this.filters[dir][filter.channel] = [filter.topic];
					} else if (!_.include(this.filters[dir][filter.channel], filter.topic)) {
						this.filters[dir][filter.channel].push(filter.topic);
					}
				}, this);
			}, this);
		},
		removeFilter: function removeFilter(filters) {
			filters = _.isArray(filters) ? filters : [filters];
			_.each(filters, function (filter) {
				filter.direction = filter.direction || _config.filterDirection;
				_.each(filter.direction === "both" ? ["in", "out"] : [filter.direction], function (dir) {
					if (this.filters[dir][filter.channel] && _.include(this.filters[dir][filter.channel], filter.topic)) {
						this.filters[dir][filter.channel] = _.without(this.filters[dir][filter.channel], filter.topic);
					}
				}, this);
			}, this);
		},
		canSendRemote: function canSendRemote(channel, topic) {
			return _matchesFilter(channel, topic, "out");
		},
		configure: function configure(cfg) {
			if (cfg && cfg.filterMode && cfg.filterMode !== "blacklist" && cfg.filterMode !== "whitelist") {
				throw new Error("postal.fedx filterMode must be 'blacklist' or 'whitelist'.");
			}
			if (cfg) {
				_config = _.defaults(cfg, _defaults);
			}
			return _config;
		},
		getPackingSlip: function getPackingSlip(type /*, env */) {
			if (Object.prototype.hasOwnProperty.call(packingSlips, type)) {
				return packingSlips[type].apply(this, Array.prototype.slice.call(arguments, 1));
			}
		},
		onFederatedMsg: function onFederatedMsg(data) {
			if (!_ready) {
				_inboundQueue.push(data);
				return;
			}
			if (Object.prototype.hasOwnProperty.call(handlers, data.packingSlip.type)) {
				handlers[data.packingSlip.type](data);
			} else {
				throw new Error("postal.federation does not have a message handler for '" + data.packingSlip.type + "'.");
			}
		},
		sendMessage: function sendMessage(envelope) {
			if (!_ready) {
				_outboundQueue.push(arguments);
				return;
			}
			_.each(this.transports, function (transport) {
				transport.sendMessage(envelope);
			});
		},
		disconnect: function disconnect(options) {
			options = options || {};
			var transports = this.transports;
			if (options.transport) {
				transports = {};
				transports[options.transport] = this.transports[options.transport];
			}
			_.each(transports, function (transport) {
				transport.disconnect({
					target: options.target,
					instanceId: options.instanceId,
					doNotNotify: !!options.doNotNotify
				});
			}, this);
		},
		_getTransports: function _getTransports() {
			return _.reduce(this.transports, function (memo, transport, name) {
				memo[name] = true;
				return memo;
			}, {});
		},
		/*
	 	signalReady( callback );
	 	signalReady( "transportName" );
	 	signalReady( "transportName", callback );
	 	signalReady( "transportName", targetInstance, callback ); <-- this is NEW
	 	signalReady( { transportNameA: targetsForA, transportNameB: targetsForB, transportC: true }, callback);
	 */
		signalReady: function signalReady(transport, target, callback) {
			if (!_ready) {
				_signalQueue.push(arguments);
				return;
			}
			var transports = this._getTransports();
			switch (arguments.length) {
				case 1:
					if (typeof transport === "function") {
						callback = transport;
					} else if (typeof transport === "string") {
						transports = {};
						transports[transport] = this.transports[transport];
						callback = NO_OP;
					}
					break;
				case 2:
					if (typeof transport === "string") {
						transports = {};
						transports[transport] = this.transports[transport];
					} else {
						transports = transport;
					}
					callback = target || NO_OP;
					break;
				case 3:
					transports = {};
					transports[transport] = [target];
					break;
			}
			_.each(transports, function (targets, name) {
				targets = typeof targets === "boolean" ? [] : targets;
				this.transports[name].signalReady(targets, callback);
			}, this);
		}
	};
	
	function processSignalQ(args) {
		fedx.signalReady.apply(this, args);
	}
	
	function processOutboundQ(args) {
		fedx.send.apply(this, args);
	}
	
	function processInboundQ(msg) {
		fedx.onFederatedMsg.call(this, msg);
	}
	
	postal.addWireTap(function (data, envelope) {
		if (fedx.canSendRemote(envelope.channel, envelope.topic)) {
			fedx.sendMessage(envelope);
		}
	});
	
	postal.subscribe({
		channel: postal.configuration.SYSTEM_CHANNEL,
		topic: "instanceId.changed",
		callback: function callback() {
			_ready = true;
			while (_signalQueue.length) {
				processSignalQ(_signalQueue.shift());
			}
			while (_outboundQueue.length) {
				processOutboundQ(_outboundQueue.shift());
			}
			while (_inboundQueue.length) {
				processInboundQ(_inboundQueue.shift());
			}
		}
	});
	
	if (postal.instanceId() !== undefined) {
		_ready = true;
	}
	/* msg */

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCA1NzE0MzIwMDFhZjkwYzRmMWVkNyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiX1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcInBvc3RhbFwiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0QsTztBQ1ZBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7O0tDdENPLENBQUMsdUNBQU0sQ0FBUTs7S0FDZixNQUFNLHVDQUFNLENBQVE7O0FBRTNCLEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBVSxFQUFHO0FBQ3pCLFFBQU0sQ0FBQyxVQUFVLEdBQUcsWUFBVztBQUM5QixPQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxPQUFNLFNBQVMsR0FBRyxrQkFBa0IsQ0FBQztBQUNyQyxRQUFNLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFHO0FBQzlCLEtBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUksQ0FBRSxFQUFFLENBQUMsQ0FBRSxDQUFDO0lBQ2pFO0FBQ0QsSUFBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7QUFFWixJQUFD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QUFDL0Isb0JBQWdCLENBQUUsY0FBYyxDQUFDLEtBQUssRUFBRSxDQUFFLENBQUM7SUFDM0M7QUFDRCxVQUFRLGFBQWEsQ0FBQyxNQUFNLEVBQUc7QUFDOUIsbUJBQWUsQ0FBRSxhQUFhLENBQUMsS0FBSyxFQUFFLENBQUUsQ0FBQztJQUN6QztHQUNEO0VBQ0QsQ0FBRSxDQUFDOztBQUVKLEtBQUssTUFBTSxDQUFDLFVBQVUsRUFBRSxLQUFLLFNBQVMsRUFBRztBQUN4QyxRQUFNLEdBQUcsSUFBSSxDQUFDO0VBQ2Q7Ozs7Ozs7QUMvWkQsZ0Q7Ozs7OztBQ0FBLGdEIiwiZmlsZSI6InBvc3RhbC5mZWRlcmF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKFwiX1wiKSwgcmVxdWlyZShcInBvc3RhbFwiKSk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXCJfXCIsIFwicG9zdGFsXCJdLCBmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcInBvc3RhbEZlZHhcIl0gPSBmYWN0b3J5KHJlcXVpcmUoXCJfXCIpLCByZXF1aXJlKFwicG9zdGFsXCIpKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJwb3N0YWxGZWR4XCJdID0gZmFjdG9yeShyb290W1wiX1wiXSwgcm9vdFtcInBvc3RhbFwiXSk7XG59KSh0aGlzLCBmdW5jdGlvbihfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzFfXywgX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8yX18pIHtcbnJldHVybiBcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb25cbiAqKi8iLCIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDU3MTQzMjAwMWFmOTBjNGYxZWQ3XG4gKiovIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHBvc3RhbCBmcm9tIFwicG9zdGFsXCI7XG5cbmlmICggIXBvc3RhbC5jcmVhdGVVVUlEICkge1xuXHRwb3N0YWwuY3JlYXRlVVVJRCA9IGZ1bmN0aW9uKCkge1xuXHRcdGxldCBzID0gW107XG5cdFx0Y29uc3QgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgMzY7IGkrKyApIHtcblx0XHRcdHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKCBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogMHgxMCApLCAxICk7XG5cdFx0fVxuXHRcdHNbMTRdID0gXCI0XCI7IC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxuXHRcdC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cblx0XHRzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoICggc1sxOV0gJiAweDMgKSB8IDB4OCwgMSApOyAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuXHRcdC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG5cdFx0c1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXHRcdHJldHVybiBzLmpvaW4oIFwiXCIgKTtcblx0fTtcbn1cbmlmICggIXBvc3RhbC5pbnN0YW5jZUlkICkge1xuXHRwb3N0YWwuaW5zdGFuY2VJZCA9ICggZnVuY3Rpb24oKSB7XG5cdFx0bGV0IF9pZCwgX29sZElkO1xuXHRcdHJldHVybiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0XHRpZiAoIGlkICkge1xuXHRcdFx0XHRfb2xkSWQgPSBfaWQ7XG5cdFx0XHRcdF9pZCA9IGlkO1xuXHRcdFx0XHRwb3N0YWwucHVibGlzaCgge1xuXHRcdFx0XHRcdGNoYW5uZWw6IHBvc3RhbC5jb25maWd1cmF0aW9uLlNZU1RFTV9DSEFOTkVMLFxuXHRcdFx0XHRcdHRvcGljOiBcImluc3RhbmNlSWQuY2hhbmdlZFwiLFxuXHRcdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRcdG9sZElkOiBfb2xkSWQsXG5cdFx0XHRcdFx0XHRuZXdJZDogX2lkXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gX2lkO1xuXHRcdH07XG5cdH0oKSApO1xufVxuXG5jb25zdCBOT19PUCA9IGZ1bmN0aW9uKCkge307XG5sZXQgX3JlYWR5ID0gZmFsc2U7XG5sZXQgX2luYm91bmRRdWV1ZSA9IFtdO1xubGV0IF9vdXRib3VuZFF1ZXVlID0gW107XG5sZXQgX3NpZ25hbFF1ZXVlID0gW107XG5jb25zdCBfZGVmYXVsdHMgPSB7XG5cdGVuYWJsZWQ6IHRydWUsXG5cdGZpbHRlck1vZGU6IFwid2hpdGVsaXN0XCIsXG5cdGZpbHRlckRpcmVjdGlvbjogXCJib3RoXCJcbn07XG5sZXQgX2NvbmZpZyA9IF9kZWZhdWx0cztcbmZ1bmN0aW9uIF9tYXRjaGVzRmlsdGVyKCBjaGFubmVsLCB0b3BpYywgZGlyZWN0aW9uICkge1xuXHRjb25zdCBjaGFubmVsUHJlc2VudCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggZmVkeC5maWx0ZXJzW2RpcmVjdGlvbl0sIGNoYW5uZWwgKTtcblx0Y29uc3QgdG9waWNNYXRjaCA9ICggY2hhbm5lbFByZXNlbnQgJiYgXy5hbnkoIGZlZHguZmlsdGVyc1tkaXJlY3Rpb25dW2NoYW5uZWxdLCBmdW5jdGlvbiggYmluZGluZyApIHtcblx0XHRyZXR1cm4gcG9zdGFsLmNvbmZpZ3VyYXRpb24ucmVzb2x2ZXIuY29tcGFyZSggYmluZGluZywgdG9waWMgKTtcblx0fSApICk7XG5cdGNvbnN0IGJsYWNrbGlzdGluZyA9IF9jb25maWcuZmlsdGVyTW9kZSA9PT0gXCJibGFja2xpc3RcIjtcblx0cmV0dXJuIF9jb25maWcuZW5hYmxlZCAmJiAoICggYmxhY2tsaXN0aW5nICYmICggIWNoYW5uZWxQcmVzZW50IHx8ICggY2hhbm5lbFByZXNlbnQgJiYgIXRvcGljTWF0Y2ggKSApICkgfHwgKCAhYmxhY2tsaXN0aW5nICYmIGNoYW5uZWxQcmVzZW50ICYmIHRvcGljTWF0Y2ggKSApO1xufTtcblxuY29uc3QgcGFja2luZ1NsaXBzID0ge1xuXHRwaW5nOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLnBpbmdcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0XHR0aWNrZXQ6IHBvc3RhbC5jcmVhdGVVVUlEKClcblx0XHR9O1xuXHR9LFxuXHRwb25nOiBmdW5jdGlvbiggcGluZyApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLnBvbmdcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0XHRwaW5nRGF0YToge1xuXHRcdFx0XHRpbnN0YW5jZUlkOiBwaW5nLmluc3RhbmNlSWQsXG5cdFx0XHRcdHRpbWVTdGFtcDogcGluZy50aW1lU3RhbXAsXG5cdFx0XHRcdHRpY2tldDogcGluZy50aWNrZXRcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXHRtZXNzYWdlOiBmdW5jdGlvbiggZW52ICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ubWVzc2FnZVwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdGVudmVsb3BlOiBlbnZcblx0XHR9O1xuXHR9LFxuXHRkaXNjb25uZWN0OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLmRpc2Nvbm5lY3RcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKClcblx0XHR9O1xuXHR9LFxuXHRidW5kbGU6IGZ1bmN0aW9uKCBwYWNraW5nU2xpcHMgKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5idW5kbGVcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0XHRwYWNraW5nU2xpcHM6IHBhY2tpbmdTbGlwc1xuXHRcdH07XG5cdH1cbn07XG5jb25zdCBoYW5kbGVycyA9IHtcblx0XCJmZWRlcmF0aW9uLnBpbmdcIjogZnVuY3Rpb24oIGRhdGEgLyosIGNhbGxiYWNrICovICkge1xuXHRcdGRhdGEuc291cmNlLnNldEluc3RhbmNlSWQoIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdGlmICggZGF0YS5zb3VyY2UuaGFuZHNoYWtlQ29tcGxldGUgKSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5zZW5kUG9uZyggZGF0YS5wYWNraW5nU2xpcCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5zZW5kQnVuZGxlKCBbXG5cdFx0XHRmZWR4LmdldFBhY2tpbmdTbGlwKCBcInBvbmdcIiwgZGF0YS5wYWNraW5nU2xpcCApLFxuXHRcdFx0ZmVkeC5nZXRQYWNraW5nU2xpcCggXCJwaW5nXCIgKVxuXHRcdFx0XSApO1xuXHRcdH1cblx0fSxcblx0XCJmZWRlcmF0aW9uLnBvbmdcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0ZGF0YS5zb3VyY2UuaGFuZHNoYWtlQ29tcGxldGUgPSB0cnVlO1xuXHRcdGRhdGEuc291cmNlLnNldEluc3RhbmNlSWQoIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdGlmICggZGF0YS5zb3VyY2UucGluZ3NbZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXRdICkge1xuXHRcdFx0ZGF0YS5zb3VyY2UucGluZ3NbZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXRdLmNhbGxiYWNrKCB7XG5cdFx0XHRcdHRpY2tldDogZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXQsXG5cdFx0XHRcdGluc3RhbmNlSWQ6IGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCxcblx0XHRcdFx0c291cmNlOiBkYXRhLnNvdXJjZVxuXHRcdFx0fSApO1xuXHRcdFx0ZGF0YS5zb3VyY2UucGluZ3NbZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXRdID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRpZiAoICFfLmNvbnRhaW5zKCBmZWR4LmNsaWVudHMsIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApICkge1xuXHRcdFx0ZmVkeC5jbGllbnRzLnB1c2goIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdH1cblx0XHRwb3N0YWwucHVibGlzaCgge1xuXHRcdFx0Y2hhbm5lbDogXCJwb3N0YWwuZmVkZXJhdGlvblwiLFxuXHRcdFx0dG9waWM6IFwiY2xpZW50LmZlZGVyYXRlZFwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRyZW1vdGVJZDogZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCxcblx0XHRcdFx0bG9jYWxJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdFx0dHJhbnNwb3J0OiBkYXRhLnRyYW5zcG9ydFxuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblx0XCJmZWRlcmF0aW9uLmRpc2Nvbm5lY3RcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0ZmVkeC5jbGllbnRzID0gXy53aXRob3V0KCBmZWR4LmNsaWVudHMsIGRhdGEuc291cmNlLmluc3RhbmNlSWQgKTtcblx0XHRmZWR4LmRpc2Nvbm5lY3QoIHtcblx0XHRcdHRyYW5zcG9ydDogZGF0YS5zb3VyY2UudHJhbnNwb3J0TmFtZSxcblx0XHRcdGluc3RhbmNlSWQ6IGRhdGEuc291cmNlLmluc3RhbmNlSWQsXG5cdFx0XHRkb05vdE5vdGlmeTogdHJ1ZVxuXHRcdH0gKTtcblx0fSxcblx0XCJmZWRlcmF0aW9uLm1lc3NhZ2VcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0Y29uc3QgZW52ID0gZGF0YS5wYWNraW5nU2xpcC5lbnZlbG9wZTtcblx0XHRpZiAoIF9tYXRjaGVzRmlsdGVyKCBlbnYuY2hhbm5lbCwgZW52LnRvcGljLCBcImluXCIgKSApIHtcblx0XHRcdGVudi5sYXN0U2VuZGVyID0gZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkO1xuXHRcdFx0cG9zdGFsLnB1Ymxpc2goIGVudiApO1xuXHRcdH1cblx0fSxcblx0XCJmZWRlcmF0aW9uLmJ1bmRsZVwiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRfLmVhY2goIGRhdGEucGFja2luZ1NsaXAucGFja2luZ1NsaXBzLCBmdW5jdGlvbiggc2xpcCApIHtcblx0XHRcdGZlZHgub25GZWRlcmF0ZWRNc2coIF8uZXh0ZW5kKCB7fSwgZGF0YSwge1xuXHRcdFx0XHRwYWNraW5nU2xpcDogc2xpcFxuXHRcdFx0fSApICk7XG5cdFx0fSApO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBGZWRlcmF0aW9uQ2xpZW50KCB0YXJnZXQsIG9wdGlvbnMsIGluc3RhbmNlSWQgKSB7XG5cdHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuXHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHR0aGlzLnBpbmdzID0ge307XG5cdHRoaXMuaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQ7XG5cdHRoaXMuaGFuZHNoYWtlQ29tcGxldGUgPSBmYWxzZTtcbn07XG5cbkZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlLnNlbmRQaW5nID0gZnVuY3Rpb24oIGNhbGxiYWNrICkge1xuXHRjb25zdCBwYWNraW5nU2xpcCA9IGZlZHguZ2V0UGFja2luZ1NsaXAoIFwicGluZ1wiICk7XG5cdHRoaXMucGluZ3NbcGFja2luZ1NsaXAudGlja2V0XSA9IHtcblx0XHR0aWNrZXQ6IHBhY2tpbmdTbGlwLnRpY2tldCxcblx0XHRjYWxsYmFjazogY2FsbGJhY2sgfHwgTk9fT1Bcblx0fTtcblx0dGhpcy5zZW5kKCBwYWNraW5nU2xpcCApO1xufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUuc2VuZFBvbmcgPSBmdW5jdGlvbiggb3JpZ1BhY2tpbmdTbGlwICkge1xuXHR0aGlzLnNlbmQoIGZlZHguZ2V0UGFja2luZ1NsaXAoIFwicG9uZ1wiLCBvcmlnUGFja2luZ1NsaXAgKSApO1xufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUuc2VuZEJ1bmRsZSA9IGZ1bmN0aW9uKCBzbGlwcyApIHtcblx0dGhpcy5zZW5kKCBmZWR4LmdldFBhY2tpbmdTbGlwKCBcImJ1bmRsZVwiLCBzbGlwcyApICk7XG59O1xuXG5GZWRlcmF0aW9uQ2xpZW50LnByb3RvdHlwZS5zZW5kTWVzc2FnZSA9IGZ1bmN0aW9uKCBlbnZlbG9wZSApIHtcblx0aWYgKCAhdGhpcy5oYW5kc2hha2VDb21wbGV0ZSApIHtcblx0XHRyZXR1cm47XG5cdH1cblx0ZW52ZWxvcGUub3JpZ2luSWQgPSBlbnZlbG9wZS5vcmlnaW5JZCB8fCBwb3N0YWwuaW5zdGFuY2VJZCgpO1xuXHRjb25zdCBlbnYgPSBfLmNsb25lKCBlbnZlbG9wZSApO1xuXHRpZiAoIHRoaXMuaW5zdGFuY2VJZCAmJiB0aGlzLmluc3RhbmNlSWQgIT09IGVudi5sYXN0U2VuZGVyICYmXG5cdCggIWVudi5rbm93bklkcyB8fCAhZW52Lmtub3duSWRzLmxlbmd0aCB8fFxuXHQoIGVudi5rbm93bklkcyAmJiAhXy5pbmNsdWRlKCBlbnYua25vd25JZHMsIHRoaXMuaW5zdGFuY2VJZCApICkgKVxuXHQpIHtcblx0XHRlbnYua25vd25JZHMgPSAoIGVudi5rbm93bklkcyB8fCBbXSApLmNvbmNhdCggXy53aXRob3V0KCBmZWR4LmNsaWVudHMsIHRoaXMuaW5zdGFuY2VJZCApICk7XG5cdFx0dGhpcy5zZW5kKCBmZWR4LmdldFBhY2tpbmdTbGlwKCBcIm1lc3NhZ2VcIiwgZW52ICkgKTtcblx0fVxufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUuZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnNlbmQoIGZlZHguZ2V0UGFja2luZ1NsaXAoIFwiZGlzY29ubmVjdFwiICkgKTtcbn07XG5cbkZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlLm9uTWVzc2FnZSA9IGZ1bmN0aW9uKCBwYWNraW5nU2xpcCApIHtcblx0aWYgKCB0aGlzLnNob3VsZFByb2Nlc3MoKSApIHtcblx0XHRmZWR4Lm9uRmVkZXJhdGVkTXNnKCB7XG5cdFx0XHR0cmFuc3BvcnQ6IHRoaXMudHJhbnNwb3J0TmFtZSxcblx0XHRcdHBhY2tpbmdTbGlwOiBwYWNraW5nU2xpcCxcblx0XHRcdHNvdXJjZTogdGhpc1xuXHRcdH0gKTtcblx0fVxufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUuc2hvdWxkUHJvY2VzcyA9IGZ1bmN0aW9uKCkge1xuXHRyZXR1cm4gdHJ1ZTtcbn07XG5cbkZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbiggLyogbXNnICovICkge1xuXHR0aHJvdyBuZXcgRXJyb3IoIFwiQW4gb2JqZWN0IGRlcml2aW5nIGZyb20gRmVkZXJhdGlvbkNsaWVudCBtdXN0IHByb3ZpZGUgYW4gaW1wbGVtZW50YXRpb24gZm9yICdzZW5kJy5cIiApO1xufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUuc2V0SW5zdGFuY2VJZCA9IGZ1bmN0aW9uKCBpZCApIHtcblx0dGhpcy5pbnN0YW5jZUlkID0gaWQ7XG59O1xuXG5GZWRlcmF0aW9uQ2xpZW50LmV4dGVuZCA9IGZ1bmN0aW9uKCBwcm9wcywgY3RyUHJvcHMgKSB7XG5cdGZ1bmN0aW9uIEZlZFhDbGllbnQoKSB7XG5cdFx0RmVkZXJhdGlvbkNsaWVudC5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cdH1cblxuXHRGZWRYQ2xpZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlICk7XG5cdF8uZXh0ZW5kKCBGZWRYQ2xpZW50LnByb3RvdHlwZSwgcHJvcHMgKTtcblx0Xy5leHRlbmQoIEZlZFhDbGllbnQsIGN0clByb3BzICk7XG5cblx0cmV0dXJuIEZlZFhDbGllbnQ7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmZWR4ID0gcG9zdGFsLmZlZHggPSB7XG5cdEZlZGVyYXRpb25DbGllbnQ6IEZlZGVyYXRpb25DbGllbnQsXG5cdHBhY2tpbmdTbGlwczogcGFja2luZ1NsaXBzLFxuXHRoYW5kbGVyczogaGFuZGxlcnMsXG5cdGNsaWVudHM6IFtdLFxuXHR0cmFuc3BvcnRzOiB7fSxcblx0ZmlsdGVyczoge1xuXHRcdFwiaW5cIjoge30sIC8vIGpzY3M6aWdub3JlIGRpc2FsbG93UXVvdGVkS2V5c0luT2JqZWN0c1xuXHRcdG91dDoge31cblx0fSxcblx0YWRkRmlsdGVyOiBmdW5jdGlvbiggZmlsdGVycyApIHtcblx0XHRmaWx0ZXJzID0gXy5pc0FycmF5KCBmaWx0ZXJzICkgPyBmaWx0ZXJzIDogWyBmaWx0ZXJzIF07XG5cdFx0Xy5lYWNoKCBmaWx0ZXJzLCBmdW5jdGlvbiggZmlsdGVyICkge1xuXHRcdFx0ZmlsdGVyLmRpcmVjdGlvbiA9IGZpbHRlci5kaXJlY3Rpb24gfHwgX2NvbmZpZy5maWx0ZXJEaXJlY3Rpb247XG5cdFx0XHRfLmVhY2goICggZmlsdGVyLmRpcmVjdGlvbiA9PT0gXCJib3RoXCIgKSA/IFsgXCJpblwiLCBcIm91dFwiIF0gOiBbIGZpbHRlci5kaXJlY3Rpb24gXSwgZnVuY3Rpb24oIGRpciApIHtcblx0XHRcdFx0aWYgKCAhdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSA9IFsgZmlsdGVyLnRvcGljIF07XG5cdFx0XHRcdH0gZWxzZSBpZiAoICEoIF8uaW5jbHVkZSggdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLCBmaWx0ZXIudG9waWMgKSApICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXS5wdXNoKCBmaWx0ZXIudG9waWMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcyApO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblx0cmVtb3ZlRmlsdGVyOiBmdW5jdGlvbiggZmlsdGVycyApIHtcblx0XHRmaWx0ZXJzID0gXy5pc0FycmF5KCBmaWx0ZXJzICkgPyBmaWx0ZXJzIDogWyBmaWx0ZXJzIF07XG5cdFx0Xy5lYWNoKCBmaWx0ZXJzLCBmdW5jdGlvbiggZmlsdGVyICkge1xuXHRcdFx0ZmlsdGVyLmRpcmVjdGlvbiA9IGZpbHRlci5kaXJlY3Rpb24gfHwgX2NvbmZpZy5maWx0ZXJEaXJlY3Rpb247XG5cdFx0XHRfLmVhY2goICggZmlsdGVyLmRpcmVjdGlvbiA9PT0gXCJib3RoXCIgKSA/IFsgXCJpblwiLCBcIm91dFwiIF0gOiBbIGZpbHRlci5kaXJlY3Rpb24gXSwgZnVuY3Rpb24oIGRpciApIHtcblx0XHRcdFx0aWYgKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0gJiYgXy5pbmNsdWRlKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0sIGZpbHRlci50b3BpYyApICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSA9IF8ud2l0aG91dCggdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLCBmaWx0ZXIudG9waWMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcyApO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblx0Y2FuU2VuZFJlbW90ZTogZnVuY3Rpb24oIGNoYW5uZWwsIHRvcGljICkge1xuXHRcdHJldHVybiBfbWF0Y2hlc0ZpbHRlciggY2hhbm5lbCwgdG9waWMsIFwib3V0XCIgKTtcblx0fSxcblx0Y29uZmlndXJlOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdGlmICggY2ZnICYmIGNmZy5maWx0ZXJNb2RlICYmIGNmZy5maWx0ZXJNb2RlICE9PSBcImJsYWNrbGlzdFwiICYmIGNmZy5maWx0ZXJNb2RlICE9PSBcIndoaXRlbGlzdFwiICkge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCBcInBvc3RhbC5mZWR4IGZpbHRlck1vZGUgbXVzdCBiZSAnYmxhY2tsaXN0JyBvciAnd2hpdGVsaXN0Jy5cIiApO1xuXHRcdH1cblx0XHRpZiAoIGNmZyApIHtcblx0XHRcdF9jb25maWcgPSBfLmRlZmF1bHRzKCBjZmcsIF9kZWZhdWx0cyApO1xuXHRcdH1cblx0XHRyZXR1cm4gX2NvbmZpZztcblx0fSxcblx0Z2V0UGFja2luZ1NsaXA6IGZ1bmN0aW9uKCB0eXBlIC8qLCBlbnYgKi8gKSB7XG5cdFx0aWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIHBhY2tpbmdTbGlwcywgdHlwZSApICkge1xuXHRcdFx0cmV0dXJuIHBhY2tpbmdTbGlwc1t0eXBlXS5hcHBseSggdGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApICk7XG5cdFx0fVxuXHR9LFxuXHRvbkZlZGVyYXRlZE1zZzogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0aWYgKCAhX3JlYWR5ICkge1xuXHRcdFx0X2luYm91bmRRdWV1ZS5wdXNoKCBkYXRhICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBoYW5kbGVycywgZGF0YS5wYWNraW5nU2xpcC50eXBlICkgKSB7XG5cdFx0XHRoYW5kbGVyc1tkYXRhLnBhY2tpbmdTbGlwLnR5cGVdKCBkYXRhICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRocm93IG5ldyBFcnJvciggXCJwb3N0YWwuZmVkZXJhdGlvbiBkb2VzIG5vdCBoYXZlIGEgbWVzc2FnZSBoYW5kbGVyIGZvciAnXCIgKyBkYXRhLnBhY2tpbmdTbGlwLnR5cGUgKyBcIicuXCIgKTtcblx0XHR9XG5cdH0sXG5cdHNlbmRNZXNzYWdlOiBmdW5jdGlvbiggZW52ZWxvcGUgKSB7XG5cdFx0aWYgKCAhX3JlYWR5ICkge1xuXHRcdFx0X291dGJvdW5kUXVldWUucHVzaCggYXJndW1lbnRzICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdF8uZWFjaCggdGhpcy50cmFuc3BvcnRzLCBmdW5jdGlvbiggdHJhbnNwb3J0ICkge1xuXHRcdFx0dHJhbnNwb3J0LnNlbmRNZXNzYWdlKCBlbnZlbG9wZSApO1xuXHRcdH0gKTtcblx0fSxcblx0ZGlzY29ubmVjdDogZnVuY3Rpb24oIG9wdGlvbnMgKSB7XG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0bGV0IHRyYW5zcG9ydHMgPSB0aGlzLnRyYW5zcG9ydHM7XG5cdFx0aWYgKCBvcHRpb25zLnRyYW5zcG9ydCApIHtcblx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdHRyYW5zcG9ydHNbb3B0aW9ucy50cmFuc3BvcnRdID0gdGhpcy50cmFuc3BvcnRzW29wdGlvbnMudHJhbnNwb3J0XTtcblx0XHR9XG5cdFx0Xy5lYWNoKCB0cmFuc3BvcnRzLCBmdW5jdGlvbiggdHJhbnNwb3J0ICkge1xuXHRcdFx0dHJhbnNwb3J0LmRpc2Nvbm5lY3QoIHtcblx0XHRcdFx0dGFyZ2V0OiBvcHRpb25zLnRhcmdldCxcblx0XHRcdFx0aW5zdGFuY2VJZDogb3B0aW9ucy5pbnN0YW5jZUlkLFxuXHRcdFx0XHRkb05vdE5vdGlmeTogISFvcHRpb25zLmRvTm90Tm90aWZ5XG5cdFx0XHR9ICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9LFxuXHRfZ2V0VHJhbnNwb3J0czogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8ucmVkdWNlKCB0aGlzLnRyYW5zcG9ydHMsIGZ1bmN0aW9uKCBtZW1vLCB0cmFuc3BvcnQsIG5hbWUgKSB7XG5cdFx0XHRtZW1vW25hbWVdID0gdHJ1ZTtcblx0XHRcdHJldHVybiBtZW1vO1xuXHRcdH0sIHt9ICk7XG5cdH0sXG5cdC8qXG5cdFx0c2lnbmFsUmVhZHkoIGNhbGxiYWNrICk7XG5cdFx0c2lnbmFsUmVhZHkoIFwidHJhbnNwb3J0TmFtZVwiICk7XG5cdFx0c2lnbmFsUmVhZHkoIFwidHJhbnNwb3J0TmFtZVwiLCBjYWxsYmFjayApO1xuXHRcdHNpZ25hbFJlYWR5KCBcInRyYW5zcG9ydE5hbWVcIiwgdGFyZ2V0SW5zdGFuY2UsIGNhbGxiYWNrICk7IDwtLSB0aGlzIGlzIE5FV1xuXHRcdHNpZ25hbFJlYWR5KCB7IHRyYW5zcG9ydE5hbWVBOiB0YXJnZXRzRm9yQSwgdHJhbnNwb3J0TmFtZUI6IHRhcmdldHNGb3JCLCB0cmFuc3BvcnRDOiB0cnVlIH0sIGNhbGxiYWNrKTtcblx0Ki9cblx0c2lnbmFsUmVhZHk6IGZ1bmN0aW9uKCB0cmFuc3BvcnQsIHRhcmdldCwgY2FsbGJhY2sgKSB7XG5cdFx0aWYgKCAhX3JlYWR5ICkge1xuXHRcdFx0X3NpZ25hbFF1ZXVlLnB1c2goIGFyZ3VtZW50cyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRsZXQgdHJhbnNwb3J0cyA9IHRoaXMuX2dldFRyYW5zcG9ydHMoKTtcblx0XHRzd2l0Y2ggKCBhcmd1bWVudHMubGVuZ3RoICkge1xuXHRcdGNhc2UgMTpcblx0XHRcdGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0XHRjYWxsYmFjayA9IHRyYW5zcG9ydDtcblx0XHRcdH0gZWxzZSBpZiAoIHR5cGVvZiB0cmFuc3BvcnQgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdFx0dHJhbnNwb3J0c1t0cmFuc3BvcnRdID0gdGhpcy50cmFuc3BvcnRzW3RyYW5zcG9ydF07XG5cdFx0XHRcdGNhbGxiYWNrID0gTk9fT1A7XG5cdFx0XHR9XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRpZiAoIHR5cGVvZiB0cmFuc3BvcnQgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdFx0dHJhbnNwb3J0c1t0cmFuc3BvcnRdID0gdGhpcy50cmFuc3BvcnRzW3RyYW5zcG9ydF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0cmFuc3BvcnRzID0gdHJhbnNwb3J0O1xuXHRcdFx0fVxuXHRcdFx0Y2FsbGJhY2sgPSB0YXJnZXQgfHwgTk9fT1A7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHR0cmFuc3BvcnRzID0ge307XG5cdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSBbIHRhcmdldCBdO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdF8uZWFjaCggdHJhbnNwb3J0cywgZnVuY3Rpb24oIHRhcmdldHMsIG5hbWUgKSB7XG5cdFx0XHR0YXJnZXRzID0gdHlwZW9mIHRhcmdldHMgPT09IFwiYm9vbGVhblwiID8gW10gOiB0YXJnZXRzO1xuXHRcdFx0dGhpcy50cmFuc3BvcnRzW25hbWVdLnNpZ25hbFJlYWR5KCB0YXJnZXRzLCBjYWxsYmFjayApO1xuXHRcdH0sIHRoaXMgKTtcblx0fVxufTtcblxuZnVuY3Rpb24gcHJvY2Vzc1NpZ25hbFEoIGFyZ3MgKSB7XG5cdGZlZHguc2lnbmFsUmVhZHkuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc091dGJvdW5kUSggYXJncyApIHtcblx0ZmVkeC5zZW5kLmFwcGx5KCB0aGlzLCBhcmdzICk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NJbmJvdW5kUSggbXNnICkge1xuXHRmZWR4Lm9uRmVkZXJhdGVkTXNnLmNhbGwoIHRoaXMsIG1zZyApO1xufVxuXG5wb3N0YWwuYWRkV2lyZVRhcCggZnVuY3Rpb24oIGRhdGEsIGVudmVsb3BlICkge1xuXHRpZiAoIGZlZHguY2FuU2VuZFJlbW90ZSggZW52ZWxvcGUuY2hhbm5lbCwgZW52ZWxvcGUudG9waWMgKSApIHtcblx0XHRmZWR4LnNlbmRNZXNzYWdlKCBlbnZlbG9wZSApO1xuXHR9XG59ICk7XG5cbnBvc3RhbC5zdWJzY3JpYmUoIHtcblx0Y2hhbm5lbDogcG9zdGFsLmNvbmZpZ3VyYXRpb24uU1lTVEVNX0NIQU5ORUwsXG5cdHRvcGljOiBcImluc3RhbmNlSWQuY2hhbmdlZFwiLFxuXHRjYWxsYmFjazogZnVuY3Rpb24oKSB7XG5cdFx0X3JlYWR5ID0gdHJ1ZTtcblx0XHR3aGlsZSAoIF9zaWduYWxRdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRwcm9jZXNzU2lnbmFsUSggX3NpZ25hbFF1ZXVlLnNoaWZ0KCkgKTtcblx0XHR9XG5cdFx0d2hpbGUgKCBfb3V0Ym91bmRRdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRwcm9jZXNzT3V0Ym91bmRRKCBfb3V0Ym91bmRRdWV1ZS5zaGlmdCgpICk7XG5cdFx0fVxuXHRcdHdoaWxlICggX2luYm91bmRRdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRwcm9jZXNzSW5ib3VuZFEoIF9pbmJvdW5kUXVldWUuc2hpZnQoKSApO1xuXHRcdH1cblx0fVxufSApO1xuXG5pZiAoIHBvc3RhbC5pbnN0YW5jZUlkKCkgIT09IHVuZGVmaW5lZCApIHtcblx0X3JlYWR5ID0gdHJ1ZTtcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzFfXztcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIGV4dGVybmFsIFwiX1wiXG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzJfXztcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIGV4dGVybmFsIFwicG9zdGFsXCJcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9