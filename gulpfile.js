var gulp = require( "gulp" );
var eslint = require( "gulp-eslint" );
var header = require( "gulp-header" );
var uglify = require( "gulp-uglify" );
var rename = require( "gulp-rename" );
var gutil = require( "gulp-util" );
var express = require( "express" );
var path = require( "path" );
var pkg = require( "./package.json" );
var open = require( "open" );
var port = 3080;
var jscs = require( "gulp-jscs" );
var gulpChanged = require( "gulp-changed" );
var webpack = require( "gulp-webpack" );

var banner = [ "/**",
    " * <%= pkg.name %> - <%= pkg.description %>",
    " * Author: <%= pkg.author %>",
    " * Version: v<%= pkg.version %>",
    " * Url: <%= pkg.homepage %>",
    " * License(s): <%= pkg.license %>",
    " */",
    ""
].join( "\n" );

gulp.task( "build:es5", [ "format" ], function() {
	return gulp.src( "src/index.js" )
		.pipe( webpack( require( "./webpack.config.js" ) ) )
		.pipe( header( banner, {
			pkg: pkg
		} ) )
		.pipe( rename( "postal.federation.js" ) )
		.pipe( gulp.dest( "lib/" ) )
		.pipe( uglify( {
			compress: {
				/*eslint-disable */
				negate_iife: false
				/*eslint-enable */
			}
		} ) )
		.pipe( header( banner, {
			pkg: pkg
		} ) )
		.pipe( rename( "postal.federation.min.js" ) )
		.pipe( gulp.dest( "lib/" ) );
} );

gulp.task( "default", [ "build:es5" ] );

function runTests( options, done ) {
	var karma = require( "karma" ).server;
	karma.start( _.extend( {
		configFile: path.join( __dirname, "/karma.conf.js" ),
		singleRun: true

		// no-op keeps karma from process.exit'ing gulp
	}, options ), done || function() {} );
}

gulp.task( "test", [ "format" ], function( done ) {
	// There are issues with the osx reporter keeping
	// the node process running, so this forces the main
	// test task to not show errors in a notification
	runTests( { reporters: [ "spec" ] }, function( err ) {
		if ( err !== 0 ) {
			// Exit with the error code
			throw err;
		} else {
			done( null );
		}
	} );
} );

var mocha = require( "gulp-spawn-mocha" );
gulp.task( "mocha", function() {
	return gulp.src( [ "spec/**/*.spec.js" ], { read: false } )
		.pipe( mocha( {
			require: [ "spec/helpers/node-setup.js" ],
			reporter: "spec",
			colors: true,
			inlineDiffs: true,
			debug: false
		} ) )
		.on( "error", console.warn.bind( console ) );
} );

gulp.task( "lint", function() {
	return gulp.src( [ "src/**/*.js", "spec/**/*.spec.js" ] )
	.pipe( eslint() )
	.pipe( eslint.format() )
	.pipe( eslint.failOnError() );
} );

gulp.task( "format", [ "lint" ], function() {
	return gulp.src( [ "**/*.js", "!node_modules/**" ] )
		.pipe( jscs( {
			configPath: ".jscsrc",
			fix: true
		} ) )
		.on( "error", function( error ) {
			gutil.log( gutil.colors.red( error.message ) );
			this.end();
		} )
		.pipe( gulpChanged( ".", { hasChanged: gulpChanged.compareSha1Digest } ) )
		.pipe( gulp.dest( "." ) );
} );

gulp.task( "watch", function() {
	gulp.watch( "src/**/*", [ "default" ] );
} );

var createServer = function( port ) {
	var p = path.resolve( "./" );
	var app = express();
	app.use( express.static( p ) );
	app.listen( port, function() {
		gutil.log( "Listening on", port );
	} );

	return {
		app: app
	};
};

var servers;

gulp.task( "server", function() {
	if ( !servers ) {
		servers = createServer( port );
	}
	open( "http://localhost:" + port + "/index.html" );
} );
