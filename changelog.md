## v0.4.0

* Made UMD export values consistent across AMD, CommonJS and plain globals.
* Removed bower deps for tests, examples
* Removed riveter dependency. 
* Project now supports IE9+ (no longer IE8, unless you have an Object.create polyfill).

## v0.3.0-rc1

* Refactored CommonJS module wrapper to only require postal in the factory function exported by the module.
* Exposed the packing slips and the federation message handlers on the postal.fedx namespace as `packingSlips` and `handlers`. This is to prep for future add-on/extensibility work.
