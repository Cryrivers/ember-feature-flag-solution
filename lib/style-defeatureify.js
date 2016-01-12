/*jshint node:true*/
/* global require, module */
var Writer = require('broccoli-writer');
function SassFeatureFlagPreprocessor(inputTree, options) {
  this.inputTree = inputTree;
  this.options = options || {};
}
