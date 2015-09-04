import _ from "lodash";
import postal from "postal";

if ( !postal.createUUID ) {
	postal.createUUID = function() {
		let s = [];
		const hexDigits = "0123456789abcdef";
		for ( let i = 0; i < 36; i++ ) {
			s[i] = hexDigits.substr( Math.floor( Math.random() * 0x10 ), 1 );
		}
		s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
		/* jshint ignore:start */
		s[19] = hexDigits.substr( ( s[19] & 0x3 ) | 0x8, 1 ); // bits 6-7 of the clock_seq_hi_and_reserved to 01
		/* jshint ignore:end */
		s[8] = s[13] = s[18] = s[23] = "-";
		return s.join( "" );
	};
}
if ( !postal.instanceId ) {
	postal.instanceId = ( function() {
		let _id, _oldId;
		return function( id ) {
			if ( id ) {
				_oldId = _id;
				_id = id;
				postal.publish( {
					channel: postal.configuration.SYSTEM_CHANNEL,
					topic: "instanceId.changed",
					data: {
						oldId: _oldId,
						newId: _id
					}
				} );
			}
			return _id;
		};
	}() );
}

const NO_OP = function() {};
let _ready = false;
let _inboundQueue = [];
let _outboundQueue = [];
let _signalQueue = [];
const _defaults = {
	enabled: true,
	filterMode: "whitelist",
	filterDirection: "both"
};
let _config = _defaults;
function _matchesFilter( channel, topic, direction ) {
	const channelPresent = Object.prototype.hasOwnProperty.call( fedx.filters[direction], channel );
	const topicMatch = ( channelPresent && _.any( fedx.filters[direction][channel], function( binding ) {
		return postal.configuration.resolver.compare( binding, topic );
	} ) );
	const blacklisting = _config.filterMode === "blacklist";
	return _config.enabled && ( ( blacklisting && ( !channelPresent || ( channelPresent && !topicMatch ) ) ) || ( !blacklisting && channelPresent && topicMatch ) );
};

