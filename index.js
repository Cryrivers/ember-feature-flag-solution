/*jshint node:true*/
/* global require, module */
'use strict';
var Funnel = require('broccoli-funnel');
var BabelDefeatureify = require('./lib/babel-defeatureify');
var TemplateDefeatureify = require('./lib/template-defeatureify');
var StyleDefeatureify = require('./lib/style-defeatureify');

module.exports = {
  name: 'ember-feature-flag-solution',
  included: function(app, parentAddon) {

    this._super.included.apply(this, arguments);
    this.setupPreprocessorRegistry('parent', app.registry);

    if (this.featureFlag.strip) {
      // Add babel plugin to filter out `featureFlag` function in JS files
      var babelDefeatureifyInstance = BabelDefeatureify({
        import: {
          module: 'ember-feature-flag-solution/helpers/feature-flag',
          name: 'featureFlag'
        },
        features: this.featureFlag.features,
        verbose: this.featureFlag.verbose
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
          features: this.featureFlag.features,
          verbose: this.featureFlag.verbose
        })
      });
    }

  },
  setupPreprocessorRegistry(type, registry) {
    if (registry.app.options) {

      var appEnvironmentOptions = registry.app.project.config(registry.app.env);
      this.featureFlag = appEnvironmentOptions.featureFlag || {};
      this.featureFlag.features = this.featureFlag.features || {};
      this.featureFlag.includeFileByFlag = this.featureFlag.includeFileByFlag || {};
      this.featureFlag.verbose = this.featureFlag.verbose || true;
      this.featureFlag.strip = this.featureFlag.strip || true;
      if (this.featureFlag.strip) {
        // Add css plugin to provide feature flags to SCSS
        registry.add('css', new StyleDefeatureify({
          features: this.featureFlag.features
        }));
      }
    }
  },
  postprocessTree: function(type, tree) {
    if (type !== 'js') {
      return tree;
    } else {
      if (this.featureFlag.strip) {
        var features = this.featureFlag.features;
        var includeFileByFlag = this.featureFlag.includeFileByFlag;
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
      } else {
        return tree;
      }
    }
  },
  isDevelopingAddon: function() {
    return true;
  }
};
