import { getPackingSlip } from "./packingSlips";
import { state, disconnect } from "./state";
import { matchesFilter } from "./filters";
import postal from "postal";
import _ from "lodash";

export const handlers = {
	"federation.ping": function( data /*, callback */ ) {
		data.source.setInstanceId( data.packingSlip.instanceId );
		if ( data.source.handshakeComplete ) {
			data.source.sendPong( data.packingSlip );
		} else {
			data.source.sendBundle( [
			getPackingSlip( "pong", data.packingSlip ),
			getPackingSlip( "ping" )
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
		if ( !_.includes( state._clients, data.packingSlip.instanceId ) ) {
			state._clients.push( data.packingSlip.instanceId );
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
		state._clients = _.without( state._clients, data.source.instanceId );
		disconnect( {
			transport: data.source.transportName,
			instanceId: data.source.instanceId,
			doNotNotify: true
		} );
	},
	"federation.message": function( data ) {
		const env = data.packingSlip.envelope;
		if ( matchesFilter( env.channel, env.topic, "in" ) ) {
			env.lastSender = data.packingSlip.instanceId;
			postal.publish( env );
		}
	},
	"federation.bundle": function( data ) {
		_.forEach( data.packingSlip.packingSlips, function( slip ) {
			onFederatedMsg( _.extend( {}, data, {
				packingSlip: slip
			} ) );
		} );
	}
};

export function onFederatedMsg( data ) {
	if ( !state._ready ) {
		state._inboundQueue.push( data );
		return;
	}
	if ( Object.prototype.hasOwnProperty.call( handlers, data.packingSlip.type ) ) {
		handlers[data.packingSlip.type]( data );
	} else {
		throw new Error( "postal.federation does not have a message handler for '" + data.packingSlip.type + "'." );
	}
}
