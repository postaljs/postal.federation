/*global postal*/

postal.instanceId( "parent" );

postal.fedx.addFilter( [
	{ channel : 'postal', topic : '#', direction : 'both' },
	{ channel : 'iframez', topic : '#', direction : 'out' },
	{ channel : 'parentz', topic : '#', direction : 'in'  }
] );
postal.fedx.onFederation = function(data){
	  return {
		instanceId : data.source.instanceId + "_ParentDefined",
		filters : [
		       	{ channel : 'postal', topic : '#', direction : 'both' },
		    	{ channel : 'iframez', topic : '#', direction : 'out' },
		    	{ channel : 'parentz', topic : '#', direction : 'in'  }
		 ]
	  };
};
postal.addWireTap( function ( d, e ) {
	if(console && console.log){console.log( "ID: " + postal.instanceId() + " " + JSON.stringify( e, null, 4 ) );}
	//console.debug( "ID: " + postal.instanceId() ,JSON.stringify( e, null, 4 ) );
} );

$( function () {

	postal.subscribe( {
		channel : "parentz",
		topic : "#",
		callback : function ( d, e ) {
			$( "#msgs" ).append( "<div><pre>" + JSON.stringify( e, null, 4 ) + "</pre></div>" );
		}
	} );
	postal.subscribe( {
		channel : "postal",
		topic : "#",
		callback : function ( d, e ) {
			$( "#msgs" ).append( "<div><pre>" + JSON.stringify( e, null, 4 ) + "</pre></div>" );
		}
	} );

	$( "#msg1" ).on( 'click', function () {
		postal.publish( {
			channel : "iframez",
			topic : "some.topic",
			data : "This message will appear in an iframe"
		} );
	} );

	// disconnecting via passing the content window as a target
	$( "#disconnect1" ).on( "click", function () {
		postal.fedx.disconnect( {
			target : document.getElementById( "iframe1" ).contentWindow
		} );
	} );

	// disconnecting via passing the instanceId
	$( "#disconnect2" ).on( "click", function () {
		postal.fedx.disconnect( {
			instanceId : "iframe2"
		} );
	} );

} );
