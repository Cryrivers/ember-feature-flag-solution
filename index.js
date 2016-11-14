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
    
    // if no feature flag config, look for its parent
    var _app = app;
    while (_app.app && !this._hasFeatureFlagConfig(_app.registry)) {
      _app = _app.app;
    }
    this.setupPreprocessorRegistry('parent', _app.registry);
    
    // `packageName` could be either app package name or addon/engine package name
    var packageName = app.project.pkg.name || app.options.name;

    if (this.featureFlag.strip) {
      // Add babel plugin to filter out `featureFlag` function in JS files
      var babelDefeatureifyInstance = BabelDefeatureify({
        import: {
          module: packageName + '/helpers/feature-flag',
          name: 'featureFlag'
        },
        features: this.featureFlag.features,
        verbose: this.featureFlag.verbose
      });

      var babelRemoveImportsInstance = BabelRemoveImports({
        import: {
          module: packageName + '/helpers/feature-flag'
        }
      });

      babelDefeatureifyInstance.baseDir = function() {
        return __dirname;
      };

      babelRemoveImportsInstance.baseDir = function() {
        return __dirname;
      };

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
        }),
        baseDir: function() {
          return __dirname;
        }
      });
    }

  },
  _hasFeatureFlagConfig(registry) {
    return registry.app.options && registry.app.featureFlag;
  },
  setupPreprocessorRegistry: function(type, registry) {
    if (registry.app.options) {
      this.featureFlag = registry.app.options.featureFlag || {};
      this.featureFlag.features = this.featureFlag.features || {};
      this.featureFlag.includeFileByFlag = this.featureFlag.includeFileByFlag || {};
      this.featureFlag.excludeFileByFlag = this.featureFlag.excludeFileByFlag || {};
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
        var excludeFileByFlag = this.featureFlag.excludeFileByFlag;
        var excludes = [];
        Object.keys(features).forEach(function(flag) {
          if (!features[flag] && includeFileByFlag[flag]) {
            excludes = excludes.concat(includeFileByFlag[flag]);
          } else if (features[flag] && excludeFileByFlag[flag]) {
            excludes = excludes.concat(excludeFileByFlag[flag]);
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
