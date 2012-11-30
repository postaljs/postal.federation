(function ( root, factory ) {
  if ( typeof define === "function" && define.amd ) {
    // AMD. Register as an anonymous module.
    define( ["postal"], function ( _ ) {
      return factory( postal, root );
    } );
  } else {
    // Browser globals
    root.postal = factory( root.postal, root );
  }
}( this, function ( postal, global, undefined ) {

  //import("../federation.js");

  return postal;

} ));