/* global __dirname */
/*eslint-disable */
var webpack = require( "webpack" );
var sml = require( "source-map-loader" );
/*eslint-enable */
var path = require( "path" );

module.exports = {
	module: {
		preLoaders: [
			{
				test: /\.js$/,
				loader: "source-map-loader"
			}
		],
		loaders: [
			{ test: /sinon.*\.js/, loader: "imports?define=>false" },
			{ test: /\.spec\.js$/, exclude: /node_modules/, loader: "babel-loader" }
		]
	},
	resolve: {
		alias: {
			"postal.federation": path.join( __dirname, "./lib/postal.federation.js" )
		}
	}
};
