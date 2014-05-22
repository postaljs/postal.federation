(function(root, factory) {
    if (typeof module === "object" && module.exports) {
        // Node, or CommonJS-Like environments
        module.exports = factory(require("lodash"), require("postal"), require("riveter"));
    } else if (typeof define === "function" && define.amd) {
        // AMD. Register as an anonymous module.
        define(["lodash", "postal", "riveter"], function(_, postal, riveter) {
            return factory(_, postal, riveter, root);
        });
    } else {
        // Browser globals
        root.postal = factory(root._, root.postal, root.riveter, root);
    }
}(this, function(_, postal, riveter, global, undefined) {

    //import("federation.js");

    return postal;

}));