const packingSlips = {
	ping: function() {
		return {
			type: "federation.ping",
			instanceId: postal.instanceId(),
			timeStamp: new Date(),
			ticket: postal.createUUID()
		};
	},
	pong: function( ping ) {
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
	message: function( env ) {
		return {
			type: "federation.message",
			instanceId: postal.instanceId(),
			timeStamp: new Date(),
			envelope: env
		};
	},
	disconnect: function() {
		return {
			type: "federation.disconnect",
			instanceId: postal.instanceId(),
			timeStamp: new Date()
		};
	},
	bundle: function( packingSlips ) {
		return {
			type: "federation.bundle",
			instanceId: postal.instanceId(),
			timeStamp: new Date(),
			packingSlips: packingSlips
		};
	}
};
const handlers = {
	"federation.ping": function( data /*, callback */ ) {
		data.source.setInstanceId( data.packingSlip.instanceId );
		if ( data.source.handshakeComplete ) {
			data.source.sendPong( data.packingSlip );
		} else {
			data.source.sendBundle( [
			fedx.getPackingSlip( "pong", data.packingSlip ),
			fedx.getPackingSlip( "ping" )
			] );
		}
	},
	"federation.pong": function( data ) {
		data.source.handshakeComplete = true;
		data.source.setInstanceId( data.packingSlip.instanceId );
		if ( data.source.pings[data.packingSlip.pingData.ticket] ) {
			data.source.pings[data.packingSlip.pingData.ticket].callback( {
				ticket: data.packingSlip.pingData.ticket,
				instanceId: data.packingSlip.instanceId,
				source: data.source
			} );
			data.source.pings[data.packingSlip.pingData.ticket] = undefined;
		}
		if ( !_.contains( fedx.clients, data.packingSlip.instanceId ) ) {
			fedx.clients.push( data.packingSlip.instanceId );
		}
		postal.publish( {
			channel: "postal.federation",
			topic: "client.federated",
			data: {
				remoteId: data.source.instanceId,
				localId: postal.instanceId(),
				transport: data.transport
			}
		} );
	},
	"federation.disconnect": function( data ) {
		fedx.clients = _.without( fedx.clients, data.source.instanceId );
		fedx.disconnect( {
			transport: data.source.transportName,
			instanceId: data.source.instanceId,
			doNotNotify: true
		} );
	},
	"federation.message": function( data ) {
		const env = data.packingSlip.envelope;
		if ( _matchesFilter( env.channel, env.topic, "in" ) ) {
			env.lastSender = data.packingSlip.instanceId;
			postal.publish( env );
		}
	},
	"federation.bundle": function( data ) {
		_.each( data.packingSlip.packingSlips, function( slip ) {
			fedx.onFederatedMsg( _.extend( {}, data, {
				packingSlip: slip
			} ) );
		} );
	}
};

function FederationClient( target, options, instanceId ) {
	this.target = target;
	this.options = options || {};
	this.pings = {};
	this.instanceId = instanceId;
	this.handshakeComplete = false;
};

FederationClient.prototype.sendPing = function( callback ) {
	const packingSlip = fedx.getPackingSlip( "ping" );
	this.pings[packingSlip.ticket] = {
		ticket: packingSlip.ticket,
		callback: callback || NO_OP
	};
	this.send( packingSlip );
};

FederationClient.prototype.sendPong = function( origPackingSlip ) {
	this.send( fedx.getPackingSlip( "pong", origPackingSlip ) );
};

FederationClient.prototype.sendBundle = function( slips ) {
	this.send( fedx.getPackingSlip( "bundle", slips ) );
};

FederationClient.prototype.sendMessage = function( envelope ) {
	if ( !this.handshakeComplete ) {
		return;
	}
	envelope.originId = envelope.originId || postal.instanceId();
	const env = _.clone( envelope );
	if ( this.instanceId && this.instanceId !== env.lastSender &&
	( !env.knownIds || !env.knownIds.length ||
	( env.knownIds && !_.include( env.knownIds, this.instanceId ) ) )
	) {
		env.knownIds = ( env.knownIds || [] ).concat( _.without( fedx.clients, this.instanceId ) );
		this.send( fedx.getPackingSlip( "message", env ) );
	}
};

FederationClient.prototype.disconnect = function() {
	this.send( fedx.getPackingSlip( "disconnect" ) );
};

FederationClient.prototype.onMessage = function( packingSlip ) {
	if ( this.shouldProcess() ) {
		fedx.onFederatedMsg( {
			transport: this.transportName,
			packingSlip: packingSlip,
			source: this
		} );
	}
};

FederationClient.prototype.shouldProcess = function() {
	return true;
};

FederationClient.prototype.send = function( /* msg */ ) {
	throw new Error( "An object deriving from FederationClient must provide an implementation for 'send'." );
};

FederationClient.prototype.setInstanceId = function( id ) {
	this.instanceId = id;
};

FederationClient.extend = function( props, ctrProps ) {
	function FedXClient() {
		FederationClient.apply( this, arguments );
	}

	FedXClient.prototype = Object.create( FederationClient.prototype );
	_.extend( FedXClient.prototype, props );
	_.extend( FedXClient, ctrProps );

	return FedXClient;
};

export default fedx = postal.fedx = {
	FederationClient: FederationClient,
	packingSlips: packingSlips,
	handlers: handlers,
	clients: [],
	transports: {},
	filters: {
		"in": {}, // jscs:ignore disallowQuotedKeysInObjects
		out: {}
	},
	addFilter: function( filters ) {
		filters = _.isArray( filters ) ? filters : [ filters ];
		_.each( filters, function( filter ) {
			filter.direction = filter.direction || _config.filterDirection;
			_.each( ( filter.direction === "both" ) ? [ "in", "out" ] : [ filter.direction ], function( dir ) {
				if ( !this.filters[dir][filter.channel] ) {
					this.filters[dir][filter.channel] = [ filter.topic ];
				} else if ( !( _.include( this.filters[dir][filter.channel], filter.topic ) ) ) {
					this.filters[dir][filter.channel].push( filter.topic );
				}
			}, this );
		}, this );
	},
	removeFilter: function( filters ) {
		filters = _.isArray( filters ) ? filters : [ filters ];
		_.each( filters, function( filter ) {
			filter.direction = filter.direction || _config.filterDirection;
			_.each( ( filter.direction === "both" ) ? [ "in", "out" ] : [ filter.direction ], function( dir ) {
				if ( this.filters[dir][filter.channel] && _.include( this.filters[dir][filter.channel], filter.topic ) ) {
					this.filters[dir][filter.channel] = _.without( this.filters[dir][filter.channel], filter.topic );
				}
			}, this );
		}, this );
	},
	canSendRemote: function( channel, topic ) {
		return _matchesFilter( channel, topic, "out" );
	},
	configure: function( cfg ) {
		if ( cfg && cfg.filterMode && cfg.filterMode !== "blacklist" && cfg.filterMode !== "whitelist" ) {
			throw new Error( "postal.fedx filterMode must be 'blacklist' or 'whitelist'." );
		}
		if ( cfg ) {
			_config = _.defaults( cfg, _defaults );
		}
		return _config;
	},
	getPackingSlip: function( type /*, env */ ) {
		if ( Object.prototype.hasOwnProperty.call( packingSlips, type ) ) {
			return packingSlips[type].apply( this, Array.prototype.slice.call( arguments, 1 ) );
		}
	},
	onFederatedMsg: function( data ) {
		if ( !_ready ) {
			_inboundQueue.push( data );
			return;
		}
		if ( Object.prototype.hasOwnProperty.call( handlers, data.packingSlip.type ) ) {
			handlers[data.packingSlip.type]( data );
		} else {
			throw new Error( "postal.federation does not have a message handler for '" + data.packingSlip.type + "'." );
		}
	},
	sendMessage: function( envelope ) {
		if ( !_ready ) {
			_outboundQueue.push( arguments );
			return;
		}
		_.each( this.transports, function( transport ) {
			transport.sendMessage( envelope );
		} );
	},
	disconnect: function( options ) {
		options = options || {};
		let transports = this.transports;
		if ( options.transport ) {
			transports = {};
			transports[options.transport] = this.transports[options.transport];
		}
		_.each( transports, function( transport ) {
			transport.disconnect( {
				target: options.target,
				instanceId: options.instanceId,
				doNotNotify: !!options.doNotNotify
			} );
		}, this );
	},
	_getTransports: function() {
		return _.reduce( this.transports, function( memo, transport, name ) {
			memo[name] = true;
			return memo;
		}, {} );
	},
	/*
		signalReady( callback );
		signalReady( "transportName" );
		signalReady( "transportName", callback );
		signalReady( "transportName", targetInstance, callback ); <-- this is NEW
		signalReady( { transportNameA: targetsForA, transportNameB: targetsForB, transportC: true }, callback);
	*/
	signalReady: function( transport, target, callback ) {
		if ( !_ready ) {
			_signalQueue.push( arguments );
			return;
		}
		let transports = this._getTransports();
		switch ( arguments.length ) {
		case 1:
			if ( typeof transport === "function" ) {
				callback = transport;
			} else if ( typeof transport === "string" ) {
				transports = {};
				transports[transport] = this.transports[transport];
				callback = NO_OP;
			}
			break;
		case 2:
			if ( typeof transport === "string" ) {
				transports = {};
				transports[transport] = this.transports[transport];
			} else {
				transports = transport;
			}
			callback = target || NO_OP;
			break;
		case 3:
			transports = {};
			transports[transport] = [ target ];
			break;
		}
		_.each( transports, function( targets, name ) {
			targets = typeof targets === "boolean" ? [] : targets;
			this.transports[name].signalReady( targets, callback );
		}, this );
	}
};

function processSignalQ( args ) {
	fedx.signalReady.apply( this, args );
}

function processOutboundQ( args ) {
	fedx.send.apply( this, args );
}

function processInboundQ( msg ) {
	fedx.onFederatedMsg.call( this, msg );
}

postal.addWireTap( function( data, envelope ) {
	if ( fedx.canSendRemote( envelope.channel, envelope.topic ) ) {
		fedx.sendMessage( envelope );
	}
} );

postal.subscribe( {
	channel: postal.configuration.SYSTEM_CHANNEL,
	topic: "instanceId.changed",
	callback: function() {
		_ready = true;
		while ( _signalQueue.length ) {
			processSignalQ( _signalQueue.shift() );
		}
		while ( _outboundQueue.length ) {
			processOutboundQ( _outboundQueue.shift() );
		}
		while ( _inboundQueue.length ) {
			processInboundQ( _inboundQueue.shift() );
		}
	}
} );

if ( postal.instanceId() !== undefined ) {
	_ready = true;
}
