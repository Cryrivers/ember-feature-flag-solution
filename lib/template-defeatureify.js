/*jshint node:true*/
/* global module */
'use strict';

module.exports = function TransformPrecompileFeatureFlag(options) {
  options = options || {};
  options.helperName = options.helperName || 'feature-flag';
  options.features = options.features || {};

  function _checkFeatureFlag(node, consquent, alternate, doNotCheckLength) {
    if (['if', 'unless'].indexOf(node.path.original) > -1) {
      var inverse = node.path.original === 'unless';
      if (node.params.length === 1 || doNotCheckLength) {
        var subexp = node.params[0];
        if (subexp.type === 'SubExpression' && subexp.path.original === options.helperName) {
          var feature = subexp.params[0].value;
          if (options.features[feature]) {
            return inverse ? alternate : consquent;
          } else {
            return inverse ? consquent : alternate;
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
            return _checkFeatureFlag(node, node.program, node.inverse);
          },
          MustacheStatement(node) {
            return _checkFeatureFlag(node, node.params[1] || [], node.params[2] || [], true);
          }
        });
        return ast;
      }
    };
  };
};
