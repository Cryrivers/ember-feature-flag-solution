/*jshint node:true*/
/* global require, module */
'use strict';
var BabelDefeatureify = require('./lib/babel-defeatureify');
var TemplateDefeatureify = require('./lib/template-defeatureify');
var StyleDefeatureify = require('./lib/style-defeatureify');

module.exports = {
  name: 'ember-feature-flag-solution',
  included: function (app) {

    app.options.featureFlag = app.options.featureFlag || {};
    app.options.featureFlag.features = app.options.featureFlag.features || {};
    app.options.featureFlag.development = app.options.featureFlag.development || false;
    app.options.featureFlag.production = app.options.featureFlag.production || true;

    // Add babel plugin to filter out `featureFlag` function in JS files
    var babelDefeatureifyInstance = BabelDefeatureify({
      import: {
        module: 'ember-feature-flag-solution/helpers/feature-flag',
        name: 'featureFlag'
      },
      features: app.options.featureFlag.features
    });

    if (app.options.babel.plugins) {
      app.options.babel.plugins.push(babelDefeatureifyInstance);
    } else {
      app.options.babel.plugins = [babelDefeatureifyInstance];
    }

    // Add htmlbars-ast-plugin to filter out `feature-flag` helpers in templates
    app.registry.add('htmlbars-ast-plugin', {
      name: 'feature-flag-template-defeatureify',
      plugin: TemplateDefeatureify({
        features: app.options.featureFlag.features
      })
    });

    // Add css preprocessor to output feature flag constants
    // app.registry.add('css', )
  },
  isDevelopingAddon: function () {
    return true;
  }
};
