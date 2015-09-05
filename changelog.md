## v0.5.2

* Restored Missing `configure` method.

## v0.5.1

* Fixed issue where NO_OP reference was not defined.
* Fixed interim readme formatting.

## v0.5.0

* Initial conversion to ES6, using webpack and babel.
* Updated sourcemaps and header generation.
* Separated index.js into ES6 modules and enabled support for ES6 classes.
* Updated Webpack build to properly require lodash in the UMD wrapper.
* Removed mocha task from gulpfile and changed npm test to alias gulp test.
* Added Karma support for tests and add coverage report.

## v0.4.0

* Made UMD export values consistent across AMD, CommonJS and plain globals.
* Removed bower deps for tests, examples
* Removed riveter dependency.
* Project now supports IE9+ (no longer IE8, unless you have an Object.create polyfill).

## v0.3.0-rc1

* Refactored CommonJS module wrapper to only require postal in the factory function exported by the module.
* Exposed the packing slips and the federation message handlers on the postal.fedx namespace as `packingSlips` and `handlers`. This is to prep for future add-on/extensibility work.
