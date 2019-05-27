/*!
 *  * postal.federation - A base plugin for federating instances of postal.js across various boundaries.
 *  * Author: Jim Cowart (http://ifandelse.com)
 *  * Version: v0.5.4
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
/***/ (function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	// istanbul ignore next
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	var _lodash = __webpack_require__(1);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _postal = __webpack_require__(2);
	
	var _postal2 = _interopRequireDefault(_postal);
	
	__webpack_require__(3);
	
	var _packingSlips = __webpack_require__(4);
	
	var _state = __webpack_require__(5);
	
	var _handlers = __webpack_require__(6);
	
	var _filters = __webpack_require__(7);
	
	var _filters2 = _interopRequireDefault(_filters);
	
	var _FederationClient = __webpack_require__(8);
	
	var _FederationClient2 = _interopRequireDefault(_FederationClient);
	
	var fedx = _postal2["default"].fedx = {
		FederationClient: _FederationClient2["default"],
		packingSlips: _packingSlips.packingSlips,
		handlers: _handlers.handlers,
		clients: _state.state._clients,
		transports: _state.state._transports,
		filters: _filters2["default"],
		addFilter: _filters.addFilter,
		removeFilter: _filters.removeFilter,
		canSendRemote: function canSendRemote(channel, topic) {
			return (0, _filters.matchesFilter)(channel, topic, "out");
		},
		configure: _state.configure,
		getPackingSlip: _packingSlips.getPackingSlip,
		onFederatedMsg: _handlers.onFederatedMsg,
		sendMessage: function sendMessage(envelope) {
			if (!_state.state._ready) {
				_state.state._outboundQueue.push(arguments);
				return;
			}
			_lodash2["default"].each(this.transports, function (transport) {
				transport.sendMessage(envelope);
			});
		},
		disconnect: _state.disconnect,
		_getTransports: function _getTransports() {
			return _lodash2["default"].reduce(this.transports, function (memo, transport, name) {
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
			if (!_state.state._ready) {
				_state.state._signalQueue.push(arguments);
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
						callback = _state.NO_OP;
					}
					break;
				case 2:
					if (typeof transport === "string") {
						transports = {};
						transports[transport] = this.transports[transport];
					} else {
						transports = transport;
					}
					callback = target || _state.NO_OP;
					break;
				case 3:
					transports = {};
					transports[transport] = [target];
					break;
			}
			_lodash2["default"].each(transports, function (targets, name) {
				targets = typeof targets === "boolean" ? [] : targets;
				this.transports[name].signalReady(targets, callback);
			}, this);
		}
	};
	
	exports["default"] = fedx;
	
	function processSignalQ(args) {
		fedx.signalReady.apply(this, args);
	}
	
	function processOutboundQ(args) {
		fedx.send.apply(this, args);
	}
	
	function processInboundQ(msg) {
		fedx.onFederatedMsg.call(this, msg);
	}
	
	_postal2["default"].addWireTap(function (data, envelope) {
		if (fedx.canSendRemote(envelope.channel, envelope.topic)) {
			fedx.sendMessage(envelope);
		}
	});
	
	_postal2["default"].subscribe({
		channel: _postal2["default"].configuration.SYSTEM_CHANNEL,
		topic: "instanceId.changed",
		callback: function callback() {
			_state.state._ready = true;
			while (_state.state._signalQueue.length) {
				processSignalQ(_state.state._signalQueue.shift());
			}
			while (_state.state._outboundQueue.length) {
				processOutboundQ(_state.state._outboundQueue.shift());
			}
			while (_state.state._inboundQueue.length) {
				processInboundQ(_state.state._inboundQueue.shift());
			}
		}
	});
	
	if (_postal2["default"].instanceId() !== undefined) {
		_state.state._ready = true;
	}
	module.exports = exports["default"];

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ }),
/* 2 */
/***/ (function(module, exports) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

	// istanbul ignore next
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	var _postal = __webpack_require__(2);
	
	var _postal2 = _interopRequireDefault(_postal);
	
	if (!_postal2["default"].createUUID) {
		_postal2["default"].createUUID = function () {
			var s = [];
			var hexDigits = "0123456789abcdef";
			for (var i = 0; i < 36; i++) {
				s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
			}
			s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
			/* jshint ignore:start */
			s[19] = hexDigits.substr(s[19] & 0x3 | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
			/* jshint ignore:end */
			s[8] = s[13] = s[18] = s[23] = "-";
			return s.join("");
		};
	}
	if (!_postal2["default"].instanceId) {
		_postal2["default"].instanceId = (function () {
			var _id = undefined,
			    _oldId = undefined;
			return function (id) {
				if (id) {
					_oldId = _id;
					_id = id;
					_postal2["default"].publish({
						channel: _postal2["default"].configuration.SYSTEM_CHANNEL,
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

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.getPackingSlip = getPackingSlip;
	// istanbul ignore next
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	var _postal = __webpack_require__(2);
	
	var _postal2 = _interopRequireDefault(_postal);
	
	function getPackingSlip(type /*, env */) {
		if (Object.prototype.hasOwnProperty.call(packingSlips, type)) {
			return packingSlips[type].apply(this, Array.prototype.slice.call(arguments, 1));
		}
	}
	
	var packingSlips = {
		ping: function ping() {
			return {
				type: "federation.ping",
				instanceId: _postal2["default"].instanceId(),
				timeStamp: new Date(),
				ticket: _postal2["default"].createUUID()
			};
		},
		pong: function pong(ping) {
			return {
				type: "federation.pong",
				instanceId: _postal2["default"].instanceId(),
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
				instanceId: _postal2["default"].instanceId(),
				timeStamp: new Date(),
				envelope: env
			};
		},
		disconnect: function disconnect() {
			return {
				type: "federation.disconnect",
				instanceId: _postal2["default"].instanceId(),
				timeStamp: new Date()
			};
		},
		bundle: function bundle(packingSlips) {
			return {
				type: "federation.bundle",
				instanceId: _postal2["default"].instanceId(),
				timeStamp: new Date(),
				packingSlips: packingSlips
			};
		}
	};
	exports.packingSlips = packingSlips;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.configure = configure;
	exports.disconnect = disconnect;
	// istanbul ignore next
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	var _lodash = __webpack_require__(1);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
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
			state._config = _lodash2["default"].defaults(cfg, _defaults);
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
		_lodash2["default"].each(trans, function (t) {
			t.disconnect({
				target: options.target,
				instanceId: options.instanceId,
				doNotNotify: !!options.doNotNotify
			});
		});
	}

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.onFederatedMsg = onFederatedMsg;
	// istanbul ignore next
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	var _packingSlips = __webpack_require__(4);
	
	var _state = __webpack_require__(5);
	
	var _filters = __webpack_require__(7);
	
	var _postal = __webpack_require__(2);
	
	var _postal2 = _interopRequireDefault(_postal);
	
	var _lodash = __webpack_require__(1);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var handlers = {
		"federation.ping": function federationPing(data /*, callback */) {
			data.source.setInstanceId(data.packingSlip.instanceId);
			if (data.source.handshakeComplete) {
				data.source.sendPong(data.packingSlip);
			} else {
				data.source.sendBundle([(0, _packingSlips.getPackingSlip)("pong", data.packingSlip), (0, _packingSlips.getPackingSlip)("ping")]);
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
			if (!_lodash2["default"].includes(_state.state._clients, data.packingSlip.instanceId)) {
				_state.state._clients.push(data.packingSlip.instanceId);
			}
			_postal2["default"].publish({
				channel: "postal.federation",
				topic: "client.federated",
				data: {
					remoteId: data.source.instanceId,
					localId: _postal2["default"].instanceId(),
					transport: data.transport
				}
			});
		},
		"federation.disconnect": function federationDisconnect(data) {
			_state.state._clients = _lodash2["default"].without(_state.state._clients, data.source.instanceId);
			(0, _state.disconnect)({
				transport: data.source.transportName,
				instanceId: data.source.instanceId,
				doNotNotify: true
			});
		},
		"federation.message": function federationMessage(data) {
			var env = data.packingSlip.envelope;
			if ((0, _filters.matchesFilter)(env.channel, env.topic, "in")) {
				env.lastSender = data.packingSlip.instanceId;
				_postal2["default"].publish(env);
			}
		},
		"federation.bundle": function federationBundle(data) {
			_lodash2["default"].each(data.packingSlip.packingSlips, function (slip) {
				onFederatedMsg(_lodash2["default"].extend({}, data, {
					packingSlip: slip
				}));
			});
		}
	};
	
	exports.handlers = handlers;
	
	function onFederatedMsg(data) {
		if (!_state.state._ready) {
			_state.state._inboundQueue.push(data);
			return;
		}
		if (Object.prototype.hasOwnProperty.call(handlers, data.packingSlip.type)) {
			handlers[data.packingSlip.type](data);
		} else {
			throw new Error("postal.federation does not have a message handler for '" + data.packingSlip.type + "'.");
		}
	}

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.addFilter = addFilter;
	exports.removeFilter = removeFilter;
	exports.matchesFilter = matchesFilter;
	// istanbul ignore next
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	var _lodash = __webpack_require__(1);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _state = __webpack_require__(5);
	
	var _postal = __webpack_require__(2);
	
	var _postal2 = _interopRequireDefault(_postal);
	
	var filters = {
		"in": {}, // jscs:ignore disallowQuotedKeysInObjects
		out: {}
	};
	
	exports["default"] = filters;
	
	function addFilter(_filters) {
		_filters = _lodash2["default"].isArray(_filters) ? _filters : [_filters];
		_lodash2["default"].each(_filters, function (filter) {
			filter.direction = filter.direction || _state.state._config.filterDirection;
			_lodash2["default"].each(filter.direction === "both" ? ["in", "out"] : [filter.direction], function (dir) {
				if (!filters[dir][filter.channel]) {
					filters[dir][filter.channel] = [filter.topic];
				} else if (!_lodash2["default"].include(filters[dir][filter.channel], filter.topic)) {
					filters[dir][filter.channel].push(filter.topic);
				}
			});
		});
	}
	
	function removeFilter(_filters) {
		_filters = _lodash2["default"].isArray(_filters) ? _filters : [_filters];
		_lodash2["default"].each(_filters, function (filter) {
			filter.direction = filter.direction || _state.state._config.filterDirection;
			_lodash2["default"].each(filter.direction === "both" ? ["in", "out"] : [filter.direction], function (dir) {
				if (filters[dir][filter.channel] && _lodash2["default"].include(filters[dir][filter.channel], filter.topic)) {
					filters[dir][filter.channel] = _lodash2["default"].without(filters[dir][filter.channel], filter.topic);
				}
			});
		});
	}
	
	function matchesFilter(channel, topic, direction) {
		var channelPresent = Object.prototype.hasOwnProperty.call(filters[direction], channel);
		var topicMatch = channelPresent && _lodash2["default"].some(filters[direction][channel], function (binding) {
			return _postal2["default"].configuration.resolver.compare(binding, topic);
		});
		var blacklisting = _state.state._config.filterMode === "blacklist";
		return _state.state._config.enabled && (blacklisting && (!channelPresent || channelPresent && !topicMatch) || !blacklisting && channelPresent && topicMatch);
	}

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	// istanbul ignore next
	
	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();
	
	// istanbul ignore next
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
	
	// istanbul ignore next
	
	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
	
	var _packingSlips = __webpack_require__(4);
	
	var _handlers = __webpack_require__(6);
	
	var _state = __webpack_require__(5);
	
	var _postal = __webpack_require__(2);
	
	var _postal2 = _interopRequireDefault(_postal);
	
	var _lodash = __webpack_require__(1);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var FederationClient = (function () {
		function FederationClient(target, options, instanceId) {
			_classCallCheck(this, FederationClient);
	
			this.target = target;
			this.options = options || {};
			this.pings = {};
			this.instanceId = instanceId;
			this.handshakeComplete = false;
		}
	
		_createClass(FederationClient, [{
			key: "sendPing",
			value: function sendPing(callback) {
				var packingSlip = (0, _packingSlips.getPackingSlip)("ping");
				this.pings[packingSlip.ticket] = {
					ticket: packingSlip.ticket,
					callback: callback || _state.NO_OP
				};
				this.send(packingSlip);
			}
		}, {
			key: "sendPong",
			value: function sendPong(origPackingSlip) {
				this.send((0, _packingSlips.getPackingSlip)("pong", origPackingSlip));
			}
		}, {
			key: "sendBundle",
			value: function sendBundle(slips) {
				this.send((0, _packingSlips.getPackingSlip)("bundle", slips));
			}
		}, {
			key: "sendMessage",
			value: function sendMessage(envelope) {
				if (!this.handshakeComplete) {
					return;
				}
				envelope.originId = envelope.originId || _postal2["default"].instanceId();
				var env = _lodash2["default"].clone(envelope);
				if (this.instanceId && this.instanceId !== env.lastSender && (!env.knownIds || !env.knownIds.length || env.knownIds && !_lodash2["default"].include(env.knownIds, this.instanceId))) {
					env.knownIds = (env.knownIds || []).concat(_lodash2["default"].without(_state.state._clients, this.instanceId));
					this.send((0, _packingSlips.getPackingSlip)("message", env));
				}
			}
		}, {
			key: "disconnect",
			value: function disconnect() {
				this.send((0, _packingSlips.getPackingSlip)("disconnect"));
			}
		}, {
			key: "onMessage",
			value: function onMessage(packingSlip) {
				if (this.shouldProcess()) {
					(0, _handlers.onFederatedMsg)({
						transport: this.transportName,
						packingSlip: packingSlip,
						source: this
					});
				}
			}
		}, {
			key: "shouldProcess",
			value: function shouldProcess() {
				return true;
			}
		}, {
			key: "send",
			value: function send() /* msg */{
				throw new Error("An object deriving from FederationClient must provide an implementation for 'send'.");
			}
		}, {
			key: "setInstanceId",
			value: function setInstanceId(id) {
				this.instanceId = id;
			}
		}], [{
			key: "extend",
			value: function extend(props, ctrProps) {
				function FedXClient() {
					FederationClient.apply(this, arguments);
				}
	
				FedXClient.prototype = Object.create(FederationClient.prototype);
				_lodash2["default"].extend(FedXClient.prototype, props);
				_lodash2["default"].extend(FedXClient, ctrProps);
	
				return FedXClient;
			}
		}]);
	
		return FederationClient;
	})();
	
	exports["default"] = FederationClient;
	module.exports = exports["default"];

/***/ })
/******/ ])
});
;