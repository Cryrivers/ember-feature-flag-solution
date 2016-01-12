/*jshint node:true*/
/* global module */
'use strict';

module.exports = function TransformPrecompileFeatureFlag(options) {
  options = options || {};
  options.helperName = options.helperName || 'feature-flag';
  options.features = options.features || {};

  return function() {
    return {
      transform: function defeatureifyTemplate(element) {

        if (element === null || element === undefined) {
          return element;
        }

        if (element.type === 'BlockStatement') {
          if (element.path.original === 'if' || element.path.original === 'unless') {
            var inverse = (element.path.original === 'unless');
            if (element.params.length === 1) {
              var subexp = element.params[0];
              if (subexp.type === 'SubExpression' && subexp.path.original === options.helperName) {
                var feature = subexp.params[0].value;
                if (options.features[feature]) {
                  return defeatureifyTemplate(inverse ? element.inverse : element.program);
                } else {
                  return defeatureifyTemplate(inverse ? element.program : element.inverse);
                }
              }
            }
          }
        }

        var childrenConsequent = element.body || element.children || (element.program && element.program.body);
        var childrenInverse = element.inverse && element.inverse.body;

        function visitChildren(node) {
          if (node) {
            for (var index = node.length - 1; index >= 0; index -= 1 ) {
              var traverseResult = defeatureifyTemplate(node[index]);
              if (traverseResult === null) {
                traverseResult = [];
              } else if (traverseResult.body) {
                traverseResult = traverseResult.body;
              } else {
                traverseResult = [traverseResult];
              }
              traverseResult.unshift(index, 1);
              Array.prototype.splice.apply(node, traverseResult);
            }
          }
        }

        visitChildren(childrenConsequent);
        visitChildren(childrenInverse);

        return element;
      }
    };
  };
};
