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
