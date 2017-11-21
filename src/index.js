import _ from "lodash";
import postal from "postal";
import "./postal-utils";
import { packingSlips, getPackingSlip } from "./packingSlips";
import { state, disconnect, NO_OP, configure } from "./state";
import { handlers, onFederatedMsg } from "./handlers";
import filters, { matchesFilter, addFilter, removeFilter } from "./filters";
import FederationClient from "./FederationClient";

const fedx = postal.fedx = {
	FederationClient: FederationClient,
	packingSlips: packingSlips,
	handlers: handlers,
	clients: state._clients,
	transports: state._transports,
	filters,
	addFilter,
	removeFilter,
	canSendRemote: function( channel, topic ) {
		return matchesFilter( channel, topic, "out" );
	},
	configure: configure,
	getPackingSlip,
	onFederatedMsg: onFederatedMsg,
	sendMessage: function( envelope ) {
		if ( !state._ready ) {
			state._outboundQueue.push( arguments );
			return;
		}
		_.forEach( this.transports, function( transport ) {
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
		_.forEach( transports, _.bind( function( targets, name ) {
			targets = typeof targets === "boolean" ? [] : targets;
			this.transports[name].signalReady( targets, callback );
		}, this ) );
	}
};

export default fedx;

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
