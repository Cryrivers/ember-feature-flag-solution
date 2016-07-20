/*jshint node:true*/
/* global require, module */
'use strict';
var Funnel = require('broccoli-funnel');
var BabelDefeatureify = require('./lib/babel-defeatureify');
var BabelRemoveImports = require('./lib/babel-remove-imports');
var TemplateDefeatureify = require('./lib/template-defeatureify');
var StyleDefeatureify = require('./lib/style-defeatureify');

module.exports = {
  name: 'ember-feature-flag-solution',
  config: function() {
    if (this.featureFlag) {
      if (!this.featureFlag.strip) {
        return {
          featureFlag: this.featureFlag
        };
      }
    }
  },
  included: function(app) {

    this._super.included.apply(this, arguments);
    this.setupPreprocessorRegistry('parent', app.registry);

    if (this.featureFlag.strip) {
      // Add babel plugin to filter out `featureFlag` function in JS files
      var babelDefeatureifyInstance = BabelDefeatureify({
        import: {
          module: app.project.pkg.name + '/helpers/feature-flag',
          name: 'featureFlag'
        },
        features: this.featureFlag.features,
        verbose: this.featureFlag.verbose
      });

      var babelRemoveImportsInstance = BabelRemoveImports({
        import: {
          module: app.project.pkg.name + '/helpers/feature-flag'
        }
      });

      if (app.options.babel.plugins) {
        app.options.babel.plugins.push(babelDefeatureifyInstance);
        app.options.babel.plugins.push(babelRemoveImportsInstance);
      } else {
        app.options.babel.plugins = [babelDefeatureifyInstance, babelRemoveImportsInstance];
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
  setupPreprocessorRegistry: function(type, registry) {
    if (registry.app.options) {
      this.featureFlag = registry.app.options.featureFlag || {};
      this.featureFlag.features = this.featureFlag.features || {};
      this.featureFlag.includeFileByFlag = this.featureFlag.includeFileByFlag || {};
      // Add css plugin to provide feature flags to SCSS
      registry.add('css', new StyleDefeatureify({
        features: this.featureFlag.features
      }));
    }
  },
  postprocessTree: function(type, tree) {
    if (type === 'js') {
      if (this.featureFlag.strip) {
        var features = this.featureFlag.features;
        var includeFileByFlag = this.featureFlag.includeFileByFlag;
        var excludes = [];
        Object.keys(features).forEach(function(flag) {
          if (!features[flag] && includeFileByFlag[flag]) {
            excludes = excludes.concat(includeFileByFlag[flag]);
          }
        });
        // Exclude featureFlag helpers as it is redundant in stripped build
        excludes.push(/helpers\/feature-flag\.js/);
        return new Funnel(tree, {
          exclude: excludes,
          description: 'Funnel: Conditionally Filtered Files by Feature Flags'
        });
      } else {
        return tree;
      }
    } else if (type === 'css') {
      return new Funnel(tree, {
        exclude: [
          /feature-flags\.scss/
        ],
        description: 'Funnel: Remove feature-flag.scss from dist'
      });
    } else {
      return tree;
    }
  },
  isDevelopingAddon: function() {
    return false;
  }
};
