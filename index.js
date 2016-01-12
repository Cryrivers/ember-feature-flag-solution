/*jshint node:true*/
/* global require, module */
'use strict';
var BabelDefeatureify = require('./lib/babel-defeatureify');
var TemplateDefeatureify = require('./lib/template-defeatureify');
var StyleDefeatureify = require('./lib/style-defeatureify');

module.exports = {
  name: 'ember-feature-flag-solution',
  included: function (app) {

    this.app = app;
    this._super.included.apply(this, arguments);
    this.setupPreprocessorRegistry('parent', app.registry);

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
  },
  setupPreprocessorRegistry(type, registry) {
    if (registry.app.options) {
      // Setup Default Values
      registry.app.options.featureFlag = registry.app.options.featureFlag || {};
      registry.app.options.featureFlag.features = registry.app.options.featureFlag.features || {};
      registry.app.options.featureFlag.development = registry.app.options.featureFlag.development || false;
      registry.app.options.featureFlag.production = registry.app.options.featureFlag.production || true;

      // Add css plugin to provide feature flags to SCSS
      registry.add('css', new StyleDefeatureify({
        features: registry.app.options.featureFlag.features
      }));
    }
  },
  isDevelopingAddon: function () {
    return true;
  }
};
