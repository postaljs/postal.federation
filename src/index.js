import _ from "lodash";
import postal from "postal";
import "./postal-utils";
import { packingSlips, getPackingSlip } from "./packingSlips";
import { state, disconnect, NO_OP } from "./state";
import { handlers, onFederatedMsg, _matchesFilter } from "./handlers";
import FederationClient from "./FederationClient";

export default fedx = postal.fedx = {
	FederationClient: FederationClient,
	packingSlips: packingSlips,
	handlers: handlers,
	clients: state._clients,
	transports: state._transports,
	filters: {
		"in": {}, // jscs:ignore disallowQuotedKeysInObjects
		out: {}
	},
	addFilter: function( filters ) {
		filters = _.isArray( filters ) ? filters : [ filters ];
		_.each( filters, function( filter ) {
			filter.direction = filter.direction || state._config.filterDirection;
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
			filter.direction = filter.direction || state._config.filterDirection;
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
	getPackingSlip,
	onFederatedMsg: onFederatedMsg,
	sendMessage: function( envelope ) {
		if ( !state._ready ) {
			state._outboundQueue.push( arguments );
			return;
		}
		_.each( this.transports, function( transport ) {
			transport.sendMessage( envelope );
		} );
	},
	disconnect: disconnect,
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
		if ( !state._ready ) {
			state._signalQueue.push( arguments );
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
		state._ready = true;
		while ( state._signalQueue.length ) {
			processSignalQ( state._signalQueue.shift() );
		}
		while ( state._outboundQueue.length ) {
			processOutboundQ( state._outboundQueue.shift() );
		}
		while ( state._inboundQueue.length ) {
			processInboundQ( state._inboundQueue.shift() );
		}
	}
} );

if ( postal.instanceId() !== undefined ) {
	state._ready = true;
}
