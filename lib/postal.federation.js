/**
 * postal.federation - A base plugin for federating instances of postal.js across various boundaries.
 * Author: Jim Cowart (http://ifandelse.com)
 * Version: v0.4.0
 * Url: http://github.com/postaljs/postal.federation
 * License(s): (MIT OR GPL-2.0)
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCA1NzE0MzIwMDFhZjkwYzRmMWVkNyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwiX1wiIiwid2VicGFjazovLy9leHRlcm5hbCBcInBvc3RhbFwiIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRCxPO0FDVkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7Ozs7S0N0Q08sQ0FBQyx1Q0FBTSxDQUFROztLQUNmLE1BQU0sdUNBQU0sQ0FBUTs7QUFFM0IsS0FBSyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUc7QUFDekIsUUFBTSxDQUFDLFVBQVUsR0FBRyxZQUFXO0FBQzlCLE9BQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUNYLE9BQU0sU0FBUyxHQUFHLGtCQUFrQixDQUFDO0FBQ3JDLFFBQU0sSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUc7QUFDOUIsS0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBSSxDQUFFLEVBQUUsQ0FBQyxDQUFFLENBQUM7SUFDakU7QUFDRCxJQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDOztBQUVaLElBQUMsQ0FBQyxF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QkFBZ0IsQ0FBRSxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUUsQ0FBQztJQUMzQztBQUNELFVBQVEsYUFBYSxDQUFDLE1BQU0sRUFBRztBQUM5QixtQkFBZSxDQUFFLGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBRSxDQUFDO0lBQ3pDO0dBQ0Q7RUFDRCxDQUFFLENBQUM7O0FBRUosS0FBSyxNQUFNLENBQUMsVUFBVSxFQUFFLEtBQUssU0FBUyxFQUFHO0FBQ3hDLFFBQU0sR0FBRyxJQUFJLENBQUM7RUFDZDs7Ozs7OztBQy9aRCxnRDs7Ozs7O0FDQUEsZ0QiLCJmaWxlIjoicG9zdGFsLmZlZGVyYXRpb24uanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KHJlcXVpcmUoXCJfXCIpLCByZXF1aXJlKFwicG9zdGFsXCIpKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtcIl9cIiwgXCJwb3N0YWxcIl0sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wicG9zdGFsRmVkeFwiXSA9IGZhY3RvcnkocmVxdWlyZShcIl9cIiksIHJlcXVpcmUoXCJwb3N0YWxcIikpO1xuXHRlbHNlXG5cdFx0cm9vdFtcInBvc3RhbEZlZHhcIl0gPSBmYWN0b3J5KHJvb3RbXCJfXCJdLCByb290W1wicG9zdGFsXCJdKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMV9fLCBfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzJfXykge1xucmV0dXJuIFxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svdW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvblxuICoqLyIsIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay9ib290c3RyYXAgNTcxNDMyMDAxYWY5MGM0ZjFlZDdcbiAqKi8iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5pbXBvcnQgcG9zdGFsIGZyb20gXCJwb3N0YWxcIjtcblxuaWYgKCAhcG9zdGFsLmNyZWF0ZVVVSUQgKSB7XG5cdHBvc3RhbC5jcmVhdGVVVUlEID0gZnVuY3Rpb24oKSB7XG5cdFx0bGV0IHMgPSBbXTtcblx0XHRjb25zdCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCAzNjsgaSsrICkge1xuXHRcdFx0c1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAweDEwICksIDEgKTtcblx0XHR9XG5cdFx0c1sxNF0gPSBcIjRcIjsgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG5cdFx0LyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXHRcdHNbMTldID0gaGV4RGlnaXRzLnN1YnN0ciggKCBzWzE5XSAmIDB4MyApIHwgMHg4LCAxICk7IC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG5cdFx0LyoganNoaW50IGlnbm9yZTplbmQgKi9cblx0XHRzWzhdID0gc1sxM10gPSBzWzE4XSA9IHNbMjNdID0gXCItXCI7XG5cdFx0cmV0dXJuIHMuam9pbiggXCJcIiApO1xuXHR9O1xufVxuaWYgKCAhcG9zdGFsLmluc3RhbmNlSWQgKSB7XG5cdHBvc3RhbC5pbnN0YW5jZUlkID0gKCBmdW5jdGlvbigpIHtcblx0XHRsZXQgX2lkLCBfb2xkSWQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBpZCApIHtcblx0XHRcdGlmICggaWQgKSB7XG5cdFx0XHRcdF9vbGRJZCA9IF9pZDtcblx0XHRcdFx0X2lkID0gaWQ7XG5cdFx0XHRcdHBvc3RhbC5wdWJsaXNoKCB7XG5cdFx0XHRcdFx0Y2hhbm5lbDogcG9zdGFsLmNvbmZpZ3VyYXRpb24uU1lTVEVNX0NIQU5ORUwsXG5cdFx0XHRcdFx0dG9waWM6IFwiaW5zdGFuY2VJZC5jaGFuZ2VkXCIsXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0b2xkSWQ6IF9vbGRJZCxcblx0XHRcdFx0XHRcdG5ld0lkOiBfaWRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBfaWQ7XG5cdFx0fTtcblx0fSgpICk7XG59XG5cbmNvbnN0IE5PX09QID0gZnVuY3Rpb24oKSB7fTtcbmxldCBfcmVhZHkgPSBmYWxzZTtcbmxldCBfaW5ib3VuZFF1ZXVlID0gW107XG5sZXQgX291dGJvdW5kUXVldWUgPSBbXTtcbmxldCBfc2lnbmFsUXVldWUgPSBbXTtcbmNvbnN0IF9kZWZhdWx0cyA9IHtcblx0ZW5hYmxlZDogdHJ1ZSxcblx0ZmlsdGVyTW9kZTogXCJ3aGl0ZWxpc3RcIixcblx0ZmlsdGVyRGlyZWN0aW9uOiBcImJvdGhcIlxufTtcbmxldCBfY29uZmlnID0gX2RlZmF1bHRzO1xuZnVuY3Rpb24gX21hdGNoZXNGaWx0ZXIoIGNoYW5uZWwsIHRvcGljLCBkaXJlY3Rpb24gKSB7XG5cdGNvbnN0IGNoYW5uZWxQcmVzZW50ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBmZWR4LmZpbHRlcnNbZGlyZWN0aW9uXSwgY2hhbm5lbCApO1xuXHRjb25zdCB0b3BpY01hdGNoID0gKCBjaGFubmVsUHJlc2VudCAmJiBfLmFueSggZmVkeC5maWx0ZXJzW2RpcmVjdGlvbl1bY2hhbm5lbF0sIGZ1bmN0aW9uKCBiaW5kaW5nICkge1xuXHRcdHJldHVybiBwb3N0YWwuY29uZmlndXJhdGlvbi5yZXNvbHZlci5jb21wYXJlKCBiaW5kaW5nLCB0b3BpYyApO1xuXHR9ICkgKTtcblx0Y29uc3QgYmxhY2tsaXN0aW5nID0gX2NvbmZpZy5maWx0ZXJNb2RlID09PSBcImJsYWNrbGlzdFwiO1xuXHRyZXR1cm4gX2NvbmZpZy5lbmFibGVkICYmICggKCBibGFja2xpc3RpbmcgJiYgKCAhY2hhbm5lbFByZXNlbnQgfHwgKCBjaGFubmVsUHJlc2VudCAmJiAhdG9waWNNYXRjaCApICkgKSB8fCAoICFibGFja2xpc3RpbmcgJiYgY2hhbm5lbFByZXNlbnQgJiYgdG9waWNNYXRjaCApICk7XG59O1xuXG5jb25zdCBwYWNraW5nU2xpcHMgPSB7XG5cdHBpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ucGluZ1wiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHRpY2tldDogcG9zdGFsLmNyZWF0ZVVVSUQoKVxuXHRcdH07XG5cdH0sXG5cdHBvbmc6IGZ1bmN0aW9uKCBwaW5nICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ucG9uZ1wiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHBpbmdEYXRhOiB7XG5cdFx0XHRcdGluc3RhbmNlSWQ6IHBpbmcuaW5zdGFuY2VJZCxcblx0XHRcdFx0dGltZVN0YW1wOiBwaW5nLnRpbWVTdGFtcCxcblx0XHRcdFx0dGlja2V0OiBwaW5nLnRpY2tldFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cdG1lc3NhZ2U6IGZ1bmN0aW9uKCBlbnYgKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5tZXNzYWdlXCIsXG5cdFx0XHRpbnN0YW5jZUlkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0dGltZVN0YW1wOiBuZXcgRGF0ZSgpLFxuXHRcdFx0ZW52ZWxvcGU6IGVudlxuXHRcdH07XG5cdH0sXG5cdGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24uZGlzY29ubmVjdFwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKVxuXHRcdH07XG5cdH0sXG5cdGJ1bmRsZTogZnVuY3Rpb24oIHBhY2tpbmdTbGlwcyApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLmJ1bmRsZVwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHBhY2tpbmdTbGlwczogcGFja2luZ1NsaXBzXG5cdFx0fTtcblx0fVxufTtcbmNvbnN0IGhhbmRsZXJzID0ge1xuXHRcImZlZGVyYXRpb24ucGluZ1wiOiBmdW5jdGlvbiggZGF0YSAvKiwgY2FsbGJhY2sgKi8gKSB7XG5cdFx0ZGF0YS5zb3VyY2Uuc2V0SW5zdGFuY2VJZCggZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICk7XG5cdFx0aWYgKCBkYXRhLnNvdXJjZS5oYW5kc2hha2VDb21wbGV0ZSApIHtcblx0XHRcdGRhdGEuc291cmNlLnNlbmRQb25nKCBkYXRhLnBhY2tpbmdTbGlwICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRhdGEuc291cmNlLnNlbmRCdW5kbGUoIFtcblx0XHRcdGZlZHguZ2V0UGFja2luZ1NsaXAoIFwicG9uZ1wiLCBkYXRhLnBhY2tpbmdTbGlwICksXG5cdFx0XHRmZWR4LmdldFBhY2tpbmdTbGlwKCBcInBpbmdcIiApXG5cdFx0XHRdICk7XG5cdFx0fVxuXHR9LFxuXHRcImZlZGVyYXRpb24ucG9uZ1wiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRkYXRhLnNvdXJjZS5oYW5kc2hha2VDb21wbGV0ZSA9IHRydWU7XG5cdFx0ZGF0YS5zb3VyY2Uuc2V0SW5zdGFuY2VJZCggZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICk7XG5cdFx0aWYgKCBkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0gKSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0uY2FsbGJhY2soIHtcblx0XHRcdFx0dGlja2V0OiBkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldCxcblx0XHRcdFx0aW5zdGFuY2VJZDogZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkLFxuXHRcdFx0XHRzb3VyY2U6IGRhdGEuc291cmNlXG5cdFx0XHR9ICk7XG5cdFx0XHRkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0gPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGlmICggIV8uY29udGFpbnMoIGZlZHguY2xpZW50cywgZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICkgKSB7XG5cdFx0XHRmZWR4LmNsaWVudHMucHVzaCggZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICk7XG5cdFx0fVxuXHRcdHBvc3RhbC5wdWJsaXNoKCB7XG5cdFx0XHRjaGFubmVsOiBcInBvc3RhbC5mZWRlcmF0aW9uXCIsXG5cdFx0XHR0b3BpYzogXCJjbGllbnQuZmVkZXJhdGVkXCIsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHJlbW90ZUlkOiBkYXRhLnNvdXJjZS5pbnN0YW5jZUlkLFxuXHRcdFx0XHRsb2NhbElkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0XHR0cmFuc3BvcnQ6IGRhdGEudHJhbnNwb3J0XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXHRcImZlZGVyYXRpb24uZGlzY29ubmVjdFwiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRmZWR4LmNsaWVudHMgPSBfLndpdGhvdXQoIGZlZHguY2xpZW50cywgZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCApO1xuXHRcdGZlZHguZGlzY29ubmVjdCgge1xuXHRcdFx0dHJhbnNwb3J0OiBkYXRhLnNvdXJjZS50cmFuc3BvcnROYW1lLFxuXHRcdFx0aW5zdGFuY2VJZDogZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCxcblx0XHRcdGRvTm90Tm90aWZ5OiB0cnVlXG5cdFx0fSApO1xuXHR9LFxuXHRcImZlZGVyYXRpb24ubWVzc2FnZVwiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRjb25zdCBlbnYgPSBkYXRhLnBhY2tpbmdTbGlwLmVudmVsb3BlO1xuXHRcdGlmICggX21hdGNoZXNGaWx0ZXIoIGVudi5jaGFubmVsLCBlbnYudG9waWMsIFwiaW5cIiApICkge1xuXHRcdFx0ZW52Lmxhc3RTZW5kZXIgPSBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQ7XG5cdFx0XHRwb3N0YWwucHVibGlzaCggZW52ICk7XG5cdFx0fVxuXHR9LFxuXHRcImZlZGVyYXRpb24uYnVuZGxlXCI6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdF8uZWFjaCggZGF0YS5wYWNraW5nU2xpcC5wYWNraW5nU2xpcHMsIGZ1bmN0aW9uKCBzbGlwICkge1xuXHRcdFx0ZmVkeC5vbkZlZGVyYXRlZE1zZyggXy5leHRlbmQoIHt9LCBkYXRhLCB7XG5cdFx0XHRcdHBhY2tpbmdTbGlwOiBzbGlwXG5cdFx0XHR9ICkgKTtcblx0XHR9ICk7XG5cdH1cbn07XG5cbmZ1bmN0aW9uIEZlZGVyYXRpb25DbGllbnQoIHRhcmdldCwgb3B0aW9ucywgaW5zdGFuY2VJZCApIHtcblx0dGhpcy50YXJnZXQgPSB0YXJnZXQ7XG5cdHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdHRoaXMucGluZ3MgPSB7fTtcblx0dGhpcy5pbnN0YW5jZUlkID0gaW5zdGFuY2VJZDtcblx0dGhpcy5oYW5kc2hha2VDb21wbGV0ZSA9IGZhbHNlO1xufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUuc2VuZFBpbmcgPSBmdW5jdGlvbiggY2FsbGJhY2sgKSB7XG5cdGNvbnN0IHBhY2tpbmdTbGlwID0gZmVkeC5nZXRQYWNraW5nU2xpcCggXCJwaW5nXCIgKTtcblx0dGhpcy5waW5nc1twYWNraW5nU2xpcC50aWNrZXRdID0ge1xuXHRcdHRpY2tldDogcGFja2luZ1NsaXAudGlja2V0LFxuXHRcdGNhbGxiYWNrOiBjYWxsYmFjayB8fCBOT19PUFxuXHR9O1xuXHR0aGlzLnNlbmQoIHBhY2tpbmdTbGlwICk7XG59O1xuXG5GZWRlcmF0aW9uQ2xpZW50LnByb3RvdHlwZS5zZW5kUG9uZyA9IGZ1bmN0aW9uKCBvcmlnUGFja2luZ1NsaXAgKSB7XG5cdHRoaXMuc2VuZCggZmVkeC5nZXRQYWNraW5nU2xpcCggXCJwb25nXCIsIG9yaWdQYWNraW5nU2xpcCApICk7XG59O1xuXG5GZWRlcmF0aW9uQ2xpZW50LnByb3RvdHlwZS5zZW5kQnVuZGxlID0gZnVuY3Rpb24oIHNsaXBzICkge1xuXHR0aGlzLnNlbmQoIGZlZHguZ2V0UGFja2luZ1NsaXAoIFwiYnVuZGxlXCIsIHNsaXBzICkgKTtcbn07XG5cbkZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlLnNlbmRNZXNzYWdlID0gZnVuY3Rpb24oIGVudmVsb3BlICkge1xuXHRpZiAoICF0aGlzLmhhbmRzaGFrZUNvbXBsZXRlICkge1xuXHRcdHJldHVybjtcblx0fVxuXHRlbnZlbG9wZS5vcmlnaW5JZCA9IGVudmVsb3BlLm9yaWdpbklkIHx8IHBvc3RhbC5pbnN0YW5jZUlkKCk7XG5cdGNvbnN0IGVudiA9IF8uY2xvbmUoIGVudmVsb3BlICk7XG5cdGlmICggdGhpcy5pbnN0YW5jZUlkICYmIHRoaXMuaW5zdGFuY2VJZCAhPT0gZW52Lmxhc3RTZW5kZXIgJiZcblx0KCAhZW52Lmtub3duSWRzIHx8ICFlbnYua25vd25JZHMubGVuZ3RoIHx8XG5cdCggZW52Lmtub3duSWRzICYmICFfLmluY2x1ZGUoIGVudi5rbm93bklkcywgdGhpcy5pbnN0YW5jZUlkICkgKSApXG5cdCkge1xuXHRcdGVudi5rbm93bklkcyA9ICggZW52Lmtub3duSWRzIHx8IFtdICkuY29uY2F0KCBfLndpdGhvdXQoIGZlZHguY2xpZW50cywgdGhpcy5pbnN0YW5jZUlkICkgKTtcblx0XHR0aGlzLnNlbmQoIGZlZHguZ2V0UGFja2luZ1NsaXAoIFwibWVzc2FnZVwiLCBlbnYgKSApO1xuXHR9XG59O1xuXG5GZWRlcmF0aW9uQ2xpZW50LnByb3RvdHlwZS5kaXNjb25uZWN0ID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMuc2VuZCggZmVkeC5nZXRQYWNraW5nU2xpcCggXCJkaXNjb25uZWN0XCIgKSApO1xufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUub25NZXNzYWdlID0gZnVuY3Rpb24oIHBhY2tpbmdTbGlwICkge1xuXHRpZiAoIHRoaXMuc2hvdWxkUHJvY2VzcygpICkge1xuXHRcdGZlZHgub25GZWRlcmF0ZWRNc2coIHtcblx0XHRcdHRyYW5zcG9ydDogdGhpcy50cmFuc3BvcnROYW1lLFxuXHRcdFx0cGFja2luZ1NsaXA6IHBhY2tpbmdTbGlwLFxuXHRcdFx0c291cmNlOiB0aGlzXG5cdFx0fSApO1xuXHR9XG59O1xuXG5GZWRlcmF0aW9uQ2xpZW50LnByb3RvdHlwZS5zaG91bGRQcm9jZXNzID0gZnVuY3Rpb24oKSB7XG5cdHJldHVybiB0cnVlO1xufTtcblxuRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKCAvKiBtc2cgKi8gKSB7XG5cdHRocm93IG5ldyBFcnJvciggXCJBbiBvYmplY3QgZGVyaXZpbmcgZnJvbSBGZWRlcmF0aW9uQ2xpZW50IG11c3QgcHJvdmlkZSBhbiBpbXBsZW1lbnRhdGlvbiBmb3IgJ3NlbmQnLlwiICk7XG59O1xuXG5GZWRlcmF0aW9uQ2xpZW50LnByb3RvdHlwZS5zZXRJbnN0YW5jZUlkID0gZnVuY3Rpb24oIGlkICkge1xuXHR0aGlzLmluc3RhbmNlSWQgPSBpZDtcbn07XG5cbkZlZGVyYXRpb25DbGllbnQuZXh0ZW5kID0gZnVuY3Rpb24oIHByb3BzLCBjdHJQcm9wcyApIHtcblx0ZnVuY3Rpb24gRmVkWENsaWVudCgpIHtcblx0XHRGZWRlcmF0aW9uQ2xpZW50LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0fVxuXG5cdEZlZFhDbGllbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUgKTtcblx0Xy5leHRlbmQoIEZlZFhDbGllbnQucHJvdG90eXBlLCBwcm9wcyApO1xuXHRfLmV4dGVuZCggRmVkWENsaWVudCwgY3RyUHJvcHMgKTtcblxuXHRyZXR1cm4gRmVkWENsaWVudDtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGZlZHggPSBwb3N0YWwuZmVkeCA9IHtcblx0RmVkZXJhdGlvbkNsaWVudDogRmVkZXJhdGlvbkNsaWVudCxcblx0cGFja2luZ1NsaXBzOiBwYWNraW5nU2xpcHMsXG5cdGhhbmRsZXJzOiBoYW5kbGVycyxcblx0Y2xpZW50czogW10sXG5cdHRyYW5zcG9ydHM6IHt9LFxuXHRmaWx0ZXJzOiB7XG5cdFx0XCJpblwiOiB7fSwgLy8ganNjczppZ25vcmUgZGlzYWxsb3dRdW90ZWRLZXlzSW5PYmplY3RzXG5cdFx0b3V0OiB7fVxuXHR9LFxuXHRhZGRGaWx0ZXI6IGZ1bmN0aW9uKCBmaWx0ZXJzICkge1xuXHRcdGZpbHRlcnMgPSBfLmlzQXJyYXkoIGZpbHRlcnMgKSA/IGZpbHRlcnMgOiBbIGZpbHRlcnMgXTtcblx0XHRfLmVhY2goIGZpbHRlcnMsIGZ1bmN0aW9uKCBmaWx0ZXIgKSB7XG5cdFx0XHRmaWx0ZXIuZGlyZWN0aW9uID0gZmlsdGVyLmRpcmVjdGlvbiB8fCBfY29uZmlnLmZpbHRlckRpcmVjdGlvbjtcblx0XHRcdF8uZWFjaCggKCBmaWx0ZXIuZGlyZWN0aW9uID09PSBcImJvdGhcIiApID8gWyBcImluXCIsIFwib3V0XCIgXSA6IFsgZmlsdGVyLmRpcmVjdGlvbiBdLCBmdW5jdGlvbiggZGlyICkge1xuXHRcdFx0XHRpZiAoICF0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0gKSB7XG5cdFx0XHRcdFx0dGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdID0gWyBmaWx0ZXIudG9waWMgXTtcblx0XHRcdFx0fSBlbHNlIGlmICggISggXy5pbmNsdWRlKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0sIGZpbHRlci50b3BpYyApICkgKSB7XG5cdFx0XHRcdFx0dGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLnB1c2goIGZpbHRlci50b3BpYyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9LFxuXHRyZW1vdmVGaWx0ZXI6IGZ1bmN0aW9uKCBmaWx0ZXJzICkge1xuXHRcdGZpbHRlcnMgPSBfLmlzQXJyYXkoIGZpbHRlcnMgKSA/IGZpbHRlcnMgOiBbIGZpbHRlcnMgXTtcblx0XHRfLmVhY2goIGZpbHRlcnMsIGZ1bmN0aW9uKCBmaWx0ZXIgKSB7XG5cdFx0XHRmaWx0ZXIuZGlyZWN0aW9uID0gZmlsdGVyLmRpcmVjdGlvbiB8fCBfY29uZmlnLmZpbHRlckRpcmVjdGlvbjtcblx0XHRcdF8uZWFjaCggKCBmaWx0ZXIuZGlyZWN0aW9uID09PSBcImJvdGhcIiApID8gWyBcImluXCIsIFwib3V0XCIgXSA6IFsgZmlsdGVyLmRpcmVjdGlvbiBdLCBmdW5jdGlvbiggZGlyICkge1xuXHRcdFx0XHRpZiAoIHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSAmJiBfLmluY2x1ZGUoIHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSwgZmlsdGVyLnRvcGljICkgKSB7XG5cdFx0XHRcdFx0dGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdID0gXy53aXRob3V0KCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0sIGZpbHRlci50b3BpYyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9LFxuXHRjYW5TZW5kUmVtb3RlOiBmdW5jdGlvbiggY2hhbm5lbCwgdG9waWMgKSB7XG5cdFx0cmV0dXJuIF9tYXRjaGVzRmlsdGVyKCBjaGFubmVsLCB0b3BpYywgXCJvdXRcIiApO1xuXHR9LFxuXHRjb25maWd1cmU6IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdFx0aWYgKCBjZmcgJiYgY2ZnLmZpbHRlck1vZGUgJiYgY2ZnLmZpbHRlck1vZGUgIT09IFwiYmxhY2tsaXN0XCIgJiYgY2ZnLmZpbHRlck1vZGUgIT09IFwid2hpdGVsaXN0XCIgKSB7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoIFwicG9zdGFsLmZlZHggZmlsdGVyTW9kZSBtdXN0IGJlICdibGFja2xpc3QnIG9yICd3aGl0ZWxpc3QnLlwiICk7XG5cdFx0fVxuXHRcdGlmICggY2ZnICkge1xuXHRcdFx0X2NvbmZpZyA9IF8uZGVmYXVsdHMoIGNmZywgX2RlZmF1bHRzICk7XG5cdFx0fVxuXHRcdHJldHVybiBfY29uZmlnO1xuXHR9LFxuXHRnZXRQYWNraW5nU2xpcDogZnVuY3Rpb24oIHR5cGUgLyosIGVudiAqLyApIHtcblx0XHRpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggcGFja2luZ1NsaXBzLCB0eXBlICkgKSB7XG5cdFx0XHRyZXR1cm4gcGFja2luZ1NsaXBzW3R5cGVdLmFwcGx5KCB0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICkgKTtcblx0XHR9XG5cdH0sXG5cdG9uRmVkZXJhdGVkTXNnOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRpZiAoICFfcmVhZHkgKSB7XG5cdFx0XHRfaW5ib3VuZFF1ZXVlLnB1c2goIGRhdGEgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0aWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGhhbmRsZXJzLCBkYXRhLnBhY2tpbmdTbGlwLnR5cGUgKSApIHtcblx0XHRcdGhhbmRsZXJzW2RhdGEucGFja2luZ1NsaXAudHlwZV0oIGRhdGEgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKCBcInBvc3RhbC5mZWRlcmF0aW9uIGRvZXMgbm90IGhhdmUgYSBtZXNzYWdlIGhhbmRsZXIgZm9yICdcIiArIGRhdGEucGFja2luZ1NsaXAudHlwZSArIFwiJy5cIiApO1xuXHRcdH1cblx0fSxcblx0c2VuZE1lc3NhZ2U6IGZ1bmN0aW9uKCBlbnZlbG9wZSApIHtcblx0XHRpZiAoICFfcmVhZHkgKSB7XG5cdFx0XHRfb3V0Ym91bmRRdWV1ZS5wdXNoKCBhcmd1bWVudHMgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Xy5lYWNoKCB0aGlzLnRyYW5zcG9ydHMsIGZ1bmN0aW9uKCB0cmFuc3BvcnQgKSB7XG5cdFx0XHR0cmFuc3BvcnQuc2VuZE1lc3NhZ2UoIGVudmVsb3BlICk7XG5cdFx0fSApO1xuXHR9LFxuXHRkaXNjb25uZWN0OiBmdW5jdGlvbiggb3B0aW9ucyApIHtcblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0XHRsZXQgdHJhbnNwb3J0cyA9IHRoaXMudHJhbnNwb3J0cztcblx0XHRpZiAoIG9wdGlvbnMudHJhbnNwb3J0ICkge1xuXHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0dHJhbnNwb3J0c1tvcHRpb25zLnRyYW5zcG9ydF0gPSB0aGlzLnRyYW5zcG9ydHNbb3B0aW9ucy50cmFuc3BvcnRdO1xuXHRcdH1cblx0XHRfLmVhY2goIHRyYW5zcG9ydHMsIGZ1bmN0aW9uKCB0cmFuc3BvcnQgKSB7XG5cdFx0XHR0cmFuc3BvcnQuZGlzY29ubmVjdCgge1xuXHRcdFx0XHR0YXJnZXQ6IG9wdGlvbnMudGFyZ2V0LFxuXHRcdFx0XHRpbnN0YW5jZUlkOiBvcHRpb25zLmluc3RhbmNlSWQsXG5cdFx0XHRcdGRvTm90Tm90aWZ5OiAhIW9wdGlvbnMuZG9Ob3ROb3RpZnlcblx0XHRcdH0gKTtcblx0XHR9LCB0aGlzICk7XG5cdH0sXG5cdF9nZXRUcmFuc3BvcnRzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5yZWR1Y2UoIHRoaXMudHJhbnNwb3J0cywgZnVuY3Rpb24oIG1lbW8sIHRyYW5zcG9ydCwgbmFtZSApIHtcblx0XHRcdG1lbW9bbmFtZV0gPSB0cnVlO1xuXHRcdFx0cmV0dXJuIG1lbW87XG5cdFx0fSwge30gKTtcblx0fSxcblx0Lypcblx0XHRzaWduYWxSZWFkeSggY2FsbGJhY2sgKTtcblx0XHRzaWduYWxSZWFkeSggXCJ0cmFuc3BvcnROYW1lXCIgKTtcblx0XHRzaWduYWxSZWFkeSggXCJ0cmFuc3BvcnROYW1lXCIsIGNhbGxiYWNrICk7XG5cdFx0c2lnbmFsUmVhZHkoIFwidHJhbnNwb3J0TmFtZVwiLCB0YXJnZXRJbnN0YW5jZSwgY2FsbGJhY2sgKTsgPC0tIHRoaXMgaXMgTkVXXG5cdFx0c2lnbmFsUmVhZHkoIHsgdHJhbnNwb3J0TmFtZUE6IHRhcmdldHNGb3JBLCB0cmFuc3BvcnROYW1lQjogdGFyZ2V0c0ZvckIsIHRyYW5zcG9ydEM6IHRydWUgfSwgY2FsbGJhY2spO1xuXHQqL1xuXHRzaWduYWxSZWFkeTogZnVuY3Rpb24oIHRyYW5zcG9ydCwgdGFyZ2V0LCBjYWxsYmFjayApIHtcblx0XHRpZiAoICFfcmVhZHkgKSB7XG5cdFx0XHRfc2lnbmFsUXVldWUucHVzaCggYXJndW1lbnRzICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGxldCB0cmFuc3BvcnRzID0gdGhpcy5fZ2V0VHJhbnNwb3J0cygpO1xuXHRcdHN3aXRjaCAoIGFyZ3VtZW50cy5sZW5ndGggKSB7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0aWYgKCB0eXBlb2YgdHJhbnNwb3J0ID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gdHJhbnNwb3J0O1xuXHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSB0aGlzLnRyYW5zcG9ydHNbdHJhbnNwb3J0XTtcblx0XHRcdFx0Y2FsbGJhY2sgPSBOT19PUDtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMjpcblx0XHRcdGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSB0aGlzLnRyYW5zcG9ydHNbdHJhbnNwb3J0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRyYW5zcG9ydHMgPSB0cmFuc3BvcnQ7XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjayA9IHRhcmdldCB8fCBOT19PUDtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdHRyYW5zcG9ydHNbdHJhbnNwb3J0XSA9IFsgdGFyZ2V0IF07XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdFx0Xy5lYWNoKCB0cmFuc3BvcnRzLCBmdW5jdGlvbiggdGFyZ2V0cywgbmFtZSApIHtcblx0XHRcdHRhcmdldHMgPSB0eXBlb2YgdGFyZ2V0cyA9PT0gXCJib29sZWFuXCIgPyBbXSA6IHRhcmdldHM7XG5cdFx0XHR0aGlzLnRyYW5zcG9ydHNbbmFtZV0uc2lnbmFsUmVhZHkoIHRhcmdldHMsIGNhbGxiYWNrICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBwcm9jZXNzU2lnbmFsUSggYXJncyApIHtcblx0ZmVkeC5zaWduYWxSZWFkeS5hcHBseSggdGhpcywgYXJncyApO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzT3V0Ym91bmRRKCBhcmdzICkge1xuXHRmZWR4LnNlbmQuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0luYm91bmRRKCBtc2cgKSB7XG5cdGZlZHgub25GZWRlcmF0ZWRNc2cuY2FsbCggdGhpcywgbXNnICk7XG59XG5cbnBvc3RhbC5hZGRXaXJlVGFwKCBmdW5jdGlvbiggZGF0YSwgZW52ZWxvcGUgKSB7XG5cdGlmICggZmVkeC5jYW5TZW5kUmVtb3RlKCBlbnZlbG9wZS5jaGFubmVsLCBlbnZlbG9wZS50b3BpYyApICkge1xuXHRcdGZlZHguc2VuZE1lc3NhZ2UoIGVudmVsb3BlICk7XG5cdH1cbn0gKTtcblxucG9zdGFsLnN1YnNjcmliZSgge1xuXHRjaGFubmVsOiBwb3N0YWwuY29uZmlndXJhdGlvbi5TWVNURU1fQ0hBTk5FTCxcblx0dG9waWM6IFwiaW5zdGFuY2VJZC5jaGFuZ2VkXCIsXG5cdGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcblx0XHRfcmVhZHkgPSB0cnVlO1xuXHRcdHdoaWxlICggX3NpZ25hbFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NTaWduYWxRKCBfc2lnbmFsUXVldWUuc2hpZnQoKSApO1xuXHRcdH1cblx0XHR3aGlsZSAoIF9vdXRib3VuZFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NPdXRib3VuZFEoIF9vdXRib3VuZFF1ZXVlLnNoaWZ0KCkgKTtcblx0XHR9XG5cdFx0d2hpbGUgKCBfaW5ib3VuZFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NJbmJvdW5kUSggX2luYm91bmRRdWV1ZS5zaGlmdCgpICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cbmlmICggcG9zdGFsLmluc3RhbmNlSWQoKSAhPT0gdW5kZWZpbmVkICkge1xuXHRfcmVhZHkgPSB0cnVlO1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvaW5kZXguanNcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMV9fO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogZXh0ZXJuYWwgXCJfXCJcbiAqKiBtb2R1bGUgaWQgPSAxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMl9fO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogZXh0ZXJuYWwgXCJwb3N0YWxcIlxuICoqIG1vZHVsZSBpZCA9IDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=