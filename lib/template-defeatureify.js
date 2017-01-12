/*jshint node:true*/
/* global module */
'use strict';

module.exports = function TransformPrecompileFeatureFlag(options) {
  options = options || {};
  options.helperName = options.helperName || 'feature-flag';
  options.features = options.features || {};

  function _checkFeatureFlag(node, consequent, alternate, doNotCheckLength) {
    if (['if', 'unless'].indexOf(node.path.original) > -1) {
      var inverse = (node.path.original === 'unless');
      if (node.params.length === 1 || doNotCheckLength) {
        var subexp = node.params[0];
        if (subexp.type === 'SubExpression' && subexp.path.original === options.helperName) {
          var feature = subexp.params[0].value;
          if (options.features[feature]) {
            return inverse ? alternate : consequent;
          } else {
            return inverse ? consequent : alternate;
          }
        }
      }
    }
  }

  return function() {
    return {
      transform: function(ast) {
        this.syntax.traverse(ast, {
          BlockStatement(node) {
            var consequent = node.body || node.children || (node.program && node.program.body) || [];
            var alternate = node.inverse && node.inverse.body || [];
            return _checkFeatureFlag(node, consequent, alternate);
          },
          MustacheStatement(node) {
            var consequent = node.params[1] || [];
            var alternate = node.params[2] || [];
            return _checkFeatureFlag(node, consequent, alternate, true);
          }
        });
        return ast;
      }
    };
  };
};
