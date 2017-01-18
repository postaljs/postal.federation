import _ from "lodash";

const _defaults = {
	enabled: true,
	filterMode: "whitelist",
	filterDirection: "both"
};

export const NO_OP = function() {};

export let state = {
	_clients: [],
	_transports: {},
	_ready: false,
	_inboundQueue: [],
	_outboundQueue: [],
	_signalQueue: [],
	_config: _defaults
};

export function configure( cfg ) {
	if ( cfg && cfg.filterMode && cfg.filterMode !== "blacklist" && cfg.filterMode !== "whitelist" ) {
		throw new Error( "postal.fedx filterMode must be 'blacklist' or 'whitelist'." );
	}
	if ( cfg ) {
		state._config = _.defaults( cfg, _defaults );
	}
	return state._config;
}

export function disconnect( options ) {
	options = options || {};
	let trans = state._transports;
	if ( options.transport ) {
		trans = {};
		trans[options.transport] = state._transports[options.transport];
	}
	_.forEach( trans, function( t ) {
		t.disconnect( {
			target: options.target,
			instanceId: options.instanceId,
			doNotNotify: !!options.doNotNotify
		} );
	} );
}
