/*jshint node:true*/
/* global require, module */
var fs = require('fs');
var path = require('path');
var Funnel = require('broccoli-funnel');
var Writer = require('broccoli-writer');

function StyleVariableWriter(inputTree, features) {
  this.inputTree = inputTree;
  this.features = features || {};
}

StyleVariableWriter.prototype = Object.create(Writer.prototype);
StyleVariableWriter.prototype.constructor = StyleVariableWriter;
StyleVariableWriter.prototype.write = function (readTree, destDir) {
  fs.writeFileSync(path.join(destDir, 'feature-flags.scss'), '$lalala: red;');
};

function SassFeatureFlagPreprocessor(options) {
  this.options = options || {};
  this.options.features = this.options.features || {};
}

SassFeatureFlagPreprocessor.prototype.toTree = function(tree) {
  return new StyleVariableWriter(tree, this.options.features);
};

module.exports = SassFeatureFlagPreprocessor;
