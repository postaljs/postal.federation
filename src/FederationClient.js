import { getPackingSlip } from "./packingSlips";
import { onFederatedMsg } from "./handlers";
import { state, NO_OP } from "./state";
import postal from "postal";
import _ from "lodash";

export default class FederationClient {
	constructor( target, options, instanceId ) {
		this.target = target;
		this.options = options || {};
		this.pings = {};
		this.instanceId = instanceId;
		this.handshakeComplete = false;
	}

	sendPing( callback ) {
		const packingSlip = getPackingSlip( "ping" );
		this.pings[packingSlip.ticket] = {
			ticket: packingSlip.ticket,
			callback: callback || NO_OP
		};
		this.send( packingSlip );
	}

	sendPong( origPackingSlip ) {
		this.send( getPackingSlip( "pong", origPackingSlip ) );
	}

	sendBundle( slips ) {
		this.send( getPackingSlip( "bundle", slips ) );
	}

	sendMessage( envelope ) {
		if ( !this.handshakeComplete ) {
			return;
		}
		envelope.originId = envelope.originId || postal.instanceId();
		const env = _.clone( envelope );
		if ( this.instanceId && this.instanceId !== env.lastSender &&
		( !env.knownIds || !env.knownIds.length ||
		( env.knownIds && !_.includes( env.knownIds, this.instanceId ) ) )
		) {
			env.knownIds = ( env.knownIds || [] ).concat( _.without( state._clients, this.instanceId ) );
			this.send( getPackingSlip( "message", env ) );
		}
	}

	disconnect() {
		this.send( getPackingSlip( "disconnect" ) );
	}

	onMessage( packingSlip ) {
		if ( this.shouldProcess() ) {
			onFederatedMsg( {
				transport: this.transportName,
				packingSlip: packingSlip,
				source: this
			} );
		}
	}

	shouldProcess() {
		return true;
	}

	send( /* msg */ ) {
		throw new Error( "An object deriving from FederationClient must provide an implementation for 'send'." );
	}

	setInstanceId( id ) {
		this.instanceId = id;
	}

	static extend( props, ctrProps ) {
		function FedXClient() {
			FederationClient.apply( this, arguments );
		}

		FedXClient.prototype = Object.create( FederationClient.prototype );
		_.extend( FedXClient.prototype, props );
		_.extend( FedXClient, ctrProps );

		return FedXClient;
	}
}
