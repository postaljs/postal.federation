## v0.3.0-rc1

* Refactored CommonJS module wrapper to only require postal in the factory function exported by the module.
* Exposed the packing slips and the federation message handlers on the postal.fedx namespace as `packingSlips` and `handlers`. This is to prep for future add-on/extensibility work.