module.exports = {
	entry: "./src/index.js",
	output: {
		library: "postalFedx",
		libraryTarget: "umd",
		filename: "postal.federation.js"
	},
	devtool: "#inline-source-map",
	externals: [
		{
			postal: true,
			lodash: "_"
		}
	],
	module: {
		loaders: [
			{
				test: /\.js?$/,
				exclude: /(node_modules|bower_components)/,
				loader: "babel",
				query: {
					auxiliaryComment: "istanbul ignore next",
					compact: false,
					blacklist: [ "strict" ],
					experimental: true
				}
			}
		]
	}
};
