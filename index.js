/*jshint node:true*/
/* global require, module */
'use strict';
var Funnel = require('broccoli-funnel');
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
    var app = registry.app.options;
    if (app) {
      // Setup Default Values
      app.featureFlag = app.featureFlag || {};
      app.featureFlag.features = app.featureFlag.features || {};
      app.featureFlag.includeFileByFlag = app.featureFlag.includeFileByFlag || {};
      app.featureFlag.development = app.featureFlag.development || false;
      app.featureFlag.production = app.featureFlag.production || true;

      // Add css plugin to provide feature flags to SCSS
      registry.add('css', new StyleDefeatureify({
        features: registry.app.options.featureFlag.features
      }));
    }
  },
  postprocessTree: function(type, tree) {
    if (type !== 'all') {
      return tree;
    } else {
      var features = this.app.options.featureFlag.features;
      var includeFileByFlag = this.app.options.featureFlag.includeFileByFlag;
      var excludes = [];
      Object.keys(features).forEach(function(flag) {
        if (!features[flag] && includeFileByFlag[flag]) {
          excludes = excludes.concat(includeFileByFlag[flag]);
        }
      });
      return new Funnel(tree, {
        exclude: excludes,
        description: 'Funnel: Conditionally Filtered Files by Feature Flags'
      });
    }
  },
  isDevelopingAddon: function () {
    return true;
  }
};
