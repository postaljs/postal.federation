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
	var NO_OP = _state.NO_OP;
	
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCAxYTQxZTI0MWZmOGUzNmM2MzFlYiIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInJvb3RcIjpcIl9cIixcImNvbW1vbmpzXCI6XCJsb2Rhc2hcIixcImNvbW1vbmpzMlwiOlwibG9kYXNoXCIsXCJhbWRcIjpcImxvZGFzaFwifSIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJwb3N0YWxcIiIsIndlYnBhY2s6Ly8vLi9zcmMvcG9zdGFsLXV0aWxzLmpzIiwid2VicGFjazovLy8uL3NyYy9wYWNraW5nU2xpcHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0YXRlLmpzIiwid2VicGFjazovLy8uL3NyYy9oYW5kbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvRmVkZXJhdGlvbkNsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7OztLQ3RDTyxDQUFDLHVDQUFNLENBQVE7O0tBQ2YsTUFBTSx1Q0FBTSxDQUFROztxQkFDcEIsQ0FBZ0I7O3lDQUNzQixDQUFnQjs7S0FBcEQsWUFBWSxpQkFBWixZQUFZO0tBQUUsY0FBYyxpQkFBZCxjQUFjOztrQ0FDSSxDQUFTOztLQUF6QyxLQUFLLFVBQUwsS0FBSztLQUFFLFVBQVUsVUFBVixVQUFVO0tBQUUsS0FBSyxVQUFMLEtBQUs7O3FDQUN3QixDQUFZOztLQUE1RCxRQUFRLGFBQVIsUUFBUTtLQUFFLGNBQWMsYUFBZCxjQUFjO0tBQUUsY0FBYyxhQUFkLGNBQWM7O0tBQzFDLGdCQUFnQix1Q0FBTSxDQUFvQjs7a0JBRWxDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHO0FBQ25DLGtCQUFnQixFQUFFLGdCQUFnQjtBQUNsQyxjQUFZLEVBQUUsWUFBWTtBQUMxQixVQUFRLEVBQUUsUUFBUTtBQUNsQixTQUFPLEVBQUUsS0FBSyxDQUFDLFFBQVE7QUFDdkIsWUFBVSxFQUFFLEtBQUssQ0FBQyxXQUFXO0FBQzdCLFNBQU8sRUFBRTtBQUNSLE9BQUksRUFBRSxFQUFFO0FBQ1IsTUFBRyxFQUFFLEVBQUU7R0FDUDtBQUNELFdBQVMsRUFBRSxtQkFBVSxPQUFPLEVBQUc7QUFDOUIsVUFBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFFLEdBQUcsT0FBTyxHQUFHLENBQUUsT0FBTyxDQUFFLENBQUM7QUFDdkQsSUFBQyxDQUFDLElBQUksQ0FBRSxPQUFPLEVBQUUsVUFBVSxNQUFNLEVBQUc7QUFDbkMsVUFBTSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDO0FBQ3JFLEtBQUMsQ0FBQyxJQUFJLENBQUksTUFBTSxDQUFDLFNBQVMsS0FBSyxNQUFNLEdBQUssQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLEdBQUcsQ0FBRSxNQUFNLENBQUMsU0FBUyxDQUFFLEVBQUUsVUFBVSxHQUFHLEVBQUc7QUFDakcsU0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFHO0FBQ3pDLFVBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUUsTUFBTSxDQUFDLEtBQUssQ0FBRSxDQUFDO01BQ3JELE1BQU0sSUFBSyxDQUFHLENBQUMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBSSxFQUFHO0FBQy9FLFVBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBRSxNQUFNLENBQUMsS0FBSyxDQUFFLENBQUM7TUFDdkQ7S0FDRCxFQUFFLElBQUksQ0FBRSxDQUFDO0lBQ1YsRUFBRSxJQUFJLENBQUUsQ0FBQztHQUNWO0FBQ0QsY0FBWSxFQUFFLHNCQUFVLE9BQU8sRUFBRztBQUNqQyxVQUFPLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUUsR0FBRyxPQUFPLEdBQUcsQ0FBRSxPQUFPLENBQUUsQ0FBQztBQUN2RCxJQUFDLENBQUMsSUFBSSxDQUFFLE9BQU8sRUFBRSxVQUFVLE1BQU0sRUFBRztBQUNuQyxVQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUM7QUFDckUsS0FBQyxDQUFDLElBQUksQ0FBSSxNQUFNLENBQUMsU0FBUyxLQUFLLE1BQU0sR0FBSyxDQUFFLElBQUksRUFBRSxLQUFLLENBQUUsR0FBRyxDQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUUsRUFBRSxVQUFVLEdBQUcsRUFBRztBQUNqRyxTQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBRSxFQUFHO0FBQ3hHLFVBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUUs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Q25CLFNBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDO0tBQ3JCOzs7QUFFTSxTQUFNO1dBQUEsZ0JBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRztBQUNoQyxjQUFTLFVBQVUsR0FBRztBQUNyQixzQkFBZ0IsQ0FBQyxLQUFLLENBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBRSxDQUFDO01BQzFDOztBQUVELGVBQVUsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBRSxnQkFBZ0IsQ0FBQyxTQUFTLENBQUUsQ0FBQztBQUNuRSxNQUFDLENBQUMsTUFBTSxDQUFFLFVBQVUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFFLENBQUM7QUFDeEMsTUFBQyxDQUFDLE1BQU0sQ0FBRSxVQUFVLEVBQUUsUUFBUSxDQUFFLENBQUM7O0FBRWpDLFlBQU8sVUFBVSxDQUFDO0tBQ2xCOzs7O1NBN0VtQixnQkFBZ0I7OztrQkFBaEIsZ0JBQWdCIiwiZmlsZSI6InBvc3RhbC5mZWRlcmF0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeShyZXF1aXJlKFwibG9kYXNoXCIpLCByZXF1aXJlKFwicG9zdGFsXCIpKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKFtcImxvZGFzaFwiLCBcInBvc3RhbFwiXSwgZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJwb3N0YWxGZWR4XCJdID0gZmFjdG9yeShyZXF1aXJlKFwibG9kYXNoXCIpLCByZXF1aXJlKFwicG9zdGFsXCIpKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJwb3N0YWxGZWR4XCJdID0gZmFjdG9yeShyb290W1wiX1wiXSwgcm9vdFtcInBvc3RhbFwiXSk7XG59KSh0aGlzLCBmdW5jdGlvbihfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzFfXywgX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8yX18pIHtcbnJldHVybiBcblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL3VuaXZlcnNhbE1vZHVsZURlZmluaXRpb25cbiAqKi8iLCIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIHdlYnBhY2svYm9vdHN0cmFwIDFhNDFlMjQxZmY4ZTM2YzYzMWViXG4gKiovIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHBvc3RhbCBmcm9tIFwicG9zdGFsXCI7XG5pbXBvcnQgXCIuL3Bvc3RhbC11dGlsc1wiO1xuaW1wb3J0IHsgcGFja2luZ1NsaXBzLCBnZXRQYWNraW5nU2xpcCB9IGZyb20gXCIuL3BhY2tpbmdTbGlwc1wiO1xuaW1wb3J0IHsgc3RhdGUsIGRpc2Nvbm5lY3QsIE5PX09QIH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCB7IGhhbmRsZXJzLCBvbkZlZGVyYXRlZE1zZywgX21hdGNoZXNGaWx0ZXIgfSBmcm9tIFwiLi9oYW5kbGVyc1wiO1xuaW1wb3J0IEZlZGVyYXRpb25DbGllbnQgZnJvbSBcIi4vRmVkZXJhdGlvbkNsaWVudFwiO1xuXG5leHBvcnQgZGVmYXVsdCBmZWR4ID0gcG9zdGFsLmZlZHggPSB7XG5cdEZlZGVyYXRpb25DbGllbnQ6IEZlZGVyYXRpb25DbGllbnQsXG5cdHBhY2tpbmdTbGlwczogcGFja2luZ1NsaXBzLFxuXHRoYW5kbGVyczogaGFuZGxlcnMsXG5cdGNsaWVudHM6IHN0YXRlLl9jbGllbnRzLFxuXHR0cmFuc3BvcnRzOiBzdGF0ZS5fdHJhbnNwb3J0cyxcblx0ZmlsdGVyczoge1xuXHRcdFwiaW5cIjoge30sIC8vIGpzY3M6aWdub3JlIGRpc2FsbG93UXVvdGVkS2V5c0luT2JqZWN0c1xuXHRcdG91dDoge31cblx0fSxcblx0YWRkRmlsdGVyOiBmdW5jdGlvbiggZmlsdGVycyApIHtcblx0XHRmaWx0ZXJzID0gXy5pc0FycmF5KCBmaWx0ZXJzICkgPyBmaWx0ZXJzIDogWyBmaWx0ZXJzIF07XG5cdFx0Xy5lYWNoKCBmaWx0ZXJzLCBmdW5jdGlvbiggZmlsdGVyICkge1xuXHRcdFx0ZmlsdGVyLmRpcmVjdGlvbiA9IGZpbHRlci5kaXJlY3Rpb24gfHwgc3RhdGUuX2NvbmZpZy5maWx0ZXJEaXJlY3Rpb247XG5cdFx0XHRfLmVhY2goICggZmlsdGVyLmRpcmVjdGlvbiA9PT0gXCJib3RoXCIgKSA/IFsgXCJpblwiLCBcIm91dFwiIF0gOiBbIGZpbHRlci5kaXJlY3Rpb24gXSwgZnVuY3Rpb24oIGRpciApIHtcblx0XHRcdFx0aWYgKCAhdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSA9IFsgZmlsdGVyLnRvcGljIF07XG5cdFx0XHRcdH0gZWxzZSBpZiAoICEoIF8uaW5jbHVkZSggdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLCBmaWx0ZXIudG9waWMgKSApICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXS5wdXNoKCBmaWx0ZXIudG9waWMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcyApO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblx0cmVtb3ZlRmlsdGVyOiBmdW5jdGlvbiggZmlsdGVycyApIHtcblx0XHRmaWx0ZXJzID0gXy5pc0FycmF5KCBmaWx0ZXJzICkgPyBmaWx0ZXJzIDogWyBmaWx0ZXJzIF07XG5cdFx0Xy5lYWNoKCBmaWx0ZXJzLCBmdW5jdGlvbiggZmlsdGVyICkge1xuXHRcdFx0ZmlsdGVyLmRpcmVjdGlvbiA9IGZpbHRlci5kaXJlY3Rpb24gfHwgc3RhdGUuX2NvbmZpZy5maWx0ZXJEaXJlY3Rpb247XG5cdFx0XHRfLmVhY2goICggZmlsdGVyLmRpcmVjdGlvbiA9PT0gXCJib3RoXCIgKSA/IFsgXCJpblwiLCBcIm91dFwiIF0gOiBbIGZpbHRlci5kaXJlY3Rpb24gXSwgZnVuY3Rpb24oIGRpciApIHtcblx0XHRcdFx0aWYgKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0gJiYgXy5pbmNsdWRlKCB0aGlzLmZpbHRlcnNbZGlyXVtmaWx0ZXIuY2hhbm5lbF0sIGZpbHRlci50b3BpYyApICkge1xuXHRcdFx0XHRcdHRoaXMuZmlsdGVyc1tkaXJdW2ZpbHRlci5jaGFubmVsXSA9IF8ud2l0aG91dCggdGhpcy5maWx0ZXJzW2Rpcl1bZmlsdGVyLmNoYW5uZWxdLCBmaWx0ZXIudG9waWMgKTtcblx0XHRcdFx0fVxuXHRcdFx0fSwgdGhpcyApO1xuXHRcdH0sIHRoaXMgKTtcblx0fSxcblx0Y2FuU2VuZFJlbW90ZTogZnVuY3Rpb24oIGNoYW5uZWwsIHRvcGljICkge1xuXHRcdHJldHVybiBfbWF0Y2hlc0ZpbHRlciggY2hhbm5lbCwgdG9waWMsIFwib3V0XCIgKTtcblx0fSxcblx0Z2V0UGFja2luZ1NsaXAsXG5cdG9uRmVkZXJhdGVkTXNnOiBvbkZlZGVyYXRlZE1zZyxcblx0c2VuZE1lc3NhZ2U6IGZ1bmN0aW9uKCBlbnZlbG9wZSApIHtcblx0XHRpZiAoICFzdGF0ZS5fcmVhZHkgKSB7XG5cdFx0XHRzdGF0ZS5fb3V0Ym91bmRRdWV1ZS5wdXNoKCBhcmd1bWVudHMgKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Xy5lYWNoKCB0aGlzLnRyYW5zcG9ydHMsIGZ1bmN0aW9uKCB0cmFuc3BvcnQgKSB7XG5cdFx0XHR0cmFuc3BvcnQuc2VuZE1lc3NhZ2UoIGVudmVsb3BlICk7XG5cdFx0fSApO1xuXHR9LFxuXHRkaXNjb25uZWN0OiBkaXNjb25uZWN0LFxuXHRfZ2V0VHJhbnNwb3J0czogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIF8ucmVkdWNlKCB0aGlzLnRyYW5zcG9ydHMsIGZ1bmN0aW9uKCBtZW1vLCB0cmFuc3BvcnQsIG5hbWUgKSB7XG5cdFx0XHRtZW1vW25hbWVdID0gdHJ1ZTtcblx0XHRcdHJldHVybiBtZW1vO1xuXHRcdH0sIHt9ICk7XG5cdH0sXG5cdC8qXG5cdFx0c2lnbmFsUmVhZHkoIGNhbGxiYWNrICk7XG5cdFx0c2lnbmFsUmVhZHkoIFwidHJhbnNwb3J0TmFtZVwiICk7XG5cdFx0c2lnbmFsUmVhZHkoIFwidHJhbnNwb3J0TmFtZVwiLCBjYWxsYmFjayApO1xuXHRcdHNpZ25hbFJlYWR5KCBcInRyYW5zcG9ydE5hbWVcIiwgdGFyZ2V0SW5zdGFuY2UsIGNhbGxiYWNrICk7IDwtLSB0aGlzIGlzIE5FV1xuXHRcdHNpZ25hbFJlYWR5KCB7IHRyYW5zcG9ydE5hbWVBOiB0YXJnZXRzRm9yQSwgdHJhbnNwb3J0TmFtZUI6IHRhcmdldHNGb3JCLCB0cmFuc3BvcnRDOiB0cnVlIH0sIGNhbGxiYWNrKTtcblx0Ki9cblx0c2lnbmFsUmVhZHk6IGZ1bmN0aW9uKCB0cmFuc3BvcnQsIHRhcmdldCwgY2FsbGJhY2sgKSB7XG5cdFx0aWYgKCAhc3RhdGUuX3JlYWR5ICkge1xuXHRcdFx0c3RhdGUuX3NpZ25hbFF1ZXVlLnB1c2goIGFyZ3VtZW50cyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRsZXQgdHJhbnNwb3J0cyA9IHRoaXMuX2dldFRyYW5zcG9ydHMoKTtcblx0XHRzd2l0Y2ggKCBhcmd1bWVudHMubGVuZ3RoICkge1xuXHRcdGNhc2UgMTpcblx0XHRcdGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJmdW5jdGlvblwiICkge1xuXHRcdFx0XHRjYWxsYmFjayA9IHRyYW5zcG9ydDtcblx0XHRcdH0gZWxzZSBpZiAoIHR5cGVvZiB0cmFuc3BvcnQgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdFx0dHJhbnNwb3J0c1t0cmFuc3BvcnRdID0gdGhpcy50cmFuc3BvcnRzW3RyYW5zcG9ydF07XG5cdFx0XHRcdGNhbGxiYWNrID0gTk9fT1A7XG5cdFx0XHR9XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDI6XG5cdFx0XHRpZiAoIHR5cGVvZiB0cmFuc3BvcnQgPT09IFwic3RyaW5nXCIgKSB7XG5cdFx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdFx0dHJhbnNwb3J0c1t0cmFuc3BvcnRdID0gdGhpcy50cmFuc3BvcnRzW3RyYW5zcG9ydF07XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0cmFuc3BvcnRzID0gdHJhbnNwb3J0O1xuXHRcdFx0fVxuXHRcdFx0Y2FsbGJhY2sgPSB0YXJnZXQgfHwgTk9fT1A7XG5cdFx0XHRicmVhaztcblx0XHRjYXNlIDM6XG5cdFx0XHR0cmFuc3BvcnRzID0ge307XG5cdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSBbIHRhcmdldCBdO1xuXHRcdFx0YnJlYWs7XG5cdFx0fVxuXHRcdF8uZWFjaCggdHJhbnNwb3J0cywgZnVuY3Rpb24oIHRhcmdldHMsIG5hbWUgKSB7XG5cdFx0XHR0YXJnZXRzID0gdHlwZW9mIHRhcmdldHMgPT09IFwiYm9vbGVhblwiID8gW10gOiB0YXJnZXRzO1xuXHRcdFx0dGhpcy50cmFuc3BvcnRzW25hbWVdLnNpZ25hbFJlYWR5KCB0YXJnZXRzLCBjYWxsYmFjayApO1xuXHRcdH0sIHRoaXMgKTtcblx0fVxufTtcblxuZnVuY3Rpb24gcHJvY2Vzc1NpZ25hbFEoIGFyZ3MgKSB7XG5cdGZlZHguc2lnbmFsUmVhZHkuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc091dGJvdW5kUSggYXJncyApIHtcblx0ZmVkeC5zZW5kLmFwcGx5KCB0aGlzLCBhcmdzICk7XG59XG5cbmZ1bmN0aW9uIHByb2Nlc3NJbmJvdW5kUSggbXNnICkge1xuXHRmZWR4Lm9uRmVkZXJhdGVkTXNnLmNhbGwoIHRoaXMsIG1zZyApO1xufVxuXG5wb3N0YWwuYWRkV2lyZVRhcCggZnVuY3Rpb24oIGRhdGEsIGVudmVsb3BlICkge1xuXHRpZiAoIGZlZHguY2FuU2VuZFJlbW90ZSggZW52ZWxvcGUuY2hhbm5lbCwgZW52ZWxvcGUudG9waWMgKSApIHtcblx0XHRmZWR4LnNlbmRNZXNzYWdlKCBlbnZlbG9wZSApO1xuXHR9XG59ICk7XG5cbnBvc3RhbC5zdWJzY3JpYmUoIHtcblx0Y2hhbm5lbDogcG9zdGFsLmNvbmZpZ3VyYXRpb24uU1lTVEVNX0NIQU5ORUwsXG5cdHRvcGljOiBcImluc3RhbmNlSWQuY2hhbmdlZFwiLFxuXHRjYWxsYmFjazogZnVuY3Rpb24oKSB7XG5cdFx0c3RhdGUuX3JlYWR5ID0gdHJ1ZTtcblx0XHR3aGlsZSAoIHN0YXRlLl9zaWduYWxRdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRwcm9jZXNzU2lnbmFsUSggc3RhdGUuX3NpZ25hbFF1ZXVlLnNoaWZ0KCkgKTtcblx0XHR9XG5cdFx0d2hpbGUgKCBzdGF0ZS5fb3V0Ym91bmRRdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRwcm9jZXNzT3V0Ym91bmRRKCBzdGF0ZS5fb3V0Ym91bmRRdWV1ZS5zaGlmdCgpICk7XG5cdFx0fVxuXHRcdHdoaWxlICggc3RhdGUuX2luYm91bmRRdWV1ZS5sZW5ndGggKSB7XG5cdFx0XHRwcm9jZXNzSW5ib3VuZFEoIHN0YXRlLl9pbmJvdW5kUXVldWUuc2hpZnQoKSApO1xuXHRcdH1cblx0fVxufSApO1xuXG5pZiAoIHBvc3RhbC5pbnN0YW5jZUlkKCkgIT09IHVuZGVmaW5lZCApIHtcblx0c3RhdGUuX3JlYWR5ID0gdHJ1ZTtcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2luZGV4LmpzXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzFfXztcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIGV4dGVybmFsIHtcInJvb3RcIjpcIl9cIixcImNvbW1vbmpzXCI6XCJsb2Rhc2hcIixcImNvbW1vbmpzMlwiOlwibG9kYXNoXCIsXCJhbWRcIjpcImxvZGFzaFwifVxuICoqIG1vZHVsZSBpZCA9IDFcbiAqKiBtb2R1bGUgY2h1bmtzID0gMFxuICoqLyIsIm1vZHVsZS5leHBvcnRzID0gX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8yX187XG5cblxuLyoqKioqKioqKioqKioqKioqXG4gKiogV0VCUEFDSyBGT09URVJcbiAqKiBleHRlcm5hbCBcInBvc3RhbFwiXG4gKiogbW9kdWxlIGlkID0gMlxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwiaW1wb3J0IHBvc3RhbCBmcm9tIFwicG9zdGFsXCI7XG5cbmlmICggIXBvc3RhbC5jcmVhdGVVVUlEICkge1xuXHRwb3N0YWwuY3JlYXRlVVVJRCA9IGZ1bmN0aW9uKCkge1xuXHRcdGxldCBzID0gW107XG5cdFx0Y29uc3QgaGV4RGlnaXRzID0gXCIwMTIzNDU2Nzg5YWJjZGVmXCI7XG5cdFx0Zm9yICggbGV0IGkgPSAwOyBpIDwgMzY7IGkrKyApIHtcblx0XHRcdHNbaV0gPSBoZXhEaWdpdHMuc3Vic3RyKCBNYXRoLmZsb29yKCBNYXRoLnJhbmRvbSgpICogMHgxMCApLCAxICk7XG5cdFx0fVxuXHRcdHNbMTRdID0gXCI0XCI7IC8vIGJpdHMgMTItMTUgb2YgdGhlIHRpbWVfaGlfYW5kX3ZlcnNpb24gZmllbGQgdG8gMDAxMFxuXHRcdC8qIGpzaGludCBpZ25vcmU6c3RhcnQgKi9cblx0XHRzWzE5XSA9IGhleERpZ2l0cy5zdWJzdHIoICggc1sxOV0gJiAweDMgKSB8IDB4OCwgMSApOyAvLyBiaXRzIDYtNyBvZiB0aGUgY2xvY2tfc2VxX2hpX2FuZF9yZXNlcnZlZCB0byAwMVxuXHRcdC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG5cdFx0c1s4XSA9IHNbMTNdID0gc1sxOF0gPSBzWzIzXSA9IFwiLVwiO1xuXHRcdHJldHVybiBzLmpvaW4oIFwiXCIgKTtcblx0fTtcbn1cbmlmICggIXBvc3RhbC5pbnN0YW5jZUlkICkge1xuXHRwb3N0YWwuaW5zdGFuY2VJZCA9ICggZnVuY3Rpb24oKSB7XG5cdFx0bGV0IF9pZCwgX29sZElkO1xuXHRcdHJldHVybiBmdW5jdGlvbiggaWQgKSB7XG5cdFx0XHRpZiAoIGlkICkge1xuXHRcdFx0XHRfb2xkSWQgPSBfaWQ7XG5cdFx0XHRcdF9pZCA9IGlkO1xuXHRcdFx0XHRwb3N0YWwucHVibGlzaCgge1xuXHRcdFx0XHRcdGNoYW5uZWw6IHBvc3RhbC5jb25maWd1cmF0aW9uLlNZU1RFTV9DSEFOTkVMLFxuXHRcdFx0XHRcdHRvcGljOiBcImluc3RhbmNlSWQuY2hhbmdlZFwiLFxuXHRcdFx0XHRcdGRhdGE6IHtcblx0XHRcdFx0XHRcdG9sZElkOiBfb2xkSWQsXG5cdFx0XHRcdFx0XHRuZXdJZDogX2lkXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9ICk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gX2lkO1xuXHRcdH07XG5cdH0oKSApO1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvcG9zdGFsLXV0aWxzLmpzXG4gKiovIiwiaW1wb3J0IHBvc3RhbCBmcm9tIFwicG9zdGFsXCI7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYWNraW5nU2xpcCggdHlwZSAvKiwgZW52ICovICkge1xuXHRpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggcGFja2luZ1NsaXBzLCB0eXBlICkgKSB7XG5cdFx0cmV0dXJuIHBhY2tpbmdTbGlwc1sgdHlwZSBdLmFwcGx5KCB0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbCggYXJndW1lbnRzLCAxICkgKTtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgcGFja2luZ1NsaXBzID0ge1xuXHRwaW5nOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLnBpbmdcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0XHR0aWNrZXQ6IHBvc3RhbC5jcmVhdGVVVUlEKClcblx0XHR9O1xuXHR9LFxuXHRwb25nOiBmdW5jdGlvbiggcGluZyApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLnBvbmdcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0XHRwaW5nRGF0YToge1xuXHRcdFx0XHRpbnN0YW5jZUlkOiBwaW5nLmluc3RhbmNlSWQsXG5cdFx0XHRcdHRpbWVTdGFtcDogcGluZy50aW1lU3RhbXAsXG5cdFx0XHRcdHRpY2tldDogcGluZy50aWNrZXRcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXHRtZXNzYWdlOiBmdW5jdGlvbiggZW52ICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ubWVzc2FnZVwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdGVudmVsb3BlOiBlbnZcblx0XHR9O1xuXHR9LFxuXHRkaXNjb25uZWN0OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLmRpc2Nvbm5lY3RcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKClcblx0XHR9O1xuXHR9LFxuXHRidW5kbGU6IGZ1bmN0aW9uKCBwYWNraW5nU2xpcHMgKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5idW5kbGVcIixcblx0XHRcdGluc3RhbmNlSWQ6IHBvc3RhbC5pbnN0YW5jZUlkKCksXG5cdFx0XHR0aW1lU3RhbXA6IG5ldyBEYXRlKCksXG5cdFx0XHRwYWNraW5nU2xpcHM6IHBhY2tpbmdTbGlwc1xuXHRcdH07XG5cdH1cbn07XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wYWNraW5nU2xpcHMuanNcbiAqKi8iLCJpbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5cbmNvbnN0IF9kZWZhdWx0cyA9IHtcblx0ZW5hYmxlZDogdHJ1ZSxcblx0ZmlsdGVyTW9kZTogXCJ3aGl0ZWxpc3RcIixcblx0ZmlsdGVyRGlyZWN0aW9uOiBcImJvdGhcIlxufTtcblxuZXhwb3J0IGNvbnN0IE5PX09QID0gZnVuY3Rpb24oKSB7fTtcblxuZXhwb3J0IGxldCBzdGF0ZSA9IHtcblx0X2NsaWVudHM6IFtdLFxuXHRfdHJhbnNwb3J0czoge30sXG5cdF9yZWFkeTogZmFsc2UsXG5cdF9pbmJvdW5kUXVldWU6IFtdLFxuXHRfb3V0Ym91bmRRdWV1ZTogW10sXG5cdF9zaWduYWxRdWV1ZTogW10sXG5cdF9jb25maWc6IF9kZWZhdWx0c1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZSggY2ZnICkge1xuXHRpZiAoIGNmZyAmJiBjZmcuZmlsdGVyTW9kZSAmJiBjZmcuZmlsdGVyTW9kZSAhPT0gXCJibGFja2xpc3RcIiAmJiBjZmcuZmlsdGVyTW9kZSAhPT0gXCJ3aGl0ZWxpc3RcIiApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoIFwicG9zdGFsLmZlZHggZmlsdGVyTW9kZSBtdXN0IGJlICdibGFja2xpc3QnIG9yICd3aGl0ZWxpc3QnLlwiICk7XG5cdH1cblx0aWYgKCBjZmcgKSB7XG5cdFx0c3RhdGUuX2NvbmZpZyA9IF8uZGVmYXVsdHMoIGNmZywgX2RlZmF1bHRzICk7XG5cdH1cblx0cmV0dXJuIHN0YXRlLl9jb25maWc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNjb25uZWN0KCBvcHRpb25zICkge1xuXHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblx0bGV0IHRyYW5zID0gc3RhdGUuX3RyYW5zcG9ydHM7XG5cdGlmICggb3B0aW9ucy50cmFuc3BvcnQgKSB7XG5cdFx0dHJhbnMgPSB7fTtcblx0XHR0cmFuc1tvcHRpb25zLnRyYW5zcG9ydF0gPSBzdGF0ZS5fdHJhbnNwb3J0c1tvcHRpb25zLnRyYW5zcG9ydF07XG5cdH1cblx0Xy5lYWNoKCB0cmFucywgZnVuY3Rpb24oIHQgKSB7XG5cdFx0dC5kaXNjb25uZWN0KCB7XG5cdFx0XHR0YXJnZXQ6IG9wdGlvbnMudGFyZ2V0LFxuXHRcdFx0aW5zdGFuY2VJZDogb3B0aW9ucy5pbnN0YW5jZUlkLFxuXHRcdFx0ZG9Ob3ROb3RpZnk6ICEhb3B0aW9ucy5kb05vdE5vdGlmeVxuXHRcdH0gKTtcblx0fSApO1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvc3RhdGUuanNcbiAqKi8iLCJpbXBvcnQgeyBnZXRQYWNraW5nU2xpcCB9IGZyb20gXCIuL3BhY2tpbmdTbGlwc1wiO1xuaW1wb3J0IHsgc3RhdGUsIGRpc2Nvbm5lY3QgfSBmcm9tIFwiLi9zdGF0ZVwiO1xuXG5leHBvcnQgZnVuY3Rpb24gX21hdGNoZXNGaWx0ZXIoIGNoYW5uZWwsIHRvcGljLCBkaXJlY3Rpb24gKSB7XG5cdGNvbnN0IGNoYW5uZWxQcmVzZW50ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBmZWR4LmZpbHRlcnNbZGlyZWN0aW9uXSwgY2hhbm5lbCApO1xuXHRjb25zdCB0b3BpY01hdGNoID0gKCBjaGFubmVsUHJlc2VudCAmJiBfLmFueSggZmVkeC5maWx0ZXJzW2RpcmVjdGlvbl1bY2hhbm5lbF0sIGZ1bmN0aW9uKCBiaW5kaW5nICkge1xuXHRcdHJldHVybiBwb3N0YWwuY29uZmlndXJhdGlvbi5yZXNvbHZlci5jb21wYXJlKCBiaW5kaW5nLCB0b3BpYyApO1xuXHR9ICkgKTtcblx0Y29uc3QgYmxhY2tsaXN0aW5nID0gc3RhdGUuX2NvbmZpZy5maWx0ZXJNb2RlID09PSBcImJsYWNrbGlzdFwiO1xuXHRyZXR1cm4gc3RhdGUuX2NvbmZpZy5lbmFibGVkICYmICggKCBibGFja2xpc3RpbmcgJiYgKCAhY2hhbm5lbFByZXNlbnQgfHwgKCBjaGFubmVsUHJlc2VudCAmJiAhdG9waWNNYXRjaCApICkgKSB8fCAoICFibGFja2xpc3RpbmcgJiYgY2hhbm5lbFByZXNlbnQgJiYgdG9waWNNYXRjaCApICk7XG59XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVycyA9IHtcblx0XCJmZWRlcmF0aW9uLnBpbmdcIjogZnVuY3Rpb24oIGRhdGEgLyosIGNhbGxiYWNrICovICkge1xuXHRcdGRhdGEuc291cmNlLnNldEluc3RhbmNlSWQoIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdGlmICggZGF0YS5zb3VyY2UuaGFuZHNoYWtlQ29tcGxldGUgKSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5zZW5kUG9uZyggZGF0YS5wYWNraW5nU2xpcCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5zZW5kQnVuZGxlKCBbXG5cdFx0XHRnZXRQYWNraW5nU2xpcCggXCJwb25nXCIsIGRhdGEucGFja2luZ1NsaXAgKSxcblx0XHRcdGdldFBhY2tpbmdTbGlwKCBcInBpbmdcIiApXG5cdFx0XHRdICk7XG5cdFx0fVxuXHR9LFxuXHRcImZlZGVyYXRpb24ucG9uZ1wiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRkYXRhLnNvdXJjZS5oYW5kc2hha2VDb21wbGV0ZSA9IHRydWU7XG5cdFx0ZGF0YS5zb3VyY2Uuc2V0SW5zdGFuY2VJZCggZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICk7XG5cdFx0aWYgKCBkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0gKSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0uY2FsbGJhY2soIHtcblx0XHRcdFx0dGlja2V0OiBkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldCxcblx0XHRcdFx0aW5zdGFuY2VJZDogZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkLFxuXHRcdFx0XHRzb3VyY2U6IGRhdGEuc291cmNlXG5cdFx0XHR9ICk7XG5cdFx0XHRkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0gPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGlmICggIV8uY29udGFpbnMoIHN0YXRlLl9jbGllbnRzLCBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQgKSApIHtcblx0XHRcdHN0YXRlLl9jbGllbnRzLnB1c2goIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdH1cblx0XHRwb3N0YWwucHVibGlzaCgge1xuXHRcdFx0Y2hhbm5lbDogXCJwb3N0YWwuZmVkZXJhdGlvblwiLFxuXHRcdFx0dG9waWM6IFwiY2xpZW50LmZlZGVyYXRlZFwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRyZW1vdGVJZDogZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCxcblx0XHRcdFx0bG9jYWxJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdFx0dHJhbnNwb3J0OiBkYXRhLnRyYW5zcG9ydFxuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblx0XCJmZWRlcmF0aW9uLmRpc2Nvbm5lY3RcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0c3RhdGUuX2NsaWVudHMgPSBfLndpdGhvdXQoIHN0YXRlLl9jbGllbnRzLCBkYXRhLnNvdXJjZS5pbnN0YW5jZUlkICk7XG5cdFx0ZGlzY29ubmVjdCgge1xuXHRcdFx0dHJhbnNwb3J0OiBkYXRhLnNvdXJjZS50cmFuc3BvcnROYW1lLFxuXHRcdFx0aW5zdGFuY2VJZDogZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCxcblx0XHRcdGRvTm90Tm90aWZ5OiB0cnVlXG5cdFx0fSApO1xuXHR9LFxuXHRcImZlZGVyYXRpb24ubWVzc2FnZVwiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRjb25zdCBlbnYgPSBkYXRhLnBhY2tpbmdTbGlwLmVudmVsb3BlO1xuXHRcdGlmICggX21hdGNoZXNGaWx0ZXIoIGVudi5jaGFubmVsLCBlbnYudG9waWMsIFwiaW5cIiApICkge1xuXHRcdFx0ZW52Lmxhc3RTZW5kZXIgPSBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQ7XG5cdFx0XHRwb3N0YWwucHVibGlzaCggZW52ICk7XG5cdFx0fVxuXHR9LFxuXHRcImZlZGVyYXRpb24uYnVuZGxlXCI6IGZ1bmN0aW9uKCBkYXRhICkge1xuXHRcdF8uZWFjaCggZGF0YS5wYWNraW5nU2xpcC5wYWNraW5nU2xpcHMsIGZ1bmN0aW9uKCBzbGlwICkge1xuXHRcdFx0b25GZWRlcmF0ZWRNc2coIF8uZXh0ZW5kKCB7fSwgZGF0YSwge1xuXHRcdFx0XHRwYWNraW5nU2xpcDogc2xpcFxuXHRcdFx0fSApICk7XG5cdFx0fSApO1xuXHR9XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gb25GZWRlcmF0ZWRNc2coIGRhdGEgKSB7XG5cdGlmICggIXN0YXRlLl9yZWFkeSApIHtcblx0XHRzdGF0ZS5faW5ib3VuZFF1ZXVlLnB1c2goIGRhdGEgKTtcblx0XHRyZXR1cm47XG5cdH1cblx0aWYgKCBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGhhbmRsZXJzLCBkYXRhLnBhY2tpbmdTbGlwLnR5cGUgKSApIHtcblx0XHRoYW5kbGVyc1tkYXRhLnBhY2tpbmdTbGlwLnR5cGVdKCBkYXRhICk7XG5cdH0gZWxzZSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCBcInBvc3RhbC5mZWRlcmF0aW9uIGRvZXMgbm90IGhhdmUgYSBtZXNzYWdlIGhhbmRsZXIgZm9yICdcIiArIGRhdGEucGFja2luZ1NsaXAudHlwZSArIFwiJy5cIiApO1xuXHR9XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9oYW5kbGVycy5qc1xuICoqLyIsImltcG9ydCB7IGdldFBhY2tpbmdTbGlwIH0gZnJvbSBcIi4vcGFja2luZ1NsaXBzXCI7XG5pbXBvcnQgeyBvbkZlZGVyYXRlZE1zZyB9IGZyb20gXCIuL2hhbmRsZXJzXCI7XG5pbXBvcnQgeyBzdGF0ZSwgTk9fT1AgfSBmcm9tIFwiLi9zdGF0ZVwiO1xuaW1wb3J0IHBvc3RhbCBmcm9tIFwicG9zdGFsXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEZlZGVyYXRpb25DbGllbnQge1xuXHRjb25zdHJ1Y3RvciggdGFyZ2V0LCBvcHRpb25zLCBpbnN0YW5jZUlkICkge1xuXHRcdHRoaXMudGFyZ2V0ID0gdGFyZ2V0O1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdFx0dGhpcy5waW5ncyA9IHt9O1xuXHRcdHRoaXMuaW5zdGFuY2VJZCA9IGluc3RhbmNlSWQ7XG5cdFx0dGhpcy5oYW5kc2hha2VDb21wbGV0ZSA9IGZhbHNlO1xuXHR9XG5cblx0c2VuZFBpbmcoIGNhbGxiYWNrICkge1xuXHRcdGNvbnN0IHBhY2tpbmdTbGlwID0gZ2V0UGFja2luZ1NsaXAoIFwicGluZ1wiICk7XG5cdFx0dGhpcy5waW5nc1twYWNraW5nU2xpcC50aWNrZXRdID0ge1xuXHRcdFx0dGlja2V0OiBwYWNraW5nU2xpcC50aWNrZXQsXG5cdFx0XHRjYWxsYmFjazogY2FsbGJhY2sgfHwgTk9fT1Bcblx0XHR9O1xuXHRcdHRoaXMuc2VuZCggcGFja2luZ1NsaXAgKTtcblx0fVxuXG5cdHNlbmRQb25nKCBvcmlnUGFja2luZ1NsaXAgKSB7XG5cdFx0dGhpcy5zZW5kKCBnZXRQYWNraW5nU2xpcCggXCJwb25nXCIsIG9yaWdQYWNraW5nU2xpcCApICk7XG5cdH1cblxuXHRzZW5kQnVuZGxlKCBzbGlwcyApIHtcblx0XHR0aGlzLnNlbmQoIGdldFBhY2tpbmdTbGlwKCBcImJ1bmRsZVwiLCBzbGlwcyApICk7XG5cdH1cblxuXHRzZW5kTWVzc2FnZSggZW52ZWxvcGUgKSB7XG5cdFx0aWYgKCAhdGhpcy5oYW5kc2hha2VDb21wbGV0ZSApIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0ZW52ZWxvcGUub3JpZ2luSWQgPSBlbnZlbG9wZS5vcmlnaW5JZCB8fCBwb3N0YWwuaW5zdGFuY2VJZCgpO1xuXHRcdGNvbnN0IGVudiA9IF8uY2xvbmUoIGVudmVsb3BlICk7XG5cdFx0aWYgKCB0aGlzLmluc3RhbmNlSWQgJiYgdGhpcy5pbnN0YW5jZUlkICE9PSBlbnYubGFzdFNlbmRlciAmJlxuXHRcdCggIWVudi5rbm93bklkcyB8fCAhZW52Lmtub3duSWRzLmxlbmd0aCB8fFxuXHRcdCggZW52Lmtub3duSWRzICYmICFfLmluY2x1ZGUoIGVudi5rbm93bklkcywgdGhpcy5pbnN0YW5jZUlkICkgKSApXG5cdFx0KSB7XG5cdFx0XHRlbnYua25vd25JZHMgPSAoIGVudi5rbm93bklkcyB8fCBbXSApLmNvbmNhdCggXy53aXRob3V0KCBzdGF0ZS5fY2xpZW50cywgdGhpcy5pbnN0YW5jZUlkICkgKTtcblx0XHRcdHRoaXMuc2VuZCggZ2V0UGFja2luZ1NsaXAoIFwibWVzc2FnZVwiLCBlbnYgKSApO1xuXHRcdH1cblx0fVxuXG5cdGRpc2Nvbm5lY3QoKSB7XG5cdFx0dGhpcy5zZW5kKCBnZXRQYWNraW5nU2xpcCggXCJkaXNjb25uZWN0XCIgKSApO1xuXHR9XG5cblx0b25NZXNzYWdlKCBwYWNraW5nU2xpcCApIHtcblx0XHRpZiAoIHRoaXMuc2hvdWxkUHJvY2VzcygpICkge1xuXHRcdFx0b25GZWRlcmF0ZWRNc2coIHtcblx0XHRcdFx0dHJhbnNwb3J0OiB0aGlzLnRyYW5zcG9ydE5hbWUsXG5cdFx0XHRcdHBhY2tpbmdTbGlwOiBwYWNraW5nU2xpcCxcblx0XHRcdFx0c291cmNlOiB0aGlzXG5cdFx0XHR9ICk7XG5cdFx0fVxuXHR9XG5cblx0c2hvdWxkUHJvY2VzcygpIHtcblx0XHRyZXR1cm4gdHJ1ZTtcblx0fVxuXG5cdHNlbmQoIC8qIG1zZyAqLyApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiQW4gb2JqZWN0IGRlcml2aW5nIGZyb20gRmVkZXJhdGlvbkNsaWVudCBtdXN0IHByb3ZpZGUgYW4gaW1wbGVtZW50YXRpb24gZm9yICdzZW5kJy5cIiApO1xuXHR9XG5cblx0c2V0SW5zdGFuY2VJZCggaWQgKSB7XG5cdFx0dGhpcy5pbnN0YW5jZUlkID0gaWQ7XG5cdH1cblxuXHRzdGF0aWMgZXh0ZW5kKCBwcm9wcywgY3RyUHJvcHMgKSB7XG5cdFx0ZnVuY3Rpb24gRmVkWENsaWVudCgpIHtcblx0XHRcdEZlZGVyYXRpb25DbGllbnQuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXHRcdH1cblxuXHRcdEZlZFhDbGllbnQucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZSggRmVkZXJhdGlvbkNsaWVudC5wcm90b3R5cGUgKTtcblx0XHRfLmV4dGVuZCggRmVkWENsaWVudC5wcm90b3R5cGUsIHByb3BzICk7XG5cdFx0Xy5leHRlbmQoIEZlZFhDbGllbnQsIGN0clByb3BzICk7XG5cblx0XHRyZXR1cm4gRmVkWENsaWVudDtcblx0fVxufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvRmVkZXJhdGlvbkNsaWVudC5qc1xuICoqLyJdLCJzb3VyY2VSb290IjoiIn0=