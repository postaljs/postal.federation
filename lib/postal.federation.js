/*!
 *  * postal.federation - A base plugin for federating instances of postal.js across various boundaries.
 *  * Author: Jim Cowart (http://ifandelse.com)
 *  * Version: v0.5.0
 *  * Url: http://github.com/postaljs/postal.federation
 *  * License(s): (MIT OR GPL-2.0)
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("lodash"), require("postal"));
	else if(typeof define === 'function' && define.amd)
		define(["lodash", "postal"], factory);
	else if(typeof exports === 'object')
		exports["postalFedx"] = factory(require("lodash"), require("postal"));
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
	
	__webpack_require__(3);
	
	var _packingSlips = __webpack_require__(4);
	
	var packingSlips = _packingSlips.packingSlips;
	var getPackingSlip = _packingSlips.getPackingSlip;
	
	var _state = __webpack_require__(5);
	
	var state = _state.state;
	var disconnect = _state.disconnect;
	
	var _handlers = __webpack_require__(6);
	
	var handlers = _handlers.handlers;
	var onFederatedMsg = _handlers.onFederatedMsg;
	var _matchesFilter = _handlers._matchesFilter;
	
	var FederationClient = _interopRequire(__webpack_require__(7));
	
	var NO_OP = function NO_OP() {};
	
	module.exports = fedx = postal.fedx = {
		FederationClient: FederationClient,
		packingSlips: packingSlips,
		handlers: handlers,
		clients: state._clients,
		transports: state._transports,
		filters: {
			"in": {}, // jscs:ignore disallowQuotedKeysInObjects
			out: {}
		},
		addFilter: function addFilter(filters) {
			filters = _.isArray(filters) ? filters : [filters];
			_.each(filters, function (filter) {
				filter.direction = filter.direction || state._config.filterDirection;
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
				filter.direction = filter.direction || state._config.filterDirection;
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
		getPackingSlip: getPackingSlip,
		onFederatedMsg: onFederatedMsg,
		sendMessage: function sendMessage(envelope) {
			if (!state._ready) {
				state._outboundQueue.push(arguments);
				return;
			}
			_.each(this.transports, function (transport) {
				transport.sendMessage(envelope);
			});
		},
		disconnect: disconnect,
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
			if (!state._ready) {
				state._signalQueue.push(arguments);
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
			state._ready = true;
			while (state._signalQueue.length) {
				processSignalQ(state._signalQueue.shift());
			}
			while (state._outboundQueue.length) {
				processOutboundQ(state._outboundQueue.shift());
			}
			while (state._inboundQueue.length) {
				processInboundQ(state._inboundQueue.shift());
			}
		}
	});
	
	if (postal.instanceId() !== undefined) {
		state._ready = true;
	}

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	// istanbul ignore next
	
	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };
	
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

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	// istanbul ignore next
	
	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };
	
	exports.getPackingSlip = getPackingSlip;
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var postal = _interopRequire(__webpack_require__(2));
	
	function getPackingSlip(type /*, env */) {
		if (Object.prototype.hasOwnProperty.call(packingSlips, type)) {
			return packingSlips[type].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
	
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
	exports.packingSlips = packingSlips;

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	// istanbul ignore next
	
	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };
	
	exports.configure = configure;
	exports.disconnect = disconnect;
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var _ = _interopRequire(__webpack_require__(1));
	
	var _defaults = {
		enabled: true,
		filterMode: "whitelist",
		filterDirection: "both"
	};
	
	var state = {
		_clients: [],
		_transports: {},
		_ready: false,
		_inboundQueue: [],
		_outboundQueue: [],
		_signalQueue: [],
		_config: _defaults
	};
	
	exports.state = state;
	
	function configure(cfg) {
		if (cfg && cfg.filterMode && cfg.filterMode !== "blacklist" && cfg.filterMode !== "whitelist") {
			throw new Error("postal.fedx filterMode must be 'blacklist' or 'whitelist'.");
		}
		if (cfg) {
			state._config = _.defaults(cfg, _defaults);
		}
		return state._config;
	}
	
	function disconnect(options) {
		options = options || {};
		var trans = state._transports;
		if (options.transport) {
			trans = {};
			trans[options.transport] = state._transports[options.transport];
		}
		_.each(trans, function (t) {
			t.disconnect({
				target: options.target,
				instanceId: options.instanceId,
				doNotNotify: !!options.doNotNotify
			});
		});
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	exports._matchesFilter = _matchesFilter;
	exports.onFederatedMsg = onFederatedMsg;
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var getPackingSlip = __webpack_require__(4).getPackingSlip;
	
	var _state = __webpack_require__(5);
	
	var state = _state.state;
	var disconnect = _state.disconnect;
	
	function _matchesFilter(channel, topic, direction) {
		var channelPresent = Object.prototype.hasOwnProperty.call(fedx.filters[direction], channel);
		var topicMatch = channelPresent && _.any(fedx.filters[direction][channel], function (binding) {
			return postal.configuration.resolver.compare(binding, topic);
		});
		var blacklisting = state._config.filterMode === "blacklist";
		return state._config.enabled && (blacklisting && (!channelPresent || channelPresent && !topicMatch) || !blacklisting && channelPresent && topicMatch);
	}
	
	var handlers = {
		"federation.ping": function federationPing(data /*, callback */) {
			data.source.setInstanceId(data.packingSlip.instanceId);
			if (data.source.handshakeComplete) {
				data.source.sendPong(data.packingSlip);
			} else {
				data.source.sendBundle([getPackingSlip("pong", data.packingSlip), getPackingSlip("ping")]);
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
			if (!_.contains(state._clients, data.packingSlip.instanceId)) {
				state._clients.push(data.packingSlip.instanceId);
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
			state._clients = _.without(state._clients, data.source.instanceId);
			disconnect({
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
				onFederatedMsg(_.extend({}, data, {
					packingSlip: slip
				}));
			});
		}
	};
	
	exports.handlers = handlers;
	
	function onFederatedMsg(data) {
		if (!state._ready) {
			state._inboundQueue.push(data);
			return;
		}
		if (Object.prototype.hasOwnProperty.call(handlers, data.packingSlip.type)) {
			handlers[data.packingSlip.type](data);
		} else {
			throw new Error("postal.federation does not have a message handler for '" + data.packingSlip.type + "'.");
		}
	}

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	// istanbul ignore next
	
	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };
	
	// istanbul ignore next
	
	var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	// istanbul ignore next
	
	var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };
	
	var getPackingSlip = __webpack_require__(4).getPackingSlip;
	
	var onFederatedMsg = __webpack_require__(6).onFederatedMsg;
	
	var state = __webpack_require__(5).state;
	
	var postal = _interopRequire(__webpack_require__(2));
	
	var FederationClient = (function () {
		function FederationClient(target, options, instanceId) {
			_classCallCheck(this, FederationClient);
	
			this.target = target;
			this.options = options || {};
			this.pings = {};
			this.instanceId = instanceId;
			this.handshakeComplete = false;
		}
	
		_createClass(FederationClient, {
			sendPing: {
				value: function sendPing(callback) {
					var packingSlip = getPackingSlip("ping");
					this.pings[packingSlip.ticket] = {
						ticket: packingSlip.ticket,
						callback: callback || NO_OP
					};
					this.send(packingSlip);
				}
			},
			sendPong: {
				value: function sendPong(origPackingSlip) {
					this.send(getPackingSlip("pong", origPackingSlip));
				}
			},
			sendBundle: {
				value: function sendBundle(slips) {
					this.send(getPackingSlip("bundle", slips));
				}
			},
			sendMessage: {
				value: function sendMessage(envelope) {
					if (!this.handshakeComplete) {
						return;
					}
					envelope.originId = envelope.originId || postal.instanceId();
					var env = _.clone(envelope);
					if (this.instanceId && this.instanceId !== env.lastSender && (!env.knownIds || !env.knownIds.length || env.knownIds && !_.include(env.knownIds, this.instanceId))) {
						env.knownIds = (env.knownIds || []).concat(_.without(state._clients, this.instanceId));
						this.send(getPackingSlip("message", env));
					}
				}
			},
			disconnect: {
				value: function disconnect() {
					this.send(getPackingSlip("disconnect"));
				}
			},
			onMessage: {
				value: function onMessage(packingSlip) {
					if (this.shouldProcess()) {
						onFederatedMsg({
							transport: this.transportName,
							packingSlip: packingSlip,
							source: this
						});
					}
				}
			},
			shouldProcess: {
				value: function shouldProcess() {
					return true;
				}
			},
			send: {
				value: function send() {
					throw new Error("An object deriving from FederationClient must provide an implementation for 'send'.");
				}
			},
			setInstanceId: {
				value: function setInstanceId(id) {
					this.instanceId = id;
				}
			}
		}, {
			extend: {
				value: function extend(props, ctrProps) {
					function FedXClient() {
						FederationClient.apply(this, arguments);
					}
	
					FedXClient.prototype = Object.create(FederationClient.prototype);
					_.extend(FedXClient.prototype, props);
					_.extend(FedXClient, ctrProps);
	
					return FedXClient;
				}
			}
		});
	
		return FederationClient;
	})();
	
	module.exports = FederationClient;
	/* msg */

/***/ }
/******/ ])
});
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCBkNmI2ZjA4NmNkNzY0N2ViNGRlMiIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInJvb3RcIjpcIl9cIixcImNvbW1vbmpzXCI6XCJsb2Rhc2hcIixcImNvbW1vbmpzMlwiOlwibG9kYXNoXCIsXCJhbWRcIjpcImxvZGFzaFwifSIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJwb3N0YWxcIiIsIndlYnBhY2s6Ly8vLi9zcmMvcG9zdGFsLXV0aWxzLmpzIiwid2VicGFjazovLy8uL3NyYy9wYWNraW5nU2xpcHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0YXRlLmpzIiwid2VicGFjazovLy8uL3NyYy9oYW5kbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvRmVkZXJhdGlvbkNsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7OztLQ3RDTyxDQUFDLHVDQUFNLENBQVE7O0tBQ2YsTUFBTSx1Q0FBTSxDQUFROztxQkFDcEIsQ0FBZ0I7O3lDQUNzQixDQUFnQjs7S0FBcEQsWUFBWSxpQkFBWixZQUFZO0tBQUUsY0FBYyxpQkFBZCxjQUFjOztrQ0FDSCxDQUFTOztLQUFsQyxLQUFLLFVBQUwsS0FBSztLQUFFLFVBQVUsVUFBVixVQUFVOztxQ0FDK0IsQ0FB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LEtBQUssRUFBRSxRQUFRLEVBQUc7QUFDaEMsY0FBUyxVQUFVLEdBQUc7QUFDckIsc0JBQWdCLENBQUMsS0FBSyxDQUFFLElBQUksRUFBRSxTQUFTLENBQUUsQ0FBQztNQUMxQzs7QUFFRCxlQUFVLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsZ0JBQWdCLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDbkUsTUFBQyxDQUFDLE1BQU0sQ0FBRSxVQUFVLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ3hDLE1BQUMsQ0FBQyxNQUFNLENBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBRSxDQUFDOztBQUVqQyxZQUFPLFVBQVUsQ0FBQztLQUNsQjs7OztTQTdFbUIsZ0JBQWdCOzs7a0JBQWhCLGdCQUFnQiIsImZpbGUiOiJwb3N0YWwuZmVkZXJhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZShcImxvZGFzaFwiKSwgcmVxdWlyZShcInBvc3RhbFwiKSk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXCJsb2Rhc2hcIiwgXCJwb3N0YWxcIl0sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wicG9zdGFsRmVkeFwiXSA9IGZhY3RvcnkocmVxdWlyZShcImxvZGFzaFwiKSwgcmVxdWlyZShcInBvc3RhbFwiKSk7XG5cdGVsc2Vcblx0XHRyb290W1wicG9zdGFsRmVkeFwiXSA9IGZhY3Rvcnkocm9vdFtcIl9cIl0sIHJvb3RbXCJwb3N0YWxcIl0pO1xufSkodGhpcywgZnVuY3Rpb24oX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8xX18sIF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMl9fKSB7XG5yZXR1cm4gXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uXG4gKiovIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCBkNmI2ZjA4NmNkNzY0N2ViNGRlMlxuICoqLyIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuaW1wb3J0IFwiLi9wb3N0YWwtdXRpbHNcIjtcbmltcG9ydCB7IHBhY2tpbmdTbGlwcywgZ2V0UGFja2luZ1NsaXAgfSBmcm9tIFwiLi9wYWNraW5nU2xpcHNcIjtcbmltcG9ydCB7IHN0YXRlLCBkaXNjb25uZWN0IH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCB7IGhhbmRsZXJzLCBvbkZlZGVyYXRlZE1zZywgX21hdGNoZXNGaWx0ZXIgfSBmcm9tIFwiLi9oYW5kbGVyc1wiO1xuaW1wb3J0IEZlZGVyYXRpb25DbGllbnQgZnJvbSBcIi4vRmVkZXJhdGlvbkNsaWVudFwiO1xuXG5jb25zdCBOT19PUCA9IGZ1bmN0aW9uKCkge307XG5cbmV4cG9ydCBkZWZhdWx0IGZlZHggPSBwb3N0YWwuZmVkeCA9IHtcblx0RmVkZXJhdGlvbkNsaWVudDogRmVkZXJhdGlvbkNsaWVudCxcblx0cGFja2luZ1NsaXBzOiBwYWNraW5nU2xpcHMsXG5cdGhhbmRsZXJzOiBoYW5kbGVycyxcblx0Y2xpZW50czogc3RhdGUuX2NsaWVudHMsXG5cdHRyYW5zcG9ydHM6IHN0YXRlLl90cmFuc3BvcnRzLFxuXHRmaWx0ZXJzOiB7XG5cdFx0XCJpblwiOiB7fSwgLy8ganNjczppZ25vcmUgZGlzYWxsb3dRdW90ZWRLZXlzSW5PYmplY3RzXG5cdFx0b3V0OiB7fVxuXHR9LFxuXHRhZGRGaWx0ZXI6IGZ1bmN0aW9uKCBmaWx0ZXJzICkge1xuXHRcdGZpbHRlcnMgPSBfLmlzQXJyYXkoIGZpbHRlcnMgKSA/IGZpbHRlcnMgOiBbIGZpbHRlcnMgXTtcblx0XHRfLmVhY2goIGZpbHRlcnMsIGZ1bmN0aW9uKCBmaWx0ZXIgKSB7XG5cdFx0XHRmaWx0ZXIuZGlyZWN0aW9uID0gZmlsdGVyLmRpcmVjdGlvbiB8fCBzdGF0ZS5fY29uZmlnLmZpbHRlckRpcmVjdGlvbjtcblx0XHRcdF8uZWFjaCggKCBmaWx0ZXIuZGlyZWN0aW9uID09PSBcImJvdGhcIiApID8gWyBcImluXCIsIFwib3V0XCIgXSA6IFsgZmlsdGVyLmRpcmVjdGlvbiBdLCBmdW5jdGlvbiggZGlyICkge1xuXHRcdFx0XHRpZiAoICF0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0gKSB7XG5cdFx0XHRcdFx0dGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdID0gWyBmaWx0ZXIudG9waWMgXTtcblx0XHRcdFx0fSBlbHNlIGlmICggISggXy5pbmNsdWRlKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0sIGZpbHRlci50b3BpYyApICkgKSB7XG5cdFx0XHRcdFx0dGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLnB1c2goIGZpbHRlci50b3BpYyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9LFxuXHRyZW1vdmVGaWx0ZXI6IGZ1bmN0aW9uKCBmaWx0ZXJzICkge1xuXHRcdGZpbHRlcnMgPSBfLmlzQXJyYXkoIGZpbHRlcnMgKSA/IGZpbHRlcnMgOiBbIGZpbHRlcnMgXTtcblx0XHRfLmVhY2goIGZpbHRlcnMsIGZ1bmN0aW9uKCBmaWx0ZXIgKSB7XG5cdFx0XHRmaWx0ZXIuZGlyZWN0aW9uID0gZmlsdGVyLmRpcmVjdGlvbiB8fCBzdGF0ZS5fY29uZmlnLmZpbHRlckRpcmVjdGlvbjtcblx0XHRcdF8uZWFjaCggKCBmaWx0ZXIuZGlyZWN0aW9uID09PSBcImJvdGhcIiApID8gWyBcImluXCIsIFwib3V0XCIgXSA6IFsgZmlsdGVyLmRpcmVjdGlvbiBdLCBmdW5jdGlvbiggZGlyICkge1xuXHRcdFx0XHRpZiAoIHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSAmJiBfLmluY2x1ZGUoIHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSwgZmlsdGVyLnRvcGljICkgKSB7XG5cdFx0XHRcdFx0dGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdID0gXy53aXRob3V0KCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0sIGZpbHRlci50b3BpYyApO1xuXHRcdFx0XHR9XG5cdFx0XHR9LCB0aGlzICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9LFxuXHRjYW5TZW5kUmVtb3RlOiBmdW5jdGlvbiggY2hhbm5lbCwgdG9waWMgKSB7XG5cdFx0cmV0dXJuIF9tYXRjaGVzRmlsdGVyKCBjaGFubmVsLCB0b3BpYywgXCJvdXRcIiApO1xuXHR9LFxuXHRnZXRQYWNraW5nU2xpcCxcblx0b25GZWRlcmF0ZWRNc2c6IG9uRmVkZXJhdGVkTXNnLFxuXHRzZW5kTWVzc2FnZTogZnVuY3Rpb24oIGVudmVsb3BlICkge1xuXHRcdGlmICggIXN0YXRlLl9yZWFkeSApIHtcblx0XHRcdHN0YXRlLl9vdXRib3VuZFF1ZXVlLnB1c2goIGFyZ3VtZW50cyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRfLmVhY2goIHRoaXMudHJhbnNwb3J0cywgZnVuY3Rpb24oIHRyYW5zcG9ydCApIHtcblx0XHRcdHRyYW5zcG9ydC5zZW5kTWVzc2FnZSggZW52ZWxvcGUgKTtcblx0XHR9ICk7XG5cdH0sXG5cdGRpc2Nvbm5lY3Q6IGRpc2Nvbm5lY3QsXG5cdF9nZXRUcmFuc3BvcnRzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5yZWR1Y2UoIHRoaXMudHJhbnNwb3J0cywgZnVuY3Rpb24oIG1lbW8sIHRyYW5zcG9ydCwgbmFtZSApIHtcblx0XHRcdG1lbW9bbmFtZV0gPSB0cnVlO1xuXHRcdFx0cmV0dXJuIG1lbW87XG5cdFx0fSwge30gKTtcblx0fSxcblx0Lypcblx0XHRzaWduYWxSZWFkeSggY2FsbGJhY2sgKTtcblx0XHRzaWduYWxSZWFkeSggXCJ0cmFuc3BvcnROYW1lXCIgKTtcblx0XHRzaWduYWxSZWFkeSggXCJ0cmFuc3BvcnROYW1lXCIsIGNhbGxiYWNrICk7XG5cdFx0c2lnbmFsUmVhZHkoIFwidHJhbnNwb3J0TmFtZVwiLCB0YXJnZXRJbnN0YW5jZSwgY2FsbGJhY2sgKTsgPC0tIHRoaXMgaXMgTkVXXG5cdFx0c2lnbmFsUmVhZHkoIHsgdHJhbnNwb3J0TmFtZUE6IHRhcmdldHNGb3JBLCB0cmFuc3BvcnROYW1lQjogdGFyZ2V0c0ZvckIsIHRyYW5zcG9ydEM6IHRydWUgfSwgY2FsbGJhY2spO1xuXHQqL1xuXHRzaWduYWxSZWFkeTogZnVuY3Rpb24oIHRyYW5zcG9ydCwgdGFyZ2V0LCBjYWxsYmFjayApIHtcblx0XHRpZiAoICFzdGF0ZS5fcmVhZHkgKSB7XG5cdFx0XHRzdGF0ZS5fc2lnbmFsUXVldWUucHVzaCggYXJndW1lbnRzICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGxldCB0cmFuc3BvcnRzID0gdGhpcy5fZ2V0VHJhbnNwb3J0cygpO1xuXHRcdHN3aXRjaCAoIGFyZ3VtZW50cy5sZW5ndGggKSB7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0aWYgKCB0eXBlb2YgdHJhbnNwb3J0ID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gdHJhbnNwb3J0O1xuXHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSB0aGlzLnRyYW5zcG9ydHNbdHJhbnNwb3J0XTtcblx0XHRcdFx0Y2FsbGJhY2sgPSBOT19PUDtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMjpcblx0XHRcdGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSB0aGlzLnRyYW5zcG9ydHNbdHJhbnNwb3J0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRyYW5zcG9ydHMgPSB0cmFuc3BvcnQ7XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjayA9IHRhcmdldCB8fCBOT19PUDtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdHRyYW5zcG9ydHNbdHJhbnNwb3J0XSA9IFsgdGFyZ2V0IF07XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdFx0Xy5lYWNoKCB0cmFuc3BvcnRzLCBmdW5jdGlvbiggdGFyZ2V0cywgbmFtZSApIHtcblx0XHRcdHRhcmdldHMgPSB0eXBlb2YgdGFyZ2V0cyA9PT0gXCJib29sZWFuXCIgPyBbXSA6IHRhcmdldHM7XG5cdFx0XHR0aGlzLnRyYW5zcG9ydHNbbmFtZV0uc2lnbmFsUmVhZHkoIHRhcmdldHMsIGNhbGxiYWNrICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9XG59O1xuXG5mdW5jdGlvbiBwcm9jZXNzU2lnbmFsUSggYXJncyApIHtcblx0ZmVkeC5zaWduYWxSZWFkeS5hcHBseSggdGhpcywgYXJncyApO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzT3V0Ym91bmRRKCBhcmdzICkge1xuXHRmZWR4LnNlbmQuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0luYm91bmRRKCBtc2cgKSB7XG5cdGZlZHgub25GZWRlcmF0ZWRNc2cuY2FsbCggdGhpcywgbXNnICk7XG59XG5cbnBvc3RhbC5hZGRXaXJlVGFwKCBmdW5jdGlvbiggZGF0YSwgZW52ZWxvcGUgKSB7XG5cdGlmICggZmVkeC5jYW5TZW5kUmVtb3RlKCBlbnZlbG9wZS5jaGFubmVsLCBlbnZlbG9wZS50b3BpYyApICkge1xuXHRcdGZlZHguc2VuZE1lc3NhZ2UoIGVudmVsb3BlICk7XG5cdH1cbn0gKTtcblxucG9zdGFsLnN1YnNjcmliZSgge1xuXHRjaGFubmVsOiBwb3N0YWwuY29uZmlndXJhdGlvbi5TWVNURU1fQ0hBTk5FTCxcblx0dG9waWM6IFwiaW5zdGFuY2VJZC5jaGFuZ2VkXCIsXG5cdGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcblx0XHRzdGF0ZS5fcmVhZHkgPSB0cnVlO1xuXHRcdHdoaWxlICggc3RhdGUuX3NpZ25hbFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NTaWduYWxRKCBzdGF0ZS5fc2lnbmFsUXVldWUuc2hpZnQoKSApO1xuXHRcdH1cblx0XHR3aGlsZSAoIHN0YXRlLl9vdXRib3VuZFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NPdXRib3VuZFEoIHN0YXRlLl9vdXRib3VuZFF1ZXVlLnNoaWZ0KCkgKTtcblx0XHR9XG5cdFx0d2hpbGUgKCBzdGF0ZS5faW5ib3VuZFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NJbmJvdW5kUSggc3RhdGUuX2luYm91bmRRdWV1ZS5zaGlmdCgpICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cbmlmICggcG9zdGFsLmluc3RhbmNlSWQoKSAhPT0gdW5kZWZpbmVkICkge1xuXHRzdGF0ZS5fcmVhZHkgPSB0cnVlO1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvaW5kZXguanNcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMV9fO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogZXh0ZXJuYWwge1wicm9vdFwiOlwiX1wiLFwiY29tbW9uanNcIjpcImxvZGFzaFwiLFwiY29tbW9uanMyXCI6XCJsb2Rhc2hcIixcImFtZFwiOlwibG9kYXNoXCJ9XG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzJfXztcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIGV4dGVybmFsIFwicG9zdGFsXCJcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJpbXBvcnQgcG9zdGFsIGZyb20gXCJwb3N0YWxcIjtcblxuaWYgKCAhcG9zdGFsLmNyZWF0ZVVVSUQgKSB7XG5cdHBvc3RhbC5jcmVhdGVVVUlEID0gZnVuY3Rpb24oKSB7XG5cdFx0bGV0IHMgPSBbXTtcblx0XHRjb25zdCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCAzNjsgaSsrICkge1xuXHRcdFx0c1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAweDEwICksIDEgKTtcblx0XHR9XG5cdFx0c1sxNF0gPSBcIjRcIjsgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG5cdFx0LyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXHRcdHNbMTldID0gaGV4RGlnaXRzLnN1YnN0ciggKCBzWzE5XSAmIDB4MyApIHwgMHg4LCAxICk7IC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG5cdFx0LyoganNoaW50IGlnbm9yZTplbmQgKi9cblx0XHRzWzhdID0gc1sxM10gPSBzWzE4XSA9IHNbMjNdID0gXCItXCI7XG5cdFx0cmV0dXJuIHMuam9pbiggXCJcIiApO1xuXHR9O1xufVxuaWYgKCAhcG9zdGFsLmluc3RhbmNlSWQgKSB7XG5cdHBvc3RhbC5pbnN0YW5jZUlkID0gKCBmdW5jdGlvbigpIHtcblx0XHRsZXQgX2lkLCBfb2xkSWQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBpZCApIHtcblx0XHRcdGlmICggaWQgKSB7XG5cdFx0XHRcdF9vbGRJZCA9IF9pZDtcblx0XHRcdFx0X2lkID0gaWQ7XG5cdFx0XHRcdHBvc3RhbC5wdWJsaXNoKCB7XG5cdFx0XHRcdFx0Y2hhbm5lbDogcG9zdGFsLmNvbmZpZ3VyYXRpb24uU1lTVEVNX0NIQU5ORUwsXG5cdFx0XHRcdFx0dG9waWM6IFwiaW5zdGFuY2VJZC5jaGFuZ2VkXCIsXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0b2xkSWQ6IF9vbGRJZCxcblx0XHRcdFx0XHRcdG5ld0lkOiBfaWRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBfaWQ7XG5cdFx0fTtcblx0fSgpICk7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wb3N0YWwtdXRpbHMuanNcbiAqKi8iLCJpbXBvcnQgcG9zdGFsIGZyb20gXCJwb3N0YWxcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhY2tpbmdTbGlwKCB0eXBlIC8qLCBlbnYgKi8gKSB7XG5cdGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBwYWNraW5nU2xpcHMsIHR5cGUgKSApIHtcblx0XHRyZXR1cm4gcGFja2luZ1NsaXBzWyB0eXBlIF0uYXBwbHkoIHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKSApO1xuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBwYWNraW5nU2xpcHMgPSB7XG5cdHBpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ucGluZ1wiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHRpY2tldDogcG9zdGFsLmNyZWF0ZVVVSUQoKVxuXHRcdH07XG5cdH0sXG5cdHBvbmc6IGZ1bmN0aW9uKCBwaW5nICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ucG9uZ1wiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHBpbmdEYXRhOiB7XG5cdFx0XHRcdGluc3RhbmNlSWQ6IHBpbmcuaW5zdGFuY2VJZCxcblx0XHRcdFx0dGltZVN0YW1wOiBwaW5nLnRpbWVTdGFtcCxcblx0XHRcdFx0dGlja2V0OiBwaW5nLnRpY2tldFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cdG1lc3NhZ2U6IGZ1bmN0aW9uKCBlbnYgKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5tZXNzYWdlXCIsXG5cdFx0XHRpbnN0YW5jZUlkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0dGltZVN0YW1wOiBuZXcgRGF0ZSgpLFxuXHRcdFx0ZW52ZWxvcGU6IGVudlxuXHRcdH07XG5cdH0sXG5cdGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24uZGlzY29ubmVjdFwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKVxuXHRcdH07XG5cdH0sXG5cdGJ1bmRsZTogZnVuY3Rpb24oIHBhY2tpbmdTbGlwcyApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLmJ1bmRsZVwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHBhY2tpbmdTbGlwczogcGFja2luZ1NsaXBzXG5cdFx0fTtcblx0fVxufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BhY2tpbmdTbGlwcy5qc1xuICoqLyIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcblxuY29uc3QgX2RlZmF1bHRzID0ge1xuXHRlbmFibGVkOiB0cnVlLFxuXHRmaWx0ZXJNb2RlOiBcIndoaXRlbGlzdFwiLFxuXHRmaWx0ZXJEaXJlY3Rpb246IFwiYm90aFwiXG59O1xuXG5leHBvcnQgbGV0IHN0YXRlID0ge1xuXHRfY2xpZW50czogW10sXG5cdF90cmFuc3BvcnRzOiB7fSxcblx0X3JlYWR5OiBmYWxzZSxcblx0X2luYm91bmRRdWV1ZTogW10sXG5cdF9vdXRib3VuZFF1ZXVlOiBbXSxcblx0X3NpZ25hbFF1ZXVlOiBbXSxcblx0X2NvbmZpZzogX2RlZmF1bHRzXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKCBjZmcgKSB7XG5cdGlmICggY2ZnICYmIGNmZy5maWx0ZXJNb2RlICYmIGNmZy5maWx0ZXJNb2RlICE9PSBcImJsYWNrbGlzdFwiICYmIGNmZy5maWx0ZXJNb2RlICE9PSBcIndoaXRlbGlzdFwiICkge1xuXHRcdHRocm93IG5ldyBFcnJvciggXCJwb3N0YWwuZmVkeCBmaWx0ZXJNb2RlIG11c3QgYmUgJ2JsYWNrbGlzdCcgb3IgJ3doaXRlbGlzdCcuXCIgKTtcblx0fVxuXHRpZiAoIGNmZyApIHtcblx0XHRzdGF0ZS5fY29uZmlnID0gXy5kZWZhdWx0cyggY2ZnLCBfZGVmYXVsdHMgKTtcblx0fVxuXHRyZXR1cm4gc3RhdGUuX2NvbmZpZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc2Nvbm5lY3QoIG9wdGlvbnMgKSB7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRsZXQgdHJhbnMgPSBzdGF0ZS5fdHJhbnNwb3J0cztcblx0aWYgKCBvcHRpb25zLnRyYW5zcG9ydCApIHtcblx0XHR0cmFucyA9IHt9O1xuXHRcdHRyYW5zW29wdGlvbnMudHJhbnNwb3J0XSA9IHN0YXRlLl90cmFuc3BvcnRzW29wdGlvbnMudHJhbnNwb3J0XTtcblx0fVxuXHRfLmVhY2goIHRyYW5zLCBmdW5jdGlvbiggdCApIHtcblx0XHR0LmRpc2Nvbm5lY3QoIHtcblx0XHRcdHRhcmdldDogb3B0aW9ucy50YXJnZXQsXG5cdFx0XHRpbnN0YW5jZUlkOiBvcHRpb25zLmluc3RhbmNlSWQsXG5cdFx0XHRkb05vdE5vdGlmeTogISFvcHRpb25zLmRvTm90Tm90aWZ5XG5cdFx0fSApO1xuXHR9ICk7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zdGF0ZS5qc1xuICoqLyIsImltcG9ydCB7IGdldFBhY2tpbmdTbGlwIH0gZnJvbSBcIi4vcGFja2luZ1NsaXBzXCI7XG5pbXBvcnQgeyBzdGF0ZSwgZGlzY29ubmVjdCB9IGZyb20gXCIuL3N0YXRlXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBfbWF0Y2hlc0ZpbHRlciggY2hhbm5lbCwgdG9waWMsIGRpcmVjdGlvbiApIHtcblx0Y29uc3QgY2hhbm5lbFByZXNlbnQgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGZlZHguZmlsdGVyc1tkaXJlY3Rpb25dLCBjaGFubmVsICk7XG5cdGNvbnN0IHRvcGljTWF0Y2ggPSAoIGNoYW5uZWxQcmVzZW50ICYmIF8uYW55KCBmZWR4LmZpbHRlcnNbZGlyZWN0aW9uXVtjaGFubmVsXSwgZnVuY3Rpb24oIGJpbmRpbmcgKSB7XG5cdFx0cmV0dXJuIHBvc3RhbC5jb25maWd1cmF0aW9uLnJlc29sdmVyLmNvbXBhcmUoIGJpbmRpbmcsIHRvcGljICk7XG5cdH0gKSApO1xuXHRjb25zdCBibGFja2xpc3RpbmcgPSBzdGF0ZS5fY29uZmlnLmZpbHRlck1vZGUgPT09IFwiYmxhY2tsaXN0XCI7XG5cdHJldHVybiBzdGF0ZS5fY29uZmlnLmVuYWJsZWQgJiYgKCAoIGJsYWNrbGlzdGluZyAmJiAoICFjaGFubmVsUHJlc2VudCB8fCAoIGNoYW5uZWxQcmVzZW50ICYmICF0b3BpY01hdGNoICkgKSApIHx8ICggIWJsYWNrbGlzdGluZyAmJiBjaGFubmVsUHJlc2VudCAmJiB0b3BpY01hdGNoICkgKTtcbn1cblxuZXhwb3J0IGNvbnN0IGhhbmRsZXJzID0ge1xuXHRcImZlZGVyYXRpb24ucGluZ1wiOiBmdW5jdGlvbiggZGF0YSAvKiwgY2FsbGJhY2sgKi8gKSB7XG5cdFx0ZGF0YS5zb3VyY2Uuc2V0SW5zdGFuY2VJZCggZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICk7XG5cdFx0aWYgKCBkYXRhLnNvdXJjZS5oYW5kc2hha2VDb21wbGV0ZSApIHtcblx0XHRcdGRhdGEuc291cmNlLnNlbmRQb25nKCBkYXRhLnBhY2tpbmdTbGlwICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRhdGEuc291cmNlLnNlbmRCdW5kbGUoIFtcblx0XHRcdGdldFBhY2tpbmdTbGlwKCBcInBvbmdcIiwgZGF0YS5wYWNraW5nU2xpcCApLFxuXHRcdFx0Z2V0UGFja2luZ1NsaXAoIFwicGluZ1wiIClcblx0XHRcdF0gKTtcblx0XHR9XG5cdH0sXG5cdFwiZmVkZXJhdGlvbi5wb25nXCI6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGRhdGEuc291cmNlLmhhbmRzaGFrZUNvbXBsZXRlID0gdHJ1ZTtcblx0XHRkYXRhLnNvdXJjZS5zZXRJbnN0YW5jZUlkKCBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQgKTtcblx0XHRpZiAoIGRhdGEuc291cmNlLnBpbmdzW2RhdGEucGFja2luZ1NsaXAucGluZ0RhdGEudGlja2V0XSApIHtcblx0XHRcdGRhdGEuc291cmNlLnBpbmdzW2RhdGEucGFja2luZ1NsaXAucGluZ0RhdGEudGlja2V0XS5jYWxsYmFjaygge1xuXHRcdFx0XHR0aWNrZXQ6IGRhdGEucGFja2luZ1NsaXAucGluZ0RhdGEudGlja2V0LFxuXHRcdFx0XHRpbnN0YW5jZUlkOiBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQsXG5cdFx0XHRcdHNvdXJjZTogZGF0YS5zb3VyY2Vcblx0XHRcdH0gKTtcblx0XHRcdGRhdGEuc291cmNlLnBpbmdzW2RhdGEucGFja2luZ1NsaXAucGluZ0RhdGEudGlja2V0XSA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0aWYgKCAhXy5jb250YWlucyggc3RhdGUuX2NsaWVudHMsIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApICkge1xuXHRcdFx0c3RhdGUuX2NsaWVudHMucHVzaCggZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICk7XG5cdFx0fVxuXHRcdHBvc3RhbC5wdWJsaXNoKCB7XG5cdFx0XHRjaGFubmVsOiBcInBvc3RhbC5mZWRlcmF0aW9uXCIsXG5cdFx0XHR0b3BpYzogXCJjbGllbnQuZmVkZXJhdGVkXCIsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdHJlbW90ZUlkOiBkYXRhLnNvdXJjZS5pbnN0YW5jZUlkLFxuXHRcdFx0XHRsb2NhbElkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0XHR0cmFuc3BvcnQ6IGRhdGEudHJhbnNwb3J0XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXHRcImZlZGVyYXRpb24uZGlzY29ubmVjdFwiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRzdGF0ZS5fY2xpZW50cyA9IF8ud2l0aG91dCggc3RhdGUuX2NsaWVudHMsIGRhdGEuc291cmNlLmluc3RhbmNlSWQgKTtcblx0XHRkaXNjb25uZWN0KCB7XG5cdFx0XHR0cmFuc3BvcnQ6IGRhdGEuc291cmNlLnRyYW5zcG9ydE5hbWUsXG5cdFx0XHRpbnN0YW5jZUlkOiBkYXRhLnNvdXJjZS5pbnN0YW5jZUlkLFxuXHRcdFx0ZG9Ob3ROb3RpZnk6IHRydWVcblx0XHR9ICk7XG5cdH0sXG5cdFwiZmVkZXJhdGlvbi5tZXNzYWdlXCI6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdGNvbnN0IGVudiA9IGRhdGEucGFja2luZ1NsaXAuZW52ZWxvcGU7XG5cdFx0aWYgKCBfbWF0Y2hlc0ZpbHRlciggZW52LmNoYW5uZWwsIGVudi50b3BpYywgXCJpblwiICkgKSB7XG5cdFx0XHRlbnYubGFzdFNlbmRlciA9IGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZDtcblx0XHRcdHBvc3RhbC5wdWJsaXNoKCBlbnYgKTtcblx0XHR9XG5cdH0sXG5cdFwiZmVkZXJhdGlvbi5idW5kbGVcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0Xy5lYWNoKCBkYXRhLnBhY2tpbmdTbGlwLnBhY2tpbmdTbGlwcywgZnVuY3Rpb24oIHNsaXAgKSB7XG5cdFx0XHRvbkZlZGVyYXRlZE1zZyggXy5leHRlbmQoIHt9LCBkYXRhLCB7XG5cdFx0XHRcdHBhY2tpbmdTbGlwOiBzbGlwXG5cdFx0XHR9ICkgKTtcblx0XHR9ICk7XG5cdH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkZlZGVyYXRlZE1zZyggZGF0YSApIHtcblx0aWYgKCAhc3RhdGUuX3JlYWR5ICkge1xuXHRcdHN0YXRlLl9pbmJvdW5kUXVldWUucHVzaCggZGF0YSApO1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggaGFuZGxlcnMsIGRhdGEucGFja2luZ1NsaXAudHlwZSApICkge1xuXHRcdGhhbmRsZXJzW2RhdGEucGFja2luZ1NsaXAudHlwZV0oIGRhdGEgKTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoIFwicG9zdGFsLmZlZGVyYXRpb24gZG9lcyBub3QgaGF2ZSBhIG1lc3NhZ2UgaGFuZGxlciBmb3IgJ1wiICsgZGF0YS5wYWNraW5nU2xpcC50eXBlICsgXCInLlwiICk7XG5cdH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2hhbmRsZXJzLmpzXG4gKiovIiwiaW1wb3J0IHsgZ2V0UGFja2luZ1NsaXAgfSBmcm9tIFwiLi9wYWNraW5nU2xpcHNcIjtcbmltcG9ydCB7IG9uRmVkZXJhdGVkTXNnIH0gZnJvbSBcIi4vaGFuZGxlcnNcIjtcbmltcG9ydCB7IHN0YXRlIH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGZWRlcmF0aW9uQ2xpZW50IHtcblx0Y29uc3RydWN0b3IoIHRhcmdldCwgb3B0aW9ucywgaW5zdGFuY2VJZCApIHtcblx0XHR0aGlzLnRhcmdldCA9IHRhcmdldDtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdHRoaXMucGluZ3MgPSB7fTtcblx0XHR0aGlzLmluc3RhbmNlSWQgPSBpbnN0YW5jZUlkO1xuXHRcdHRoaXMuaGFuZHNoYWtlQ29tcGxldGUgPSBmYWxzZTtcblx0fVxuXG5cdHNlbmRQaW5nKCBjYWxsYmFjayApIHtcblx0XHRjb25zdCBwYWNraW5nU2xpcCA9IGdldFBhY2tpbmdTbGlwKCBcInBpbmdcIiApO1xuXHRcdHRoaXMucGluZ3NbcGFja2luZ1NsaXAudGlja2V0XSA9IHtcblx0XHRcdHRpY2tldDogcGFja2luZ1NsaXAudGlja2V0LFxuXHRcdFx0Y2FsbGJhY2s6IGNhbGxiYWNrIHx8IE5PX09QXG5cdFx0fTtcblx0XHR0aGlzLnNlbmQoIHBhY2tpbmdTbGlwICk7XG5cdH1cblxuXHRzZW5kUG9uZyggb3JpZ1BhY2tpbmdTbGlwICkge1xuXHRcdHRoaXMuc2VuZCggZ2V0UGFja2luZ1NsaXAoIFwicG9uZ1wiLCBvcmlnUGFja2luZ1NsaXAgKSApO1xuXHR9XG5cblx0c2VuZEJ1bmRsZSggc2xpcHMgKSB7XG5cdFx0dGhpcy5zZW5kKCBnZXRQYWNraW5nU2xpcCggXCJidW5kbGVcIiwgc2xpcHMgKSApO1xuXHR9XG5cblx0c2VuZE1lc3NhZ2UoIGVudmVsb3BlICkge1xuXHRcdGlmICggIXRoaXMuaGFuZHNoYWtlQ29tcGxldGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVudmVsb3BlLm9yaWdpbklkID0gZW52ZWxvcGUub3JpZ2luSWQgfHwgcG9zdGFsLmluc3RhbmNlSWQoKTtcblx0XHRjb25zdCBlbnYgPSBfLmNsb25lKCBlbnZlbG9wZSApO1xuXHRcdGlmICggdGhpcy5pbnN0YW5jZUlkICYmIHRoaXMuaW5zdGFuY2VJZCAhPT0gZW52Lmxhc3RTZW5kZXIgJiZcblx0XHQoICFlbnYua25vd25JZHMgfHwgIWVudi5rbm93bklkcy5sZW5ndGggfHxcblx0XHQoIGVudi5rbm93bklkcyAmJiAhXy5pbmNsdWRlKCBlbnYua25vd25JZHMsIHRoaXMuaW5zdGFuY2VJZCApICkgKVxuXHRcdCkge1xuXHRcdFx0ZW52Lmtub3duSWRzID0gKCBlbnYua25vd25JZHMgfHwgW10gKS5jb25jYXQoIF8ud2l0aG91dCggc3RhdGUuX2NsaWVudHMsIHRoaXMuaW5zdGFuY2VJZCApICk7XG5cdFx0XHR0aGlzLnNlbmQoIGdldFBhY2tpbmdTbGlwKCBcIm1lc3NhZ2VcIiwgZW52ICkgKTtcblx0XHR9XG5cdH1cblxuXHRkaXNjb25uZWN0KCkge1xuXHRcdHRoaXMuc2VuZCggZ2V0UGFja2luZ1NsaXAoIFwiZGlzY29ubmVjdFwiICkgKTtcblx0fVxuXG5cdG9uTWVzc2FnZSggcGFja2luZ1NsaXAgKSB7XG5cdFx0aWYgKCB0aGlzLnNob3VsZFByb2Nlc3MoKSApIHtcblx0XHRcdG9uRmVkZXJhdGVkTXNnKCB7XG5cdFx0XHRcdHRyYW5zcG9ydDogdGhpcy50cmFuc3BvcnROYW1lLFxuXHRcdFx0XHRwYWNraW5nU2xpcDogcGFja2luZ1NsaXAsXG5cdFx0XHRcdHNvdXJjZTogdGhpc1xuXHRcdFx0fSApO1xuXHRcdH1cblx0fVxuXG5cdHNob3VsZFByb2Nlc3MoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRzZW5kKCAvKiBtc2cgKi8gKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCBcIkFuIG9iamVjdCBkZXJpdmluZyBmcm9tIEZlZGVyYXRpb25DbGllbnQgbXVzdCBwcm92aWRlIGFuIGltcGxlbWVudGF0aW9uIGZvciAnc2VuZCcuXCIgKTtcblx0fVxuXG5cdHNldEluc3RhbmNlSWQoIGlkICkge1xuXHRcdHRoaXMuaW5zdGFuY2VJZCA9IGlkO1xuXHR9XG5cblx0c3RhdGljIGV4dGVuZCggcHJvcHMsIGN0clByb3BzICkge1xuXHRcdGZ1bmN0aW9uIEZlZFhDbGllbnQoKSB7XG5cdFx0XHRGZWRlcmF0aW9uQ2xpZW50LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR9XG5cblx0XHRGZWRYQ2xpZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlICk7XG5cdFx0Xy5leHRlbmQoIEZlZFhDbGllbnQucHJvdG90eXBlLCBwcm9wcyApO1xuXHRcdF8uZXh0ZW5kKCBGZWRYQ2xpZW50LCBjdHJQcm9wcyApO1xuXG5cdFx0cmV0dXJuIEZlZFhDbGllbnQ7XG5cdH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL0ZlZGVyYXRpb25DbGllbnQuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9