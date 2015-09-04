import postal from "postal";

export function getPackingSlip( type /*, env */ ) {
	if ( Object.prototype.hasOwnProperty.call( packingSlips, type ) ) {
		return packingSlips[ type ].apply( this, Array.prototype.slice.call( arguments, 1 ) );
	}
}

export const packingSlips = {
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
