/*!
 *  * postal.federation - A base plugin for federating instances of postal.js across various boundaries.
 *  * Author: Jim Cowart (http://ifandelse.com)
 *  * Version: v0.5.3
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
	
	var _filters = __webpack_require__(7);
	
	var filters = _interopRequire(_filters);
	
	var matchesFilter = _filters.matchesFilter;
	var addFilter = _filters.addFilter;
	var removeFilter = _filters.removeFilter;
	
	var FederationClient = _interopRequire(__webpack_require__(8));
	
	var fedx = postal.fedx = {
		FederationClient: FederationClient,
		packingSlips: packingSlips,
		handlers: handlers,
		clients: state._clients,
		transports: state._transports,
		filters: filters,
		addFilter: addFilter,
		removeFilter: removeFilter,
		canSendRemote: function canSendRemote(channel, topic) {
			return matchesFilter(channel, topic, "out");
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
	
	module.exports = fedx;
	
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

	// istanbul ignore next
	
	var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };
	
	exports.onFederatedMsg = onFederatedMsg;
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var getPackingSlip = __webpack_require__(4).getPackingSlip;
	
	var _state = __webpack_require__(5);
	
	var state = _state.state;
	var disconnect = _state.disconnect;
	
	var matchesFilter = __webpack_require__(7).matchesFilter;
	
	var postal = _interopRequire(__webpack_require__(2));
	
	var _ = _interopRequire(__webpack_require__(1));
	
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
			if (matchesFilter(env.channel, env.topic, "in")) {
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
	
	exports.addFilter = addFilter;
	exports.removeFilter = removeFilter;
	exports.matchesFilter = matchesFilter;
	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	
	var _ = _interopRequire(__webpack_require__(1));
	
	var state = __webpack_require__(5).state;
	
	var postal = _interopRequire(__webpack_require__(2));
	
	var filters = {
		"in": {}, // jscs:ignore disallowQuotedKeysInObjects
		out: {}
	};
	
	exports["default"] = filters;
	
	function addFilter(_filters) {
		_filters = _.isArray(_filters) ? _filters : [_filters];
		_.each(_filters, function (filter) {
			filter.direction = filter.direction || state._config.filterDirection;
			_.each(filter.direction === "both" ? ["in", "out"] : [filter.direction], function (dir) {
				if (!filters[dir][filter.channel]) {
					filters[dir][filter.channel] = [filter.topic];
				} else if (!_.include(filters[dir][filter.channel], filter.topic)) {
					filters[dir][filter.channel].push(filter.topic);
				}
			});
		});
	}
	
	function removeFilter(_filters) {
		_filters = _.isArray(_filters) ? _filters : [_filters];
		_.each(_filters, function (filter) {
			filter.direction = filter.direction || state._config.filterDirection;
			_.each(filter.direction === "both" ? ["in", "out"] : [filter.direction], function (dir) {
				if (filters[dir][filter.channel] && _.include(filters[dir][filter.channel], filter.topic)) {
					filters[dir][filter.channel] = _.without(filters[dir][filter.channel], filter.topic);
				}
			});
		});
	}
	
	function matchesFilter(channel, topic, direction) {
		var channelPresent = Object.prototype.hasOwnProperty.call(filters[direction], channel);
		var topicMatch = channelPresent && _.any(filters[direction][channel], function (binding) {
			return postal.configuration.resolver.compare(binding, topic);
		});
		var blacklisting = state._config.filterMode === "blacklist";
		return state._config.enabled && (blacklisting && (!channelPresent || channelPresent && !topicMatch) || !blacklisting && channelPresent && topicMatch);
	}

/***/ },
/* 8 */
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
	
	var _ = _interopRequire(__webpack_require__(1));
	
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uIiwid2VicGFjazovLy93ZWJwYWNrL2Jvb3RzdHJhcCA0NzhkMzVkMWRkYWUyNzc5NmZlZiIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vL2V4dGVybmFsIHtcInJvb3RcIjpcIl9cIixcImNvbW1vbmpzXCI6XCJsb2Rhc2hcIixcImNvbW1vbmpzMlwiOlwibG9kYXNoXCIsXCJhbWRcIjpcImxvZGFzaFwifSIsIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJwb3N0YWxcIiIsIndlYnBhY2s6Ly8vLi9zcmMvcG9zdGFsLXV0aWxzLmpzIiwid2VicGFjazovLy8uL3NyYy9wYWNraW5nU2xpcHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0YXRlLmpzIiwid2VicGFjazovLy8uL3NyYy9oYW5kbGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvZmlsdGVycy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvRmVkZXJhdGlvbkNsaWVudC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNELE87QUNWQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7OztLQ3RDTyxDQUFDLHVDQUFNLENBQVE7O0tBQ2YsTUFBTSx1Q0FBTSxDQUFROztxQkFDcEIsQ0FBZ0I7O3lDQUNzQixDQUFnQjs7S0FBcEQsWUFBWSxpQkFBWixZQUFZO0tBQUUsY0FBYyxpQkFBZCxjQUFjOztrQ0FDZSxDQUFTOztLQUFwRCxLQUFLLFVBQUwsS0FBSztL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RCxZQUFTO1dBQUEsbUJBQUUsV0FBVyxFQUFHO0FBQ3hCLFNBQUssSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFHO0FBQzNCLG9CQUFjLENBQUU7QUFDZixnQkFBUyxFQUFFLElBQUksQ0FBQyxhQUFhO0FBQzdCLGtCQUFXLEVBQUUsV0FBVztBQUN4QixhQUFNLEVBQUUsSUFBSTtPQUNaLENBQUUsQ0FBQztNQUNKO0tBQ0Q7O0FBRUQsZ0JBQWE7V0FBQSx5QkFBRztBQUNmLFlBQU8sSUFBSSxDQUFDO0tBQ1o7O0FBRUQsT0FBSTtXQUFBLGdCQUFjO0FBQ2pCLFdBQU0sSUFBSSxLQUFLLENBQUUscUZBQXFGLENBQUUsQ0FBQztLQUN6Rzs7QUFFRCxnQkFBYTtXQUFBLHVCQUFFLEVBQUUsRUFBRztBQUNuQixTQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztLQUNyQjs7O0FBRU0sU0FBTTtXQUFBLGdCQUFFLEtBQUssRUFBRSxRQUFRLEVBQUc7QUFDaEMsY0FBUyxVQUFVLEdBQUc7QUFDckIsc0JBQWdCLENBQUMsS0FBSyxDQUFFLElBQUksRUFBRSxTQUFTLENBQUUsQ0FBQztNQUMxQzs7QUFFRCxlQUFVLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUUsZ0JBQWdCLENBQUMsU0FBUyxDQUFFLENBQUM7QUFDbkUsTUFBQyxDQUFDLE1BQU0sQ0FBRSxVQUFVLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBRSxDQUFDO0FBQ3hDLE1BQUMsQ0FBQyxNQUFNLENBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBRSxDQUFDOztBQUVqQyxZQUFPLFVBQVUsQ0FBQztLQUNsQjs7OztTQTdFbUIsZ0JBQWdCOzs7a0JBQWhCLGdCQUFnQiIsImZpbGUiOiJwb3N0YWwuZmVkZXJhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkocmVxdWlyZShcImxvZGFzaFwiKSwgcmVxdWlyZShcInBvc3RhbFwiKSk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShbXCJsb2Rhc2hcIiwgXCJwb3N0YWxcIl0sIGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wicG9zdGFsRmVkeFwiXSA9IGZhY3RvcnkocmVxdWlyZShcImxvZGFzaFwiKSwgcmVxdWlyZShcInBvc3RhbFwiKSk7XG5cdGVsc2Vcblx0XHRyb290W1wicG9zdGFsRmVkeFwiXSA9IGZhY3Rvcnkocm9vdFtcIl9cIl0sIHJvb3RbXCJwb3N0YWxcIl0pO1xufSkodGhpcywgZnVuY3Rpb24oX19XRUJQQUNLX0VYVEVSTkFMX01PRFVMRV8xX18sIF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMl9fKSB7XG5yZXR1cm4gXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogd2VicGFjay91bml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uXG4gKiovIiwiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiB3ZWJwYWNrL2Jvb3RzdHJhcCA0NzhkMzVkMWRkYWUyNzc5NmZlZlxuICoqLyIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcbmltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuaW1wb3J0IFwiLi9wb3N0YWwtdXRpbHNcIjtcbmltcG9ydCB7IHBhY2tpbmdTbGlwcywgZ2V0UGFja2luZ1NsaXAgfSBmcm9tIFwiLi9wYWNraW5nU2xpcHNcIjtcbmltcG9ydCB7IHN0YXRlLCBkaXNjb25uZWN0LCBOT19PUCwgY29uZmlndXJlIH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCB7IGhhbmRsZXJzLCBvbkZlZGVyYXRlZE1zZyB9IGZyb20gXCIuL2hhbmRsZXJzXCI7XG5pbXBvcnQgZmlsdGVycywgeyBtYXRjaGVzRmlsdGVyLCBhZGRGaWx0ZXIsIHJlbW92ZUZpbHRlciB9IGZyb20gXCIuL2ZpbHRlcnNcIjtcbmltcG9ydCBGZWRlcmF0aW9uQ2xpZW50IGZyb20gXCIuL0ZlZGVyYXRpb25DbGllbnRcIjtcblxuY29uc3QgZmVkeCA9IHBvc3RhbC5mZWR4ID0ge1xuXHRGZWRlcmF0aW9uQ2xpZW50OiBGZWRlcmF0aW9uQ2xpZW50LFxuXHRwYWNraW5nU2xpcHM6IHBhY2tpbmdTbGlwcyxcblx0aGFuZGxlcnM6IGhhbmRsZXJzLFxuXHRjbGllbnRzOiBzdGF0ZS5fY2xpZW50cyxcblx0dHJhbnNwb3J0czogc3RhdGUuX3RyYW5zcG9ydHMsXG5cdGZpbHRlcnMsXG5cdGFkZEZpbHRlcixcblx0cmVtb3ZlRmlsdGVyLFxuXHRjYW5TZW5kUmVtb3RlOiBmdW5jdGlvbiggY2hhbm5lbCwgdG9waWMgKSB7XG5cdFx0cmV0dXJuIG1hdGNoZXNGaWx0ZXIoIGNoYW5uZWwsIHRvcGljLCBcIm91dFwiICk7XG5cdH0sXG5cdGNvbmZpZ3VyZTogY29uZmlndXJlLFxuXHRnZXRQYWNraW5nU2xpcCxcblx0b25GZWRlcmF0ZWRNc2c6IG9uRmVkZXJhdGVkTXNnLFxuXHRzZW5kTWVzc2FnZTogZnVuY3Rpb24oIGVudmVsb3BlICkge1xuXHRcdGlmICggIXN0YXRlLl9yZWFkeSApIHtcblx0XHRcdHN0YXRlLl9vdXRib3VuZFF1ZXVlLnB1c2goIGFyZ3VtZW50cyApO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHRfLmVhY2goIHRoaXMudHJhbnNwb3J0cywgZnVuY3Rpb24oIHRyYW5zcG9ydCApIHtcblx0XHRcdHRyYW5zcG9ydC5zZW5kTWVzc2FnZSggZW52ZWxvcGUgKTtcblx0XHR9ICk7XG5cdH0sXG5cdGRpc2Nvbm5lY3Q6IGRpc2Nvbm5lY3QsXG5cdF9nZXRUcmFuc3BvcnRzOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gXy5yZWR1Y2UoIHRoaXMudHJhbnNwb3J0cywgZnVuY3Rpb24oIG1lbW8sIHRyYW5zcG9ydCwgbmFtZSApIHtcblx0XHRcdG1lbW9bbmFtZV0gPSB0cnVlO1xuXHRcdFx0cmV0dXJuIG1lbW87XG5cdFx0fSwge30gKTtcblx0fSxcblx0Lypcblx0XHRzaWduYWxSZWFkeSggY2FsbGJhY2sgKTtcblx0XHRzaWduYWxSZWFkeSggXCJ0cmFuc3BvcnROYW1lXCIgKTtcblx0XHRzaWduYWxSZWFkeSggXCJ0cmFuc3BvcnROYW1lXCIsIGNhbGxiYWNrICk7XG5cdFx0c2lnbmFsUmVhZHkoIFwidHJhbnNwb3J0TmFtZVwiLCB0YXJnZXRJbnN0YW5jZSwgY2FsbGJhY2sgKTsgPC0tIHRoaXMgaXMgTkVXXG5cdFx0c2lnbmFsUmVhZHkoIHsgdHJhbnNwb3J0TmFtZUE6IHRhcmdldHNGb3JBLCB0cmFuc3BvcnROYW1lQjogdGFyZ2V0c0ZvckIsIHRyYW5zcG9ydEM6IHRydWUgfSwgY2FsbGJhY2spO1xuXHQqL1xuXHRzaWduYWxSZWFkeTogZnVuY3Rpb24oIHRyYW5zcG9ydCwgdGFyZ2V0LCBjYWxsYmFjayApIHtcblx0XHRpZiAoICFzdGF0ZS5fcmVhZHkgKSB7XG5cdFx0XHRzdGF0ZS5fc2lnbmFsUXVldWUucHVzaCggYXJndW1lbnRzICk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGxldCB0cmFuc3BvcnRzID0gdGhpcy5fZ2V0VHJhbnNwb3J0cygpO1xuXHRcdHN3aXRjaCAoIGFyZ3VtZW50cy5sZW5ndGggKSB7XG5cdFx0Y2FzZSAxOlxuXHRcdFx0aWYgKCB0eXBlb2YgdHJhbnNwb3J0ID09PSBcImZ1bmN0aW9uXCIgKSB7XG5cdFx0XHRcdGNhbGxiYWNrID0gdHJhbnNwb3J0O1xuXHRcdFx0fSBlbHNlIGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSB0aGlzLnRyYW5zcG9ydHNbdHJhbnNwb3J0XTtcblx0XHRcdFx0Y2FsbGJhY2sgPSBOT19PUDtcblx0XHRcdH1cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMjpcblx0XHRcdGlmICggdHlwZW9mIHRyYW5zcG9ydCA9PT0gXCJzdHJpbmdcIiApIHtcblx0XHRcdFx0dHJhbnNwb3J0cyA9IHt9O1xuXHRcdFx0XHR0cmFuc3BvcnRzW3RyYW5zcG9ydF0gPSB0aGlzLnRyYW5zcG9ydHNbdHJhbnNwb3J0XTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRyYW5zcG9ydHMgPSB0cmFuc3BvcnQ7XG5cdFx0XHR9XG5cdFx0XHRjYWxsYmFjayA9IHRhcmdldCB8fCBOT19PUDtcblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgMzpcblx0XHRcdHRyYW5zcG9ydHMgPSB7fTtcblx0XHRcdHRyYW5zcG9ydHNbdHJhbnNwb3J0XSA9IFsgdGFyZ2V0IF07XG5cdFx0XHRicmVhaztcblx0XHR9XG5cdFx0Xy5lYWNoKCB0cmFuc3BvcnRzLCBmdW5jdGlvbiggdGFyZ2V0cywgbmFtZSApIHtcblx0XHRcdHRhcmdldHMgPSB0eXBlb2YgdGFyZ2V0cyA9PT0gXCJib29sZWFuXCIgPyBbXSA6IHRhcmdldHM7XG5cdFx0XHR0aGlzLnRyYW5zcG9ydHNbbmFtZV0uc2lnbmFsUmVhZHkoIHRhcmdldHMsIGNhbGxiYWNrICk7XG5cdFx0fSwgdGhpcyApO1xuXHR9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmZWR4O1xuXG5mdW5jdGlvbiBwcm9jZXNzU2lnbmFsUSggYXJncyApIHtcblx0ZmVkeC5zaWduYWxSZWFkeS5hcHBseSggdGhpcywgYXJncyApO1xufVxuXG5mdW5jdGlvbiBwcm9jZXNzT3V0Ym91bmRRKCBhcmdzICkge1xuXHRmZWR4LnNlbmQuYXBwbHkoIHRoaXMsIGFyZ3MgKTtcbn1cblxuZnVuY3Rpb24gcHJvY2Vzc0luYm91bmRRKCBtc2cgKSB7XG5cdGZlZHgub25GZWRlcmF0ZWRNc2cuY2FsbCggdGhpcywgbXNnICk7XG59XG5cbnBvc3RhbC5hZGRXaXJlVGFwKCBmdW5jdGlvbiggZGF0YSwgZW52ZWxvcGUgKSB7XG5cdGlmICggZmVkeC5jYW5TZW5kUmVtb3RlKCBlbnZlbG9wZS5jaGFubmVsLCBlbnZlbG9wZS50b3BpYyApICkge1xuXHRcdGZlZHguc2VuZE1lc3NhZ2UoIGVudmVsb3BlICk7XG5cdH1cbn0gKTtcblxucG9zdGFsLnN1YnNjcmliZSgge1xuXHRjaGFubmVsOiBwb3N0YWwuY29uZmlndXJhdGlvbi5TWVNURU1fQ0hBTk5FTCxcblx0dG9waWM6IFwiaW5zdGFuY2VJZC5jaGFuZ2VkXCIsXG5cdGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcblx0XHRzdGF0ZS5fcmVhZHkgPSB0cnVlO1xuXHRcdHdoaWxlICggc3RhdGUuX3NpZ25hbFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NTaWduYWxRKCBzdGF0ZS5fc2lnbmFsUXVldWUuc2hpZnQoKSApO1xuXHRcdH1cblx0XHR3aGlsZSAoIHN0YXRlLl9vdXRib3VuZFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NPdXRib3VuZFEoIHN0YXRlLl9vdXRib3VuZFF1ZXVlLnNoaWZ0KCkgKTtcblx0XHR9XG5cdFx0d2hpbGUgKCBzdGF0ZS5faW5ib3VuZFF1ZXVlLmxlbmd0aCApIHtcblx0XHRcdHByb2Nlc3NJbmJvdW5kUSggc3RhdGUuX2luYm91bmRRdWV1ZS5zaGlmdCgpICk7XG5cdFx0fVxuXHR9XG59ICk7XG5cbmlmICggcG9zdGFsLmluc3RhbmNlSWQoKSAhPT0gdW5kZWZpbmVkICkge1xuXHRzdGF0ZS5fcmVhZHkgPSB0cnVlO1xufVxuXG5cblxuLyoqIFdFQlBBQ0sgRk9PVEVSICoqXG4gKiogLi9zcmMvaW5kZXguanNcbiAqKi8iLCJtb2R1bGUuZXhwb3J0cyA9IF9fV0VCUEFDS19FWFRFUk5BTF9NT0RVTEVfMV9fO1xuXG5cbi8qKioqKioqKioqKioqKioqKlxuICoqIFdFQlBBQ0sgRk9PVEVSXG4gKiogZXh0ZXJuYWwge1wicm9vdFwiOlwiX1wiLFwiY29tbW9uanNcIjpcImxvZGFzaFwiLFwiY29tbW9uanMyXCI6XCJsb2Rhc2hcIixcImFtZFwiOlwibG9kYXNoXCJ9XG4gKiogbW9kdWxlIGlkID0gMVxuICoqIG1vZHVsZSBjaHVua3MgPSAwXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBfX1dFQlBBQ0tfRVhURVJOQUxfTU9EVUxFXzJfXztcblxuXG4vKioqKioqKioqKioqKioqKipcbiAqKiBXRUJQQUNLIEZPT1RFUlxuICoqIGV4dGVybmFsIFwicG9zdGFsXCJcbiAqKiBtb2R1bGUgaWQgPSAyXG4gKiogbW9kdWxlIGNodW5rcyA9IDBcbiAqKi8iLCJpbXBvcnQgcG9zdGFsIGZyb20gXCJwb3N0YWxcIjtcblxuaWYgKCAhcG9zdGFsLmNyZWF0ZVVVSUQgKSB7XG5cdHBvc3RhbC5jcmVhdGVVVUlEID0gZnVuY3Rpb24oKSB7XG5cdFx0bGV0IHMgPSBbXTtcblx0XHRjb25zdCBoZXhEaWdpdHMgPSBcIjAxMjM0NTY3ODlhYmNkZWZcIjtcblx0XHRmb3IgKCBsZXQgaSA9IDA7IGkgPCAzNjsgaSsrICkge1xuXHRcdFx0c1tpXSA9IGhleERpZ2l0cy5zdWJzdHIoIE1hdGguZmxvb3IoIE1hdGgucmFuZG9tKCkgKiAweDEwICksIDEgKTtcblx0XHR9XG5cdFx0c1sxNF0gPSBcIjRcIjsgLy8gYml0cyAxMi0xNSBvZiB0aGUgdGltZV9oaV9hbmRfdmVyc2lvbiBmaWVsZCB0byAwMDEwXG5cdFx0LyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXHRcdHNbMTldID0gaGV4RGlnaXRzLnN1YnN0ciggKCBzWzE5XSAmIDB4MyApIHwgMHg4LCAxICk7IC8vIGJpdHMgNi03IG9mIHRoZSBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkIHRvIDAxXG5cdFx0LyoganNoaW50IGlnbm9yZTplbmQgKi9cblx0XHRzWzhdID0gc1sxM10gPSBzWzE4XSA9IHNbMjNdID0gXCItXCI7XG5cdFx0cmV0dXJuIHMuam9pbiggXCJcIiApO1xuXHR9O1xufVxuaWYgKCAhcG9zdGFsLmluc3RhbmNlSWQgKSB7XG5cdHBvc3RhbC5pbnN0YW5jZUlkID0gKCBmdW5jdGlvbigpIHtcblx0XHRsZXQgX2lkLCBfb2xkSWQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCBpZCApIHtcblx0XHRcdGlmICggaWQgKSB7XG5cdFx0XHRcdF9vbGRJZCA9IF9pZDtcblx0XHRcdFx0X2lkID0gaWQ7XG5cdFx0XHRcdHBvc3RhbC5wdWJsaXNoKCB7XG5cdFx0XHRcdFx0Y2hhbm5lbDogcG9zdGFsLmNvbmZpZ3VyYXRpb24uU1lTVEVNX0NIQU5ORUwsXG5cdFx0XHRcdFx0dG9waWM6IFwiaW5zdGFuY2VJZC5jaGFuZ2VkXCIsXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0b2xkSWQ6IF9vbGRJZCxcblx0XHRcdFx0XHRcdG5ld0lkOiBfaWRcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0gKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBfaWQ7XG5cdFx0fTtcblx0fSgpICk7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9wb3N0YWwtdXRpbHMuanNcbiAqKi8iLCJpbXBvcnQgcG9zdGFsIGZyb20gXCJwb3N0YWxcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhY2tpbmdTbGlwKCB0eXBlIC8qLCBlbnYgKi8gKSB7XG5cdGlmICggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKCBwYWNraW5nU2xpcHMsIHR5cGUgKSApIHtcblx0XHRyZXR1cm4gcGFja2luZ1NsaXBzWyB0eXBlIF0uYXBwbHkoIHRoaXMsIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKCBhcmd1bWVudHMsIDEgKSApO1xuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBwYWNraW5nU2xpcHMgPSB7XG5cdHBpbmc6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ucGluZ1wiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHRpY2tldDogcG9zdGFsLmNyZWF0ZVVVSUQoKVxuXHRcdH07XG5cdH0sXG5cdHBvbmc6IGZ1bmN0aW9uKCBwaW5nICkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24ucG9uZ1wiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHBpbmdEYXRhOiB7XG5cdFx0XHRcdGluc3RhbmNlSWQ6IHBpbmcuaW5zdGFuY2VJZCxcblx0XHRcdFx0dGltZVN0YW1wOiBwaW5nLnRpbWVTdGFtcCxcblx0XHRcdFx0dGlja2V0OiBwaW5nLnRpY2tldFxuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cdG1lc3NhZ2U6IGZ1bmN0aW9uKCBlbnYgKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHR5cGU6IFwiZmVkZXJhdGlvbi5tZXNzYWdlXCIsXG5cdFx0XHRpbnN0YW5jZUlkOiBwb3N0YWwuaW5zdGFuY2VJZCgpLFxuXHRcdFx0dGltZVN0YW1wOiBuZXcgRGF0ZSgpLFxuXHRcdFx0ZW52ZWxvcGU6IGVudlxuXHRcdH07XG5cdH0sXG5cdGRpc2Nvbm5lY3Q6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHR0eXBlOiBcImZlZGVyYXRpb24uZGlzY29ubmVjdFwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKVxuXHRcdH07XG5cdH0sXG5cdGJ1bmRsZTogZnVuY3Rpb24oIHBhY2tpbmdTbGlwcyApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0dHlwZTogXCJmZWRlcmF0aW9uLmJ1bmRsZVwiLFxuXHRcdFx0aW5zdGFuY2VJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdHRpbWVTdGFtcDogbmV3IERhdGUoKSxcblx0XHRcdHBhY2tpbmdTbGlwczogcGFja2luZ1NsaXBzXG5cdFx0fTtcblx0fVxufTtcblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL3BhY2tpbmdTbGlwcy5qc1xuICoqLyIsImltcG9ydCBfIGZyb20gXCJsb2Rhc2hcIjtcblxuY29uc3QgX2RlZmF1bHRzID0ge1xuXHRlbmFibGVkOiB0cnVlLFxuXHRmaWx0ZXJNb2RlOiBcIndoaXRlbGlzdFwiLFxuXHRmaWx0ZXJEaXJlY3Rpb246IFwiYm90aFwiXG59O1xuXG5leHBvcnQgY29uc3QgTk9fT1AgPSBmdW5jdGlvbigpIHt9O1xuXG5leHBvcnQgbGV0IHN0YXRlID0ge1xuXHRfY2xpZW50czogW10sXG5cdF90cmFuc3BvcnRzOiB7fSxcblx0X3JlYWR5OiBmYWxzZSxcblx0X2luYm91bmRRdWV1ZTogW10sXG5cdF9vdXRib3VuZFF1ZXVlOiBbXSxcblx0X3NpZ25hbFF1ZXVlOiBbXSxcblx0X2NvbmZpZzogX2RlZmF1bHRzXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKCBjZmcgKSB7XG5cdGlmICggY2ZnICYmIGNmZy5maWx0ZXJNb2RlICYmIGNmZy5maWx0ZXJNb2RlICE9PSBcImJsYWNrbGlzdFwiICYmIGNmZy5maWx0ZXJNb2RlICE9PSBcIndoaXRlbGlzdFwiICkge1xuXHRcdHRocm93IG5ldyBFcnJvciggXCJwb3N0YWwuZmVkeCBmaWx0ZXJNb2RlIG11c3QgYmUgJ2JsYWNrbGlzdCcgb3IgJ3doaXRlbGlzdCcuXCIgKTtcblx0fVxuXHRpZiAoIGNmZyApIHtcblx0XHRzdGF0ZS5fY29uZmlnID0gXy5kZWZhdWx0cyggY2ZnLCBfZGVmYXVsdHMgKTtcblx0fVxuXHRyZXR1cm4gc3RhdGUuX2NvbmZpZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc2Nvbm5lY3QoIG9wdGlvbnMgKSB7XG5cdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRsZXQgdHJhbnMgPSBzdGF0ZS5fdHJhbnNwb3J0cztcblx0aWYgKCBvcHRpb25zLnRyYW5zcG9ydCApIHtcblx0XHR0cmFucyA9IHt9O1xuXHRcdHRyYW5zW29wdGlvbnMudHJhbnNwb3J0XSA9IHN0YXRlLl90cmFuc3BvcnRzW29wdGlvbnMudHJhbnNwb3J0XTtcblx0fVxuXHRfLmVhY2goIHRyYW5zLCBmdW5jdGlvbiggdCApIHtcblx0XHR0LmRpc2Nvbm5lY3QoIHtcblx0XHRcdHRhcmdldDogb3B0aW9ucy50YXJnZXQsXG5cdFx0XHRpbnN0YW5jZUlkOiBvcHRpb25zLmluc3RhbmNlSWQsXG5cdFx0XHRkb05vdE5vdGlmeTogISFvcHRpb25zLmRvTm90Tm90aWZ5XG5cdFx0fSApO1xuXHR9ICk7XG59XG5cblxuXG4vKiogV0VCUEFDSyBGT09URVIgKipcbiAqKiAuL3NyYy9zdGF0ZS5qc1xuICoqLyIsImltcG9ydCB7IGdldFBhY2tpbmdTbGlwIH0gZnJvbSBcIi4vcGFja2luZ1NsaXBzXCI7XG5pbXBvcnQgeyBzdGF0ZSwgZGlzY29ubmVjdCB9IGZyb20gXCIuL3N0YXRlXCI7XG5pbXBvcnQgeyBtYXRjaGVzRmlsdGVyIH0gZnJvbSBcIi4vZmlsdGVyc1wiO1xuaW1wb3J0IHBvc3RhbCBmcm9tIFwicG9zdGFsXCI7XG5pbXBvcnQgXyBmcm9tIFwibG9kYXNoXCI7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVycyA9IHtcblx0XCJmZWRlcmF0aW9uLnBpbmdcIjogZnVuY3Rpb24oIGRhdGEgLyosIGNhbGxiYWNrICovICkge1xuXHRcdGRhdGEuc291cmNlLnNldEluc3RhbmNlSWQoIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdGlmICggZGF0YS5zb3VyY2UuaGFuZHNoYWtlQ29tcGxldGUgKSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5zZW5kUG9uZyggZGF0YS5wYWNraW5nU2xpcCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5zZW5kQnVuZGxlKCBbXG5cdFx0XHRnZXRQYWNraW5nU2xpcCggXCJwb25nXCIsIGRhdGEucGFja2luZ1NsaXAgKSxcblx0XHRcdGdldFBhY2tpbmdTbGlwKCBcInBpbmdcIiApXG5cdFx0XHRdICk7XG5cdFx0fVxuXHR9LFxuXHRcImZlZGVyYXRpb24ucG9uZ1wiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRkYXRhLnNvdXJjZS5oYW5kc2hha2VDb21wbGV0ZSA9IHRydWU7XG5cdFx0ZGF0YS5zb3VyY2Uuc2V0SW5zdGFuY2VJZCggZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkICk7XG5cdFx0aWYgKCBkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0gKSB7XG5cdFx0XHRkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0uY2FsbGJhY2soIHtcblx0XHRcdFx0dGlja2V0OiBkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldCxcblx0XHRcdFx0aW5zdGFuY2VJZDogZGF0YS5wYWNraW5nU2xpcC5pbnN0YW5jZUlkLFxuXHRcdFx0XHRzb3VyY2U6IGRhdGEuc291cmNlXG5cdFx0XHR9ICk7XG5cdFx0XHRkYXRhLnNvdXJjZS5waW5nc1tkYXRhLnBhY2tpbmdTbGlwLnBpbmdEYXRhLnRpY2tldF0gPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdGlmICggIV8uY29udGFpbnMoIHN0YXRlLl9jbGllbnRzLCBkYXRhLnBhY2tpbmdTbGlwLmluc3RhbmNlSWQgKSApIHtcblx0XHRcdHN0YXRlLl9jbGllbnRzLnB1c2goIGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZCApO1xuXHRcdH1cblx0XHRwb3N0YWwucHVibGlzaCgge1xuXHRcdFx0Y2hhbm5lbDogXCJwb3N0YWwuZmVkZXJhdGlvblwiLFxuXHRcdFx0dG9waWM6IFwiY2xpZW50LmZlZGVyYXRlZFwiLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHRyZW1vdGVJZDogZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCxcblx0XHRcdFx0bG9jYWxJZDogcG9zdGFsLmluc3RhbmNlSWQoKSxcblx0XHRcdFx0dHJhbnNwb3J0OiBkYXRhLnRyYW5zcG9ydFxuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblx0XCJmZWRlcmF0aW9uLmRpc2Nvbm5lY3RcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0c3RhdGUuX2NsaWVudHMgPSBfLndpdGhvdXQoIHN0YXRlLl9jbGllbnRzLCBkYXRhLnNvdXJjZS5pbnN0YW5jZUlkICk7XG5cdFx0ZGlzY29ubmVjdCgge1xuXHRcdFx0dHJhbnNwb3J0OiBkYXRhLnNvdXJjZS50cmFuc3BvcnROYW1lLFxuXHRcdFx0aW5zdGFuY2VJZDogZGF0YS5zb3VyY2UuaW5zdGFuY2VJZCxcblx0XHRcdGRvTm90Tm90aWZ5OiB0cnVlXG5cdFx0fSApO1xuXHR9LFxuXHRcImZlZGVyYXRpb24ubWVzc2FnZVwiOiBmdW5jdGlvbiggZGF0YSApIHtcblx0XHRjb25zdCBlbnYgPSBkYXRhLnBhY2tpbmdTbGlwLmVudmVsb3BlO1xuXHRcdGlmICggbWF0Y2hlc0ZpbHRlciggZW52LmNoYW5uZWwsIGVudi50b3BpYywgXCJpblwiICkgKSB7XG5cdFx0XHRlbnYubGFzdFNlbmRlciA9IGRhdGEucGFja2luZ1NsaXAuaW5zdGFuY2VJZDtcblx0XHRcdHBvc3RhbC5wdWJsaXNoKCBlbnYgKTtcblx0XHR9XG5cdH0sXG5cdFwiZmVkZXJhdGlvbi5idW5kbGVcIjogZnVuY3Rpb24oIGRhdGEgKSB7XG5cdFx0Xy5lYWNoKCBkYXRhLnBhY2tpbmdTbGlwLnBhY2tpbmdTbGlwcywgZnVuY3Rpb24oIHNsaXAgKSB7XG5cdFx0XHRvbkZlZGVyYXRlZE1zZyggXy5leHRlbmQoIHt9LCBkYXRhLCB7XG5cdFx0XHRcdHBhY2tpbmdTbGlwOiBzbGlwXG5cdFx0XHR9ICkgKTtcblx0XHR9ICk7XG5cdH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBvbkZlZGVyYXRlZE1zZyggZGF0YSApIHtcblx0aWYgKCAhc3RhdGUuX3JlYWR5ICkge1xuXHRcdHN0YXRlLl9pbmJvdW5kUXVldWUucHVzaCggZGF0YSApO1xuXHRcdHJldHVybjtcblx0fVxuXHRpZiAoIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCggaGFuZGxlcnMsIGRhdGEucGFja2luZ1NsaXAudHlwZSApICkge1xuXHRcdGhhbmRsZXJzW2RhdGEucGFja2luZ1NsaXAudHlwZV0oIGRhdGEgKTtcblx0fSBlbHNlIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoIFwicG9zdGFsLmZlZGVyYXRpb24gZG9lcyBub3QgaGF2ZSBhIG1lc3NhZ2UgaGFuZGxlciBmb3IgJ1wiICsgZGF0YS5wYWNraW5nU2xpcC50eXBlICsgXCInLlwiICk7XG5cdH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2hhbmRsZXJzLmpzXG4gKiovIiwiaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuaW1wb3J0IHsgc3RhdGUgfSBmcm9tIFwiLi9zdGF0ZVwiO1xuaW1wb3J0IHBvc3RhbCBmcm9tIFwicG9zdGFsXCI7XG5cbmNvbnN0IGZpbHRlcnMgPSB7XG5cdFwiaW5cIjoge30sIC8vIGpzY3M6aWdub3JlIGRpc2FsbG93UXVvdGVkS2V5c0luT2JqZWN0c1xuXHRvdXQ6IHt9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmaWx0ZXJzO1xuXG5leHBvcnQgZnVuY3Rpb24gYWRkRmlsdGVyKCBfZmlsdGVycyApIHtcblx0X2ZpbHRlcnMgPSBfLmlzQXJyYXkoIF9maWx0ZXJzICkgPyBfZmlsdGVycyA6IFsgX2ZpbHRlcnMgXTtcblx0Xy5lYWNoKCBfZmlsdGVycywgZnVuY3Rpb24oIGZpbHRlciApIHtcblx0XHRmaWx0ZXIuZGlyZWN0aW9uID0gZmlsdGVyLmRpcmVjdGlvbiB8fCBzdGF0ZS5fY29uZmlnLmZpbHRlckRpcmVjdGlvbjtcblx0XHRfLmVhY2goICggZmlsdGVyLmRpcmVjdGlvbiA9PT0gXCJib3RoXCIgKSA/IFsgXCJpblwiLCBcIm91dFwiIF0gOiBbIGZpbHRlci5kaXJlY3Rpb24gXSwgZnVuY3Rpb24oIGRpciApIHtcblx0XHRcdGlmICggIWZpbHRlcnNbIGRpciBdWyBmaWx0ZXIuY2hhbm5lbCBdICkge1xuXHRcdFx0XHRmaWx0ZXJzWyBkaXIgXVsgZmlsdGVyLmNoYW5uZWwgXSA9IFsgZmlsdGVyLnRvcGljIF07XG5cdFx0XHR9IGVsc2UgaWYgKCAhKCBfLmluY2x1ZGUoIGZpbHRlcnNbIGRpciBdWyBmaWx0ZXIuY2hhbm5lbCBdLCBmaWx0ZXIudG9waWMgKSApICkge1xuXHRcdFx0XHRmaWx0ZXJzWyBkaXIgXVsgZmlsdGVyLmNoYW5uZWwgXS5wdXNoKCBmaWx0ZXIudG9waWMgKTtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH0gKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbW92ZUZpbHRlciggX2ZpbHRlcnMgKSB7XG5cdF9maWx0ZXJzID0gXy5pc0FycmF5KCBfZmlsdGVycyApID8gX2ZpbHRlcnMgOiBbIF9maWx0ZXJzIF07XG5cdF8uZWFjaCggX2ZpbHRlcnMsIGZ1bmN0aW9uKCBmaWx0ZXIgKSB7XG5cdFx0ZmlsdGVyLmRpcmVjdGlvbiA9IGZpbHRlci5kaXJlY3Rpb24gfHwgc3RhdGUuX2NvbmZpZy5maWx0ZXJEaXJlY3Rpb247XG5cdFx0Xy5lYWNoKCAoIGZpbHRlci5kaXJlY3Rpb24gPT09IFwiYm90aFwiICkgPyBbIFwiaW5cIiwgXCJvdXRcIiBdIDogWyBmaWx0ZXIuZGlyZWN0aW9uIF0sIGZ1bmN0aW9uKCBkaXIgKSB7XG5cdFx0XHRpZiAoIGZpbHRlcnNbIGRpciBdWyBmaWx0ZXIuY2hhbm5lbCBdICYmIF8uaW5jbHVkZSggZmlsdGVyc1sgZGlyIF1bIGZpbHRlci5jaGFubmVsIF0sIGZpbHRlci50b3BpYyApICkge1xuXHRcdFx0XHRmaWx0ZXJzWyBkaXIgXVsgZmlsdGVyLmNoYW5uZWwgXSA9IF8ud2l0aG91dCggZmlsdGVyc1sgZGlyIF1bIGZpbHRlci5jaGFubmVsIF0sIGZpbHRlci50b3BpYyApO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hlc0ZpbHRlciggY2hhbm5lbCwgdG9waWMsIGRpcmVjdGlvbiApIHtcblx0Y29uc3QgY2hhbm5lbFByZXNlbnQgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoIGZpbHRlcnNbZGlyZWN0aW9uXSwgY2hhbm5lbCApO1xuXHRjb25zdCB0b3BpY01hdGNoID0gKCBjaGFubmVsUHJlc2VudCAmJiBfLmFueSggZmlsdGVyc1sgZGlyZWN0aW9uIF1bIGNoYW5uZWwgXSwgZnVuY3Rpb24oIGJpbmRpbmcgKSB7XG5cdFx0cmV0dXJuIHBvc3RhbC5jb25maWd1cmF0aW9uLnJlc29sdmVyLmNvbXBhcmUoIGJpbmRpbmcsIHRvcGljICk7XG5cdH0gKSApO1xuXHRjb25zdCBibGFja2xpc3RpbmcgPSBzdGF0ZS5fY29uZmlnLmZpbHRlck1vZGUgPT09IFwiYmxhY2tsaXN0XCI7XG5cdHJldHVybiBzdGF0ZS5fY29uZmlnLmVuYWJsZWQgJiYgKCAoIGJsYWNrbGlzdGluZyAmJiAoICFjaGFubmVsUHJlc2VudCB8fCAoIGNoYW5uZWxQcmVzZW50ICYmICF0b3BpY01hdGNoICkgKSApIHx8ICggIWJsYWNrbGlzdGluZyAmJiBjaGFubmVsUHJlc2VudCAmJiB0b3BpY01hdGNoICkgKTtcbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL2ZpbHRlcnMuanNcbiAqKi8iLCJpbXBvcnQgeyBnZXRQYWNraW5nU2xpcCB9IGZyb20gXCIuL3BhY2tpbmdTbGlwc1wiO1xuaW1wb3J0IHsgb25GZWRlcmF0ZWRNc2cgfSBmcm9tIFwiLi9oYW5kbGVyc1wiO1xuaW1wb3J0IHsgc3RhdGUsIE5PX09QIH0gZnJvbSBcIi4vc3RhdGVcIjtcbmltcG9ydCBwb3N0YWwgZnJvbSBcInBvc3RhbFwiO1xuaW1wb3J0IF8gZnJvbSBcImxvZGFzaFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGZWRlcmF0aW9uQ2xpZW50IHtcblx0Y29uc3RydWN0b3IoIHRhcmdldCwgb3B0aW9ucywgaW5zdGFuY2VJZCApIHtcblx0XHR0aGlzLnRhcmdldCA9IHRhcmdldDtcblx0XHR0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXHRcdHRoaXMucGluZ3MgPSB7fTtcblx0XHR0aGlzLmluc3RhbmNlSWQgPSBpbnN0YW5jZUlkO1xuXHRcdHRoaXMuaGFuZHNoYWtlQ29tcGxldGUgPSBmYWxzZTtcblx0fVxuXG5cdHNlbmRQaW5nKCBjYWxsYmFjayApIHtcblx0XHRjb25zdCBwYWNraW5nU2xpcCA9IGdldFBhY2tpbmdTbGlwKCBcInBpbmdcIiApO1xuXHRcdHRoaXMucGluZ3NbcGFja2luZ1NsaXAudGlja2V0XSA9IHtcblx0XHRcdHRpY2tldDogcGFja2luZ1NsaXAudGlja2V0LFxuXHRcdFx0Y2FsbGJhY2s6IGNhbGxiYWNrIHx8IE5PX09QXG5cdFx0fTtcblx0XHR0aGlzLnNlbmQoIHBhY2tpbmdTbGlwICk7XG5cdH1cblxuXHRzZW5kUG9uZyggb3JpZ1BhY2tpbmdTbGlwICkge1xuXHRcdHRoaXMuc2VuZCggZ2V0UGFja2luZ1NsaXAoIFwicG9uZ1wiLCBvcmlnUGFja2luZ1NsaXAgKSApO1xuXHR9XG5cblx0c2VuZEJ1bmRsZSggc2xpcHMgKSB7XG5cdFx0dGhpcy5zZW5kKCBnZXRQYWNraW5nU2xpcCggXCJidW5kbGVcIiwgc2xpcHMgKSApO1xuXHR9XG5cblx0c2VuZE1lc3NhZ2UoIGVudmVsb3BlICkge1xuXHRcdGlmICggIXRoaXMuaGFuZHNoYWtlQ29tcGxldGUgKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGVudmVsb3BlLm9yaWdpbklkID0gZW52ZWxvcGUub3JpZ2luSWQgfHwgcG9zdGFsLmluc3RhbmNlSWQoKTtcblx0XHRjb25zdCBlbnYgPSBfLmNsb25lKCBlbnZlbG9wZSApO1xuXHRcdGlmICggdGhpcy5pbnN0YW5jZUlkICYmIHRoaXMuaW5zdGFuY2VJZCAhPT0gZW52Lmxhc3RTZW5kZXIgJiZcblx0XHQoICFlbnYua25vd25JZHMgfHwgIWVudi5rbm93bklkcy5sZW5ndGggfHxcblx0XHQoIGVudi5rbm93bklkcyAmJiAhXy5pbmNsdWRlKCBlbnYua25vd25JZHMsIHRoaXMuaW5zdGFuY2VJZCApICkgKVxuXHRcdCkge1xuXHRcdFx0ZW52Lmtub3duSWRzID0gKCBlbnYua25vd25JZHMgfHwgW10gKS5jb25jYXQoIF8ud2l0aG91dCggc3RhdGUuX2NsaWVudHMsIHRoaXMuaW5zdGFuY2VJZCApICk7XG5cdFx0XHR0aGlzLnNlbmQoIGdldFBhY2tpbmdTbGlwKCBcIm1lc3NhZ2VcIiwgZW52ICkgKTtcblx0XHR9XG5cdH1cblxuXHRkaXNjb25uZWN0KCkge1xuXHRcdHRoaXMuc2VuZCggZ2V0UGFja2luZ1NsaXAoIFwiZGlzY29ubmVjdFwiICkgKTtcblx0fVxuXG5cdG9uTWVzc2FnZSggcGFja2luZ1NsaXAgKSB7XG5cdFx0aWYgKCB0aGlzLnNob3VsZFByb2Nlc3MoKSApIHtcblx0XHRcdG9uRmVkZXJhdGVkTXNnKCB7XG5cdFx0XHRcdHRyYW5zcG9ydDogdGhpcy50cmFuc3BvcnROYW1lLFxuXHRcdFx0XHRwYWNraW5nU2xpcDogcGFja2luZ1NsaXAsXG5cdFx0XHRcdHNvdXJjZTogdGhpc1xuXHRcdFx0fSApO1xuXHRcdH1cblx0fVxuXG5cdHNob3VsZFByb2Nlc3MoKSB7XG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblxuXHRzZW5kKCAvKiBtc2cgKi8gKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCBcIkFuIG9iamVjdCBkZXJpdmluZyBmcm9tIEZlZGVyYXRpb25DbGllbnQgbXVzdCBwcm92aWRlIGFuIGltcGxlbWVudGF0aW9uIGZvciAnc2VuZCcuXCIgKTtcblx0fVxuXG5cdHNldEluc3RhbmNlSWQoIGlkICkge1xuXHRcdHRoaXMuaW5zdGFuY2VJZCA9IGlkO1xuXHR9XG5cblx0c3RhdGljIGV4dGVuZCggcHJvcHMsIGN0clByb3BzICkge1xuXHRcdGZ1bmN0aW9uIEZlZFhDbGllbnQoKSB7XG5cdFx0XHRGZWRlcmF0aW9uQ2xpZW50LmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblx0XHR9XG5cblx0XHRGZWRYQ2xpZW50LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoIEZlZGVyYXRpb25DbGllbnQucHJvdG90eXBlICk7XG5cdFx0Xy5leHRlbmQoIEZlZFhDbGllbnQucHJvdG90eXBlLCBwcm9wcyApO1xuXHRcdF8uZXh0ZW5kKCBGZWRYQ2xpZW50LCBjdHJQcm9wcyApO1xuXG5cdFx0cmV0dXJuIEZlZFhDbGllbnQ7XG5cdH1cbn1cblxuXG5cbi8qKiBXRUJQQUNLIEZPT1RFUiAqKlxuICoqIC4vc3JjL0ZlZGVyYXRpb25DbGllbnQuanNcbiAqKi8iXSwic291cmNlUm9vdCI6IiJ9