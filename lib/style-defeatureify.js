/*jshint node:true*/
/* global require, module */
var path = require('path');
var mergeTrees = require('broccoli-merge-trees');
var writeFile = require('broccoli-file-creator');

function SassFeatureFlagPreprocessor(options) {
  this.options = options || {};
  this.options.features = this.options.features || {};
}

SassFeatureFlagPreprocessor.prototype.toTree = function (tree, inputPath) {
  var variables = '';
  Object.keys(this.options.features).forEach(function(featureName, index, array) {
    variables += '$' + featureName + ': ' + (array[featureName] ? 'true' : 'false') + ';\n';
  });
  var featureFlagTree = writeFile(path.join(inputPath, 'feature-flags.scss'), variables);
  return mergeTrees([tree, featureFlagTree], { overwrite: true });
};

module.exports = SassFeatureFlagPreprocessor;
