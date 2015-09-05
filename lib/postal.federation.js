/*!
 *  * postal.federation - A base plugin for federating instances of postal.js across various boundaries.
 *  * Author: Jim Cowart (http://ifandelse.com)
 *  * Version: v0.5.2
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
	var NO_OP = _state.NO_OP;
	var configure = _state.configure;
	
	var _handlers = __webpack_require__(6);
	
	var handlers = _handlers.handlers;
	var onFederatedMsg = _handlers.onFederatedMsg;
	var _matchesFilter = _handlers._matchesFilter;
	
	var FederationClient = _interopRequire(__webpack_require__(7));
	
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
		configure: configure,
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
	
	var NO_OP = function NO_OP() {};
	
	exports.NO_OP = NO_OP;
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
	
	var _state = __webpack_require__(5);
	
	var state = _state.state;
	var NO_OP = _state.NO_OP;
	
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCAzYTg1ZGRhYWYyZjIxNTkxYTY3YyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInJvb3RcIjpcIl9cIixcImNvbW1vbmpzXCI6XCJsb2Rhc2hcIixcImNvbW1vbmpzMlwiOlwibG9kYXNoXCIsXCJhbWRcIjpcImxvZGFzaFwifSIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJwb3N0YWxcIiIsIndlYnBhY2s6Ly8vLi9zcmMvcG9zdGFsLXV0aWxzLmpzIiwid2VicGFjazovLy8uL3NyYy9wYWNraW5nU2xpcHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0YXRlLmpzIiwid2VicGFjazovLy8uL3NyYy9oYW5kbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvRmVkZXJhdGlvbkNsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7OztLQ3RDTyxDQUFDLHVDQUFNLENBQVE7O0tBQ2YsTUFBTSx1Q0FBTSxDQUFROztxQkFDcEIsQ0FBZ0I7O3lDQUNzQixDQUFnQjs7S0FBcEQsWUFBWSxpQkFBWixZQUFZO0tBQUUsY0FBYyxpQkFBZCxjQUFjOztrQ0FDZSxDQUFTOztLQUFwRCxLQUFLLFVBQUwsS0FBSztLQUFFLFVBQVUsVUFBVixVQUFVO0tBQUUsS0FBSyxV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QUN6Rzs7QUFFRCxnQkFBYTtXQUFBLHVCQUFFLEVBQUUsRUFBRztBQUNuQixTQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztLQUNyQjs7O0FBRU0sU0FBTTtXQUFBLGdCQUFFLEtBQUssRUFBRSxRQUFRLEVBQUc7QUFDaEMsY0FBUyxVQUFVLEdBQUc7QUFDckIsc0JBQWdCLENBQUMsS0FBSyxDQUFFLElBQUksRUFBRSxTQUFTLENBQUUsQ0FBQztNQUMxQzs7QUFFRCxlQUFVLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsZ0JBQWdCLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDbkUsTUFBQyxDQUFDLE1BQU0sQ0FBRSxVQUFVLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ3hDLE1BQUMsQ0FBQyxNQUFNLENBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBRSxDQUFDOztBQUVqQyxZQUFPLFVBQVUsQ0FBQztLQUNsQjs7OztTQTdFbUIsZ0JBQWdCOzs7a0JBQWhCLGdCQUFnQiIsImZpbGUiOiJwb3N0YWwuZmVkZXJhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZShcImxvZGFzaFwiKSwgcmVxdWlyZShcInBvc3RhbFwiKSk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXCJsb2Rhc2hcIiwgXCJwb3N0YWxcIl0sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wicG9zdGFsRmVkeFwiXSA9IGZhY3RvcnkocmVxdWlyZShcImxvZGFzaFwiKSwgcmVxdWlyZShcInBvc3RhbFwiKSk7XG5cdGVsc2Vcblx0XHRyb290W1wicG9zdGFsRmVkeFwiXSA9IGZhY3Rvcnkocm9vdFtcIl9cIl0sIHJvb3RbXCJwb3N0YWxcIl0pO1xufSkodGhpcywgZnVuY3Rpb24oX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8xX18sIF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMl9fKSB7XG5yZXR1cm4gXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uXG4gKiovIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCAzYTg1ZGRhYWYyZjIxNTkxYTY3Y1xuICoqLyIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuaW1wb3J0IFwiLi9wb3N0YWwtdXRpbHNcIjtcbmltcG9ydCB7IHBhY2tpbmdTbGlwcywgZ2V0UGFja2luZ1NsaXAgfSBmcm9tIFwiLi9wYWNraW5nU2xpcHNcIjtcbmltcG9ydCB7IHN0YXRlLCBkaXNjb25uZWN0LCBOT19PUCwgY29uZmlndXJlIH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCB7IGhhbmRsZXJzLCBvbkZlZGVyYXRlZE1zZywgX21hdGNoZXNGaWx0ZXIgfSBmcm9tIFwiLi9oYW5kbGVyc1wiO1xuaW1wb3J0IEZlZGVyYXRpb25DbGllbnQgZnJvbSBcIi4vRmVkZXJhdGlvbkNsaWVudFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmZWR4ID0gcG9zdGFsLmZlZHggPSB7XG5cdEZlZGVyYXRpb25DbGllbnQ6IEZlZGVyYXRpb25DbGllbnQsXG5cdHBhY2tpbmdTbGlwczogcGFja2luZ1NsaXBzLFxuXHRoYW5kbGVyczogaGFuZGxlcnMsXG5cdGNsaWVudHM6IHN0YXRlLl9jbGllbnRzLFxuXHR0cmFuc3BvcnRzOiBzdGF0ZS5fdHJhbnNwb3J0cyxcblx0ZmlsdGVyczoge1xuXHRcdFwiaW5cIjoge30sIC8vIGpzY3M6aWdub3JlIGRpc2FsbG93UXVvdGVkS2V5c0luT2JqZWN0c1xuXHRcdG91dDoge31cblx0fSxcblx0YWRkRmlsdGVyOiBmdW5jdGlvbiggZmlsdGVycyApIHtcblx0XHRmaWx0ZXJzID0gXy5pc0FycmF5KCBmaWx0ZXJzICkgPyBmaWx0ZXJzIDogWyBmaWx0ZXJzIF07XG5cdFx0Xy5lYWNoKCBmaWx0ZXJzLCBmdW5jdGlvbiggZmlsdGVyICkge1xuXHRcdFx0ZmlsdGVyLmRpcmVjdGlvbiA9IGZpbHRlci5kaXJlY3Rpb24gfHwgc3RhdGUuX2NvbmZpZy5maWx0ZXJEaXJlY3Rpb247XG5cdFx0XHRfLmVhY2goICggZmlsdGVyLmRpcmVjdGlvbiA9PT0gXCJib3RoXCIgKSA/IFsgXCJpblwiLCBcIm91dFwiIF0gOiBbIGZpbHRlci5kaXJlY3Rpb24gXSwgZnVuY3Rpb24oIGRpciApIHtcblx0XHRcdFx0aWYgKCAhdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSA9IFsgZmlsdGVyLnRvcGljIF07XG5cdFx0XHRcdH0gZWxzZSBpZiAoICEoIF8uaW5jbHVkZSggdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLCBmaWx0ZXIudG9waWMgKSApICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXS5wdXNoKCBmaWx0ZXIudG9waWMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcyApO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblx0cmVtb3ZlRmlsdGVyOiBmdW5jdGlvbiggZmlsdGVycyApIHtcblx0XHRmaWx0ZXJzID0gXy5pc0FycmF5KCBmaWx0ZXJzICkgPyBmaWx0ZXJzIDogWyBmaWx0ZXJzIF07XG5cdFx0Xy5lYWNoKCBmaWx0ZXJzLCBmdW5jdGlvbiggZmlsdGVyICkge1xuXHRcdFx0ZmlsdGVyLmRpcmVjdGlvbiA9IGZpbHRlci5kaXJlY3Rpb24gfHwgc3RhdGUuX2NvbmZpZy5maWx0ZXJEaXJlY3Rpb247XG5cdFx0XHRfLmVhY2goICggZmlsdGVyLmRpcmVjdGlvbiA9PT0gXCJib3RoXCIgKSA/IFsgXCJpblwiLCBcIm91dFwiIF0gOiBbIGZpbHRlci5kaXJlY3Rpb24gXSwgZnVuY3Rpb24oIGRpciApIHtcblx0XHRcdFx0aWYgKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0gJiYgXy5pbmNsdWRlKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0sIGZpbHRlci50b3BpYyApICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSA9IF8ud2l0aG91dCggdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLCBmaWx0ZXIudG9waWMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcyApO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblx0Y2FuU2VuZFJlbW90ZTogZnVuY3Rpb24oIGNoYW5uZWwsIHRvcGljICkge1xuXHRcdHJldHVybiBfbWF0Y2hlc0ZpbHRlciggY2hhbm5lbCwgdG9waWMsIFwib3V0XCIgKTtcblx0fSxcblx0Y29uZmlndXJlOiBjb25maWd1cmUsXG5cdGdldFBhY2tpbmdTbGlwLFxuXHRvbkZlZGVyYXRlZE1zZzogb25GZWRlcmF0ZWRNc2csXG5cdHNlbmRNZXNzYWdlOiBmdW5jdGlvbiggZW52ZWxvcGUgKSB7XG5cdFx0aWYgKCAhc3RhdGUuX3JlYWR5ICkge1xuXHRcdFx0c3RhdGUuX291dGJvdW5kUXVldWUucHVzaCggYXJndW1lbnRzICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdF8uZWFjaCggdGhpcy50cmFuc3BvcnRzLCBmdW5jdGlvbiggdHJhbnNwb3J0ICkge1xuXHRcdFx0dHJhbnNwb3J0LnNlbmRNZXNzYWdlKCBlbnZlbG9wZSApO1xuXHRcdH0gKTtcblx0fSxcblx0ZGlzY29ubmVjdDogZGlzY29ubmVjdCxcblx0X2dldFRyYW5zcG9ydHM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBfLnJlZHVjZSggdGhpcy50cmFuc3BvcnRzLCBmdW5jdGlvbiggbWVtbywgdHJhbnNwb3J0LCBuYW1lICkge1xuXHRcdFx0bWVtb1tuYW1lXSA9IHRydWU7XG5cdFx0XHRyZXR1cm4gbWVtbztcblx0XHR9LCB7fSApO1xuXHR9LFxuXHQvKlxuXHRcdHNpZ25hbFJlYWR5KCBjYWxsYmFjayApO1xuXHRcdHNpZ25hbFJlYWR5KCBcInRyYW5zcG9ydE5hbWVcIiApO1xuXHRcdHNpZ25hbFJlYWR5KCBcInRyYW5zcG9ydE5hbWVcIiwgY2FsbGJhY2sgKTtcblx0XHRzaWduYWxSZWFkeSggXCJ0cmFuc3BvcnROYW1lXCIsIHRhcmdldEluc3RhbmNlLCBjYWxsYmFjayApOyA8LS0gdGhpcyBpcyBORVdcblx0XHRzaWduYWxSZWFkeSggeyB0cmFuc3BvcnROYW1lQTogdGFyZ2V0c0ZvckEsIHRyYW5zcG9ydE5hbWVCOiB0YXJnZXRzRm9yQiwgdHJhbnNwb3J0QzogdHJ1ZSB9LCBjYWxsYmFjayk7XG5cdCovXG5cdHNpZ25hbFJlYWR5OiBmdW5jdGlvbiggdHJhbnNwb3J0LCB0YXJnZXQsIGNhbGxiYWNrICkge1xuXHRcdGlmICggIXN0YXRlLl9yZWFkeSApIHtcblx0XHRcdHN0YXRlLl9zaWduYWxRdWV1ZS5wdXNoKCBhcmd1bWVudHMgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0bGV0IHRyYW5zcG9ydHMgPSB0aGlzLl9nZXRUcmFuc3BvcnRzKCk7XG5cdFx0c3dpdGNoICggYXJndW1lbnRzLmxlbmd0aCApIHtcblx0XHRjYXNlIDE6XG5cdFx0XHRpZiAoIHR5cGVvZiB0cmFuc3BvcnQgPT09IFwiZnVuY3Rpb25cIiApIHtcblx0XHRcdFx0Y2FsbGJhY2sgPSB0cmFuc3BvcnQ7XG5cdFx0XHR9IGVsc2UgaWYgKCB0eXBlb2YgdHJhbnNwb3J0ID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0XHR0cmFuc3BvcnRzID0ge307XG5cdFx0XHRcdHRyYW5zcG9ydHNbdHJhbnNwb3J0XSA9IHRoaXMudHJhbnNwb3J0c1t0cmFuc3BvcnRdO1xuXHRcdFx0XHRjYWxsYmFjayA9IE5PX09QO1xuXHRcdFx0fVxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAyOlxuXHRcdFx0aWYgKCB0eXBlb2YgdHJhbnNwb3J0ID09PSBcInN0cmluZ1wiICkge1xuXHRcdFx0XHR0cmFuc3BvcnRzID0ge307XG5cdFx0XHRcdHRyYW5zcG9ydHNbdHJhbnNwb3J0XSA9IHRoaXMudHJhbnNwb3J0c1t0cmFuc3BvcnRdO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dHJhbnNwb3J0cyA9IHRyYW5zcG9ydDtcblx0XHRcdH1cblx0XHRcdGNhbGxiYWNrID0gdGFyZ2V0IHx8IE5PX09QO1xuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAzOlxuXHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0dHJhbnNwb3J0c1t0cmFuc3BvcnRdID0gWyB0YXJnZXQgXTtcblx0XHRcdGJyZWFrO1xuXHRcdH1cblx0XHRfLmVhY2goIHRyYW5zcG9ydHMsIGZ1bmN0aW9uKCB0YXJnZXRzLCBuYW1lICkge1xuXHRcdFx0dGFyZ2V0cyA9IHR5cGVvZiB0YXJnZXRzID09PSBcImJvb2xlYW5cIiA/IFtdIDogdGFyZ2V0cztcblx0XHRcdHRoaXMudHJhbnNwb3J0c1tuYW1lXS5zaWduYWxSZWFkeSggdGFyZ2V0cywgY2FsbGJhY2sgKTtcblx0XHR9LCB0aGlzICk7XG5cdH1cbn07XG5cbmZ1bmN0aW9uIHByb2Nlc3NTaWduYWxRKCBhcmdzICkge1xuXHRmZWR4LnNpZ25hbFJlYWR5LmFwcGx5KCB0aGlzLCBhcmdzICk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NPdXRib3VuZFEoIGFyZ3MgKSB7XG5cdGZlZHguc2VuZC5hcHBseSggdGhpcywgYXJncyApO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzSW5ib3VuZFEoIG1zZyApIHtcblx0ZmVkeC5vbkZlZGVyYXRlZE1zZy5jYWxsKCB0aGlzLCBtc2cgKTtcbn1cblxucG9zdGFsLmFkZFdpcmVUYXAoIGZ1bmN0aW9uKCBkYXRhLCBlbnZlbG9wZSApIHtcblx0aWYgKCBmZWR4LmNhblNlbmRSZW1vdGUoIGVudmVsb3BlLmNoYW5uZWwsIGVudmVsb3BlLnRvcGljICkgKSB7XG5cdFx0ZmVkeC5zZW5kTWVzc2FnZSggZW52ZWxvcGUgKTtcblx0fVxufSApO1xuXG5wb3N0YWwuc3Vic2NyaWJlKCB7XG5cdGNoYW5uZWw6IHBvc3RhbC5jb25maWd1cmF0aW9uLlNZU1RFTV9DSEFOTkVMLFxuXHR0b3BpYzogXCJpbnN0YW5jZUlkLmNoYW5nZWRcIixcblx0Y2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuXHRcdHN0YXRlLl9yZWFkeSA9IHRydWU7XG5cdFx0d2hpbGUgKCBzdGF0ZS5fc2lnbmFsUXVldWUubGVuZ3RoICkge1xuXHRcdFx0cHJvY2Vzc1NpZ25hbFEoIHN0YXRlLl9zaWduYWxRdWV1ZS5zaGlmdCgpICk7XG5cdFx0fVxuXHRcdHdoaWxlICggc3RhdGUuX291dGJvdW5kUXVldWUubGVuZ3RoICkge1xuXHRcdFx0cHJvY2Vzc091dGJvdW5kUSggc3RhdGUuX291dGJvdW5kUXVldWUuc2hpZnQoKSApO1xuXHRcdH1cblx0XHR3aGlsZSAoIHN0YXRlLl9pbmJvdW5kUXVldWUubGVuZ3RoICkge1xuXHRcdFx0cHJvY2Vzc0luYm91bmRRKCBzdGF0ZS5faW5ib3VuZFF1ZXVlLnNoaWZ0KCkgKTtcblx0XHR9XG5cdH1cbn0gKTtcblxuaWYgKCBwb3N0YWwuaW5zdGFuY2VJZCgpICE9PSB1bmRlZmluZWQgKSB7XG5cdHN0YXRlLl9yZWFkeSA9IHRydWU7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9pbmRleC5qc1xuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8xX187XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiBleHRlcm5hbCB7XCJyb290XCI6XCJfXCIsXCJjb21tb25qc1wiOlwibG9kYXNoXCIsXCJjb21tb25qczJcIjpcImxvZGFzaFwiLFwiYW1kXCI6XCJsb2Rhc2hcIn1cbiAqKiBtb2R1bGUgaWQgPSAxXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMl9fO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogZXh0ZXJuYWwgXCJwb3N0YWxcIlxuICoqIG1vZHVsZSBpZCA9IDJcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsImltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuXG5pZiAoICFwb3N0YWwuY3JlYXRlVVVJRCApIHtcblx0cG9zdGFsLmNyZWF0ZVVVSUQgPSBmdW5jdGlvbigpIHtcblx0XHRsZXQgcyA9IFtdO1xuXHRcdGNvbnN0IGhleERpZ2l0cyA9IFwiMDEyMzQ1Njc4OWFiY2RlZlwiO1xuXHRcdGZvciAoIGxldCBpID0gMDsgaSA8IDM2OyBpKysgKSB7XG5cdFx0XHRzW2ldID0gaGV4RGlnaXRzLnN1YnN0ciggTWF0aC5mbG9vciggTWF0aC5yYW5kb20oKSAqIDB4MTAgKSwgMSApO1xuXHRcdH1cblx0XHRzWzE0XSA9IFwiNFwiOyAvLyBiaXRzIDEyLTE1IG9mIHRoZSB0aW1lX2hpX2FuZF92ZXJzaW9uIGZpZWxkIHRvIDAwMTBcblx0XHQvKiBqc2hpbnQgaWdub3JlOnN0YXJ0ICovXG5cdFx0c1sxOV0gPSBoZXhEaWdpdHMuc3Vic3RyKCAoIHNbMTldICYgMHgzICkgfCAweDgsIDEgKTsgLy8gYml0cyA2LTcgb2YgdGhlIGNsb2NrX3NlcV9oaV9hbmRfcmVzZXJ2ZWQgdG8gMDFcblx0XHQvKiBqc2hpbnQgaWdub3JlOmVuZCAqL1xuXHRcdHNbOF0gPSBzWzEzXSA9IHNbMThdID0gc1syM10gPSBcIi1cIjtcblx0XHRyZXR1cm4gcy5qb2luKCBcIlwiICk7XG5cdH07XG59XG5pZiAoICFwb3N0YWwuaW5zdGFuY2VJZCApIHtcblx0cG9zdGFsLmluc3RhbmNlSWQgPSAoIGZ1bmN0aW9uKCkge1xuXHRcdGxldCBfaWQsIF9vbGRJZDtcblx0XHRyZXR1cm4gZnVuY3Rpb24oIGlkICkge1xuXHRcdFx0aWYgKCBpZCApIHtcblx0XHRcdFx0X29sZElkID0gX2lkO1xuXHRcdFx0XHRfaWQgPSBpZDtcblx0XHRcdFx0cG9zdGFsLnB1Ymxpc2goIHtcblx0XHRcdFx0XHRjaGFubmVsOiBwb3N0YWwuY29uZmlndXJhdGlvbi5TWVNURU1fQ0hBTk5FTCxcblx0XHRcdFx0XHR0b3BpYzogXCJpbnN0YW5jZUlkLmNoYW5nZWRcIixcblx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHRvbGRJZDogX29sZElkLFxuXHRcdFx0XHRcdFx0bmV3SWQ6IF9pZFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSApO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIF9pZDtcblx0XHR9O1xuXHR9KCkgKTtcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3Bvc3RhbC11dGlscy5qc1xuICoqLyIsImltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFja2luZ1NsaXAoIHR5cGUgLyosIGVudiAqLyApIHtcblx0aWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIHBhY2tpbmdTbGlwcywgdHlwZSApICkge1xuXHRcdHJldHVybiBwYWNraW5nU2xpcHNbIHR5cGUgXS5hcHBseSggdGhpcywgQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoIGFyZ3VtZW50cywgMSApICk7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IHBhY2tpbmdTbGlwcyA9IHtcblx0cGluZzogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5waW5nXCIsXG5cdFx0XHRpbnN0YW5jZUlkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0dGltZVN0YW1wOiBuZXcgRGF0ZSgpLFxuXHRcdFx0dGlja2V0OiBwb3N0YWwuY3JlYXRlVVVJRCgpXG5cdFx0fTtcblx0fSxcblx0cG9uZzogZnVuY3Rpb24oIHBpbmcgKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5wb25nXCIsXG5cdFx0XHRpbnN0YW5jZUlkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0dGltZVN0YW1wOiBuZXcgRGF0ZSgpLFxuXHRcdFx0cGluZ0RhdGE6IHtcblx0XHRcdFx0aW5zdGFuY2VJZDogcGluZy5pbnN0YW5jZUlkLFxuXHRcdFx0XHR0aW1lU3RhbXA6IHBpbmcudGltZVN0YW1wLFxuXHRcdFx0XHR0aWNrZXQ6IHBpbmcudGlja2V0XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblx0bWVzc2FnZTogZnVuY3Rpb24oIGVudiApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLm1lc3NhZ2VcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0XHRlbnZlbG9wZTogZW52XG5cdFx0fTtcblx0fSxcblx0ZGlzY29ubmVjdDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5kaXNjb25uZWN0XCIsXG5cdFx0XHRpbnN0YW5jZUlkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0dGltZVN0YW1wOiBuZXcgRGF0ZSgpXG5cdFx0fTtcblx0fSxcblx0YnVuZGxlOiBmdW5jdGlvbiggcGFja2luZ1NsaXBzICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24uYnVuZGxlXCIsXG5cdFx0XHRpbnN0YW5jZUlkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0dGltZVN0YW1wOiBuZXcgRGF0ZSgpLFxuXHRcdFx0cGFja2luZ1NsaXBzOiBwYWNraW5nU2xpcHNcblx0XHR9O1xuXHR9XG59O1xuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcGFja2luZ1NsaXBzLmpzXG4gKiovIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuXG5jb25zdCBfZGVmYXVsdHMgPSB7XG5cdGVuYWJsZWQ6IHRydWUsXG5cdGZpbHRlck1vZGU6IFwid2hpdGVsaXN0XCIsXG5cdGZpbHRlckRpcmVjdGlvbjogXCJib3RoXCJcbn07XG5cbmV4cG9ydCBjb25zdCBOT19PUCA9IGZ1bmN0aW9uKCkge307XG5cbmV4cG9ydCBsZXQgc3RhdGUgPSB7XG5cdF9jbGllbnRzOiBbXSxcblx0X3RyYW5zcG9ydHM6IHt9LFxuXHRfcmVhZHk6IGZhbHNlLFxuXHRfaW5ib3VuZFF1ZXVlOiBbXSxcblx0X291dGJvdW5kUXVldWU6IFtdLFxuXHRfc2lnbmFsUXVldWU6IFtdLFxuXHRfY29uZmlnOiBfZGVmYXVsdHNcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmUoIGNmZyApIHtcblx0aWYgKCBjZmcgJiYgY2ZnLmZpbHRlck1vZGUgJiYgY2ZnLmZpbHRlck1vZGUgIT09IFwiYmxhY2tsaXN0XCIgJiYgY2ZnLmZpbHRlck1vZGUgIT09IFwid2hpdGVsaXN0XCIgKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCBcInBvc3RhbC5mZWR4IGZpbHRlck1vZGUgbXVzdCBiZSAnYmxhY2tsaXN0JyBvciAnd2hpdGVsaXN0Jy5cIiApO1xuXHR9XG5cdGlmICggY2ZnICkge1xuXHRcdHN0YXRlLl9jb25maWcgPSBfLmRlZmF1bHRzKCBjZmcsIF9kZWZhdWx0cyApO1xuXHR9XG5cdHJldHVybiBzdGF0ZS5fY29uZmlnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGlzY29ubmVjdCggb3B0aW9ucyApIHtcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdGxldCB0cmFucyA9IHN0YXRlLl90cmFuc3BvcnRzO1xuXHRpZiAoIG9wdGlvbnMudHJhbnNwb3J0ICkge1xuXHRcdHRyYW5zID0ge307XG5cdFx0dHJhbnNbb3B0aW9ucy50cmFuc3BvcnRdID0gc3RhdGUuX3RyYW5zcG9ydHNbb3B0aW9ucy50cmFuc3BvcnRdO1xuXHR9XG5cdF8uZWFjaCggdHJhbnMsIGZ1bmN0aW9uKCB0ICkge1xuXHRcdHQuZGlzY29ubmVjdCgge1xuXHRcdFx0dGFyZ2V0OiBvcHRpb25zLnRhcmdldCxcblx0XHRcdGluc3RhbmNlSWQ6IG9wdGlvbnMuaW5zdGFuY2VJZCxcblx0XHRcdGRvTm90Tm90aWZ5OiAhIW9wdGlvbnMuZG9Ob3ROb3RpZnlcblx0XHR9ICk7XG5cdH0gKTtcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3N0YXRlLmpzXG4gKiovIiwiaW1wb3J0IHsgZ2V0UGFja2luZ1NsaXAgfSBmcm9tIFwiLi9wYWNraW5nU2xpcHNcIjtcbmltcG9ydCB7IHN0YXRlLCBkaXNjb25uZWN0IH0gZnJvbSBcIi4vc3RhdGVcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIF9tYXRjaGVzRmlsdGVyKCBjaGFubmVsLCB0b3BpYywgZGlyZWN0aW9uICkge1xuXHRjb25zdCBjaGFubmVsUHJlc2VudCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggZmVkeC5maWx0ZXJzW2RpcmVjdGlvbl0sIGNoYW5uZWwgKTtcblx0Y29uc3QgdG9waWNNYXRjaCA9ICggY2hhbm5lbFByZXNlbnQgJiYgXy5hbnkoIGZlZHguZmlsdGVyc1tkaXJlY3Rpb25dW2NoYW5uZWxdLCBmdW5jdGlvbiggYmluZGluZyApIHtcblx0XHRyZXR1cm4gcG9zdGFsLmNvbmZpZ3VyYXRpb24ucmVzb2x2ZXIuY29tcGFyZSggYmluZGluZywgdG9waWMgKTtcblx0fSApICk7XG5cdGNvbnN0IGJsYWNrbGlzdGluZyA9IHN0YXRlLl9jb25maWcuZmlsdGVyTW9kZSA9PT0gXCJibGFja2xpc3RcIjtcblx0cmV0dXJuIHN0YXRlLl9jb25maWcuZW5hYmxlZCAmJiAoICggYmxhY2tsaXN0aW5nICYmICggIWNoYW5uZWxQcmVzZW50IHx8ICggY2hhbm5lbFByZXNlbnQgJiYgIXRvcGljTWF0Y2ggKSApICkgfHwgKCAhYmxhY2tsaXN0aW5nICYmIGNoYW5uZWxQcmVzZW50ICYmIHRvcGljTWF0Y2ggKSApO1xufVxuXG5leHBvcnQgY29uc3QgaGFuZGxlcnMgPSB7XG5cdFwiZmVkZXJhdGlvbi5waW5nXCI6IGZ1bmN0aW9uKCBkYXRhIC8qLCBjYWxsYmFjayAqLyApIHtcblx0XHRkYXRhLnNvdXJjZS5zZXRJbnN0YW5jZUlkKCBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQgKTtcblx0XHRpZiAoIGRhdGEuc291cmNlLmhhbmRzaGFrZUNvbXBsZXRlICkge1xuXHRcdFx0ZGF0YS5zb3VyY2Uuc2VuZFBvbmcoIGRhdGEucGFja2luZ1NsaXAgKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGF0YS5zb3VyY2Uuc2VuZEJ1bmRsZSggW1xuXHRcdFx0Z2V0UGFja2luZ1NsaXAoIFwicG9uZ1wiLCBkYXRhLnBhY2tpbmdTbGlwICksXG5cdFx0XHRnZXRQYWNraW5nU2xpcCggXCJwaW5nXCIgKVxuXHRcdFx0XSApO1xuXHRcdH1cblx0fSxcblx0XCJmZWRlcmF0aW9uLnBvbmdcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0ZGF0YS5zb3VyY2UuaGFuZHNoYWtlQ29tcGxldGUgPSB0cnVlO1xuXHRcdGRhdGEuc291cmNlLnNldEluc3RhbmNlSWQoIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdGlmICggZGF0YS5zb3VyY2UucGluZ3NbZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXRdICkge1xuXHRcdFx0ZGF0YS5zb3VyY2UucGluZ3NbZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXRdLmNhbGxiYWNrKCB7XG5cdFx0XHRcdHRpY2tldDogZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXQsXG5cdFx0XHRcdGluc3RhbmNlSWQ6IGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCxcblx0XHRcdFx0c291cmNlOiBkYXRhLnNvdXJjZVxuXHRcdFx0fSApO1xuXHRcdFx0ZGF0YS5zb3VyY2UucGluZ3NbZGF0YS5wYWNraW5nU2xpcC5waW5nRGF0YS50aWNrZXRdID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRpZiAoICFfLmNvbnRhaW5zKCBzdGF0ZS5fY2xpZW50cywgZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICkgKSB7XG5cdFx0XHRzdGF0ZS5fY2xpZW50cy5wdXNoKCBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQgKTtcblx0XHR9XG5cdFx0cG9zdGFsLnB1Ymxpc2goIHtcblx0XHRcdGNoYW5uZWw6IFwicG9zdGFsLmZlZGVyYXRpb25cIixcblx0XHRcdHRvcGljOiBcImNsaWVudC5mZWRlcmF0ZWRcIixcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0cmVtb3RlSWQ6IGRhdGEuc291cmNlLmluc3RhbmNlSWQsXG5cdFx0XHRcdGxvY2FsSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHRcdHRyYW5zcG9ydDogZGF0YS50cmFuc3BvcnRcblx0XHRcdH1cblx0XHR9ICk7XG5cdH0sXG5cdFwiZmVkZXJhdGlvbi5kaXNjb25uZWN0XCI6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdHN0YXRlLl9jbGllbnRzID0gXy53aXRob3V0KCBzdGF0ZS5fY2xpZW50cywgZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCApO1xuXHRcdGRpc2Nvbm5lY3QoIHtcblx0XHRcdHRyYW5zcG9ydDogZGF0YS5zb3VyY2UudHJhbnNwb3J0TmFtZSxcblx0XHRcdGluc3RhbmNlSWQ6IGRhdGEuc291cmNlLmluc3RhbmNlSWQsXG5cdFx0XHRkb05vdE5vdGlmeTogdHJ1ZVxuXHRcdH0gKTtcblx0fSxcblx0XCJmZWRlcmF0aW9uLm1lc3NhZ2VcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0Y29uc3QgZW52ID0gZGF0YS5wYWNraW5nU2xpcC5lbnZlbG9wZTtcblx0XHRpZiAoIF9tYXRjaGVzRmlsdGVyKCBlbnYuY2hhbm5lbCwgZW52LnRvcGljLCBcImluXCIgKSApIHtcblx0XHRcdGVudi5sYXN0U2VuZGVyID0gZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkO1xuXHRcdFx0cG9zdGFsLnB1Ymxpc2goIGVudiApO1xuXHRcdH1cblx0fSxcblx0XCJmZWRlcmF0aW9uLmJ1bmRsZVwiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRfLmVhY2goIGRhdGEucGFja2luZ1NsaXAucGFja2luZ1NsaXBzLCBmdW5jdGlvbiggc2xpcCApIHtcblx0XHRcdG9uRmVkZXJhdGVkTXNnKCBfLmV4dGVuZCgge30sIGRhdGEsIHtcblx0XHRcdFx0cGFja2luZ1NsaXA6IHNsaXBcblx0XHRcdH0gKSApO1xuXHRcdH0gKTtcblx0fVxufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG9uRmVkZXJhdGVkTXNnKCBkYXRhICkge1xuXHRpZiAoICFzdGF0ZS5fcmVhZHkgKSB7XG5cdFx0c3RhdGUuX2luYm91bmRRdWV1ZS5wdXNoKCBkYXRhICk7XG5cdFx0cmV0dXJuO1xuXHR9XG5cdGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBoYW5kbGVycywgZGF0YS5wYWNraW5nU2xpcC50eXBlICkgKSB7XG5cdFx0aGFuZGxlcnNbZGF0YS5wYWNraW5nU2xpcC50eXBlXSggZGF0YSApO1xuXHR9IGVsc2Uge1xuXHRcdHRocm93IG5ldyBFcnJvciggXCJwb3N0YWwuZmVkZXJhdGlvbiBkb2VzIG5vdCBoYXZlIGEgbWVzc2FnZSBoYW5kbGVyIGZvciAnXCIgKyBkYXRhLnBhY2tpbmdTbGlwLnR5cGUgKyBcIicuXCIgKTtcblx0fVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvaGFuZGxlcnMuanNcbiAqKi8iLCJpbXBvcnQgeyBnZXRQYWNraW5nU2xpcCB9IGZyb20gXCIuL3BhY2tpbmdTbGlwc1wiO1xuaW1wb3J0IHsgb25GZWRlcmF0ZWRNc2cgfSBmcm9tIFwiLi9oYW5kbGVyc1wiO1xuaW1wb3J0IHsgc3RhdGUsIE5PX09QIH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGZWRlcmF0aW9uQ2xpZW50IHtcblx0Y29uc3RydWN0b3IoIHRhcmdldCwgb3B0aW9ucywgaW5zdGFuY2VJZCApIHtcblx0XHR0aGlzLnRhcmdldCA9IHRhcmdldDtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdHRoaXMucGluZ3MgPSB7fTtcblx0XHR0aGlzLmluc3RhbmNlSWQgPSBpbnN0YW5jZUlkO1xuXHRcdHRoaXMuaGFuZHNoYWtlQ29tcGxldGUgPSBmYWxzZTtcblx0fVxuXG5cdHNlbmRQaW5nKCBjYWxsYmFjayApIHtcblx0XHRjb25zdCBwYWNraW5nU2xpcCA9IGdldFBhY2tpbmdTbGlwKCBcInBpbmdcIiApO1xuXHRcdHRoaXMucGluZ3NbcGFja2luZ1NsaXAudGlja2V0XSA9IHtcblx0XHRcdHRpY2tldDogcGFja2luZ1NsaXAudGlja2V0LFxuXHRcdFx0Y2FsbGJhY2s6IGNhbGxiYWNrIHx8IE5PX09QXG5cdFx0fTtcblx0XHR0aGlzLnNlbmQoIHBhY2tpbmdTbGlwICk7XG5cdH1cblxuXHRzZW5kUG9uZyggb3JpZ1BhY2tpbmdTbGlwICkge1xuXHRcdHRoaXMuc2VuZCggZ2V0UGFja2luZ1NsaXAoIFwicG9uZ1wiLCBvcmlnUGFja2luZ1NsaXAgKSApO1xuXHR9XG5cblx0c2VuZEJ1bmRsZSggc2xpcHMgKSB7XG5cdFx0dGhpcy5zZW5kKCBnZXRQYWNraW5nU2xpcCggXCJidW5kbGVcIiwgc2xpcHMgKSApO1xuXHR9XG5cblx0c2VuZE1lc3NhZ2UoIGVudmVsb3BlICkge1xuXHRcdGlmICggIXRoaXMuaGFuZHNoYWtlQ29tcGxldGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVudmVsb3BlLm9yaWdpbklkID0gZW52ZWxvcGUub3JpZ2luSWQgfHwgcG9zdGFsLmluc3RhbmNlSWQoKTtcblx0XHRjb25zdCBlbnYgPSBfLmNsb25lKCBlbnZlbG9wZSApO1xuXHRcdGlmICggdGhpcy5pbnN0YW5jZUlkICYmIHRoaXMuaW5zdGFuY2VJZCAhPT0gZW52Lmxhc3RTZW5kZXIgJiZcblx0XHQoICFlbnYua25vd25JZHMgfHwgIWVudi5rbm93bklkcy5sZW5ndGggfHxcblx0XHQoIGVudi5rbm93bklkcyAmJiAhXy5pbmNsdWRlKCBlbnYua25vd25JZHMsIHRoaXMuaW5zdGFuY2VJZCApICkgKVxuXHRcdCkge1xuXHRcdFx0ZW52Lmtub3duSWRzID0gKCBlbnYua25vd25JZHMgfHwgW10gKS5jb25jYXQoIF8ud2l0aG91dCggc3RhdGUuX2NsaWVudHMsIHRoaXMuaW5zdGFuY2VJZCApICk7XG5cdFx0XHR0aGlzLnNlbmQoIGdldFBhY2tpbmdTbGlwKCBcIm1lc3NhZ2VcIiwgZW52ICkgKTtcblx0XHR9XG5cdH1cblxuXHRkaXNjb25uZWN0KCkge1xuXHRcdHRoaXMuc2VuZCggZ2V0UGFja2luZ1NsaXAoIFwiZGlzY29ubmVjdFwiICkgKTtcblx0fVxuXG5cdG9uTWVzc2FnZSggcGFja2luZ1NsaXAgKSB7XG5cdFx0aWYgKCB0aGlzLnNob3VsZFByb2Nlc3MoKSApIHtcblx0XHRcdG9uRmVkZXJhdGVkTXNnKCB7XG5cdFx0XHRcdHRyYW5zcG9ydDogdGhpcy50cmFuc3BvcnROYW1lLFxuXHRcdFx0XHRwYWNraW5nU2xpcDogcGFja2luZ1NsaXAsXG5cdFx0XHRcdHNvdXJjZTogdGhpc1xuXHRcdFx0fSApO1xuXHRcdH1cblx0fVxuXG5cdHNob3VsZFByb2Nlc3MoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRzZW5kKCAvKiBtc2cgKi8gKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCBcIkFuIG9iamVjdCBkZXJpdmluZyBmcm9tIEZlZGVyYXRpb25DbGllbnQgbXVzdCBwcm92aWRlIGFuIGltcGxlbWVudGF0aW9uIGZvciAnc2VuZCcuXCIgKTtcblx0fVxuXG5cdHNldEluc3RhbmNlSWQoIGlkICkge1xuXHRcdHRoaXMuaW5zdGFuY2VJZCA9IGlkO1xuXHR9XG5cblx0c3RhdGljIGV4dGVuZCggcHJvcHMsIGN0clByb3BzICkge1xuXHRcdGZ1bmN0aW9uIEZlZFhDbGllbnQoKSB7XG5cdFx0XHRGZWRlcmF0aW9uQ2xpZW50LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR9XG5cblx0XHRGZWRYQ2xpZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlICk7XG5cdFx0Xy5leHRlbmQoIEZlZFhDbGllbnQucHJvdG90eXBlLCBwcm9wcyApO1xuXHRcdF8uZXh0ZW5kKCBGZWRYQ2xpZW50LCBjdHJQcm9wcyApO1xuXG5cdFx0cmV0dXJuIEZlZFhDbGllbnQ7XG5cdH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL0ZlZGVyYXRpb25DbGllbnQuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9