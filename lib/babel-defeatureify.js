/* jshint node: true */
/*
  Credit goes to ember-cli/babel-plugin-feature-flags: https://github.com/ember-cli/babel-plugin-feature-flags
 */
'use strict';
module.exports = function(options) {
  options = options || {};
  options.features = options.features || {};
  options.import = options.import || {};
  options.import.name = options.import.name || 'default';

  if (typeof options.import.module !== 'string') {
    throw new Error("options.import.module must be the name of a module, e.g. 'my-app/features'");
  }

  Object.keys(options.features).forEach(function(feature) {
    var value = options.features[feature];

    if (typeof value === 'string') {
      if (value === 'enabled') {
        options.features[feature] = true;
      } else if (value === 'disabled') {
        options.features[feature] = false;
      } else if (value === 'dynamic') {
        options.features[feature] = null;
      } else {
        throw new Error("An unknown feature state '" + value + "' was detected for '" + feature + "'. Valid values are 'enabled', 'disabled' and 'dynamic'");
      }
    }
  });

  return function(babel) {
    function acceptFeatureCall(callExpression, targetStatement, invert, file, block) {
      var callee = callExpression.get('callee');

      if (callee.referencesImport(options.import.module, options.import.name)) {
        var feature;
        var value;
        if (callExpression.node.arguments[0].elements) {
          feature = callExpression.node.arguments[0].elements[0].value;
        } else {
          feature = callExpression.node.arguments[0].value;
          file.log.warn("You should use featureFlag(['feature']) instead of featureFlag('feature') or the function won't run at runtime");
        }
        if (feature in options.features) {
          value = options.features[feature];
        } else {
          value = false;
          file.log.warn("An unknown feature '" + feature + "' was encountered and removed");
        }
        if (value === !invert) {
          var consequent = targetStatement.node.consequent;
          if (block) {
            targetStatement.replaceWithMultiple(consequent.body);
          } else {
            targetStatement.replaceWith(consequent);
          }
        } else if (value === !!invert) {
          var alternate = targetStatement.node.alternate;
          if (alternate) {
            if (block) {
              targetStatement.replaceWithMultiple(alternate.body);
            } else {
              targetStatement.replaceWith(alternate);
            }
          } else {
            if (block) {
              targetStatement.dangerouslyRemove();
            } else {
              targetStatement.replaceWith('undefined');
            }
          }
        }
      }
    }

    return new babel.Transformer('babel-plugin-feature-flags', {
      IfStatement: function(node, parent, scope, file) {
        var test = this.get('test');
        if (test.isUnaryExpression() && test.node.operator === '!') {
          var argument = test.get('argument');
          if (argument.isCallExpression()) {
            acceptFeatureCall(argument, this, true, file, true);
          }
        } else if (test.isCallExpression()) {
          acceptFeatureCall(test, this, false, file, true);
        }
      },
      ConditionalExpression: function(node, parent, scope, file) {
        var test = this.get('test');
        if (test.isUnaryExpression() && test.node.operator === '!') {
          var argument = test.get('argument');
          if (argument.isCallExpression()) {
            acceptFeatureCall(argument, this, true, file);
          }
        } else if (test.isCallExpression()) {
          acceptFeatureCall(test, this, false, file);
        }
      }
    });
  };
};
