/* global describe, postal, before, expect, it*/
describe( "postal.federation - unit tests", function() {
	postal.instanceId( "test123" );
	var postalFedx = postal.fedx;

	var transport = postalFedx.transports.testTransport = {
		remotes: []
	};
	var expectedResult = {
		type: "federation.bundle",
		instanceId: "test123",
		packingSlips: [ {
			type: "federation.pong",
			instanceId: "test123",
			timeStamp: "2014-05-22T05:20:52.276Z",
			pingData: {
				instanceId: "testInstance",
				timeStamp: "2014-05-22T05:20:52.037Z",
				ticket: "5d533fe0-d8fd-4974-8201-fde67f562a3e"
			}
		}, {
			type: "federation.ping",
			instanceId: "test123",
			timeStamp: "2014-05-22T05:20:52.276Z",
			ticket: "0f6399a2-3b63-4d48-8d2d-3aae4d1337dd"
		} ]
	};
	var testTarget = {};
	var remoteInstanceId = "testInstance";
	var pingId = postal.createUUID();
	var client = new postalFedx.FederationClient( testTarget, {}, undefined );

	client.transportName = "testTransport";
	client.sentItems = [];
	client.send = function( msg ) {
		client.sentItems.push( msg );
	};
	transport.remotes.push( client );
	describe( "when receiving a ping", function() {
		var pingSlip = {
			source: client,
			packingSlip: {
				type: "federation.ping",
				instanceId: remoteInstanceId,
				timeStamp: new Date(),
				ticket: pingId
			}
		};

		before( function() {
			postalFedx.onFederatedMsg( pingSlip );
		} );

		it( "Should have set client's instanceId", function() {
			expect( client.instanceId ).to.be( remoteInstanceId );
		} );
		it( "should have sent a federation bundle msg", function() {
			expect( client.sentItems[0].type ).to.be( expectedResult.type );
			expect( client.sentItems[0].instanceId ).to.be( expectedResult.instanceId );
		} );
		it( "should have federation.pong as first bundle item", function() {
			expect( client.sentItems[0].packingSlips[0].type ).to.be( expectedResult.packingSlips[0].type );
			expect( client.sentItems[0].packingSlips[0].instanceId ).to.be( postal.instanceId() );
		} );
		it( "should have federation.ping as second bundle item", function() {
			expect( client.sentItems[0].packingSlips[1].type ).to.be( expectedResult.packingSlips[1].type );
			expect( client.sentItems[0].packingSlips[1].instanceId ).to.be( postal.instanceId() );
		} );
	} );
	describe( "when receiving a pong", function() {
		var pongSlip = {
			type: "federation.pong",
			instanceId: remoteInstanceId,
			timeStamp: new Date(),
			pingData: {
				instanceId: expectedResult.instanceId,
				timeStamp: expectedResult.timeStamp,
				ticket: expectedResult.ticket
			}
		};
		var handshakeBefore = client.handshakeComplete;
		var clientsBefore = postalFedx.clients.length;
		var msg;
		before( function() {
			postal.subscribe( {
				channel: "postal.federation",
				topic: "client.federated",
				callback: function( d ) {
					msg = d;
				}
			} ).once();
			client.onMessage( pongSlip );
		} );
		it( "should show handshake in proper state before & after pong", function() {
			expect( handshakeBefore ).to.be( false );
			expect( client.handshakeComplete ).to.be( true );
		} );
		it( "should add client to clients array", function() {
			expect( clientsBefore ).to.be( 0 );
			expect( postalFedx.clients.length ).to.be( 1 );
			expect( postalFedx.clients[0] ).to.be( remoteInstanceId );
		} );
		it( "should publish a client.federated message", function() {
			expect( msg.remoteId ).to.be( remoteInstanceId );
			expect( msg.localId ).to.be( postal.instanceId() );
			expect( msg.transport ).to.be( "testTransport" );
		} );
	} );
	describe( "when receiving a message", function() {
		var msgSlip = {
			type: "federation.message",
			instanceId: remoteInstanceId,
			timeStamp: new Date(),
			envelope: {
				channel: "testy.feddy",
				topic: "msgs.are.fun",
				data: {
					foo: "bar"
				}
			}
		};
		var msg;
		before( function() {
			postal.subscribe( {
				channel: "testy.feddy",
				topic: "msgs.are.fun",
				callback: function( d ) {
					msg = d;
				}
			} ).once();
		} );
		it( "it should not publish the remote msg without filters set", function() {
			client.onMessage( msgSlip );
			expect( msg ).to.be( undefined );
		} );
		it( "it should publish the remote msg with filters set", function() {
			postalFedx.addFilter( {
				channel: "testy.feddy",
				topic: "#",
				direction: "in"
			} );
			client.onMessage( msgSlip );
			expect( msg.foo ).to.be( "bar" );
		} );
	} );
} );
