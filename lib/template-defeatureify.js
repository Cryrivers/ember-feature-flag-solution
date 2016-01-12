/*jshint node:true*/
/* global module */
'use strict';

/**
 * Traverse Handlebars AST to find {{#if (feature-flag 'xxx')}}
 * @param options
 * @returns {Function}
 */
module.exports = function(options) {
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
          if (element.path.original === 'if') {
            if (element.params.length === 1) {
              var subexp = element.params[0];
              if (subexp.type === 'SubExpression' && subexp.path.original === options.helperName) {
                var feature = subexp.params[0].value;
                console.log(feature);
                console.log(options.features);
                console.log(options.features[feature]);
                if (options.features[feature]) {
                  return defeatureifyTemplate(element.program);
                } else {
                  return defeatureifyTemplate(element.inverse);
                }
              }
            }
          }
        }
        var children = element.body || element.children;
        if (children) {
          children.forEach(function(item, index) {
            var traverseResult = defeatureifyTemplate(item);
            if (traverseResult === null) {
              traverseResult = [];
            } else if (traverseResult.body) {
              traverseResult = traverseResult.body;
            } else {
              traverseResult = [traverseResult];
            }
            traverseResult.unshift(index, 1);
            Array.prototype.splice.apply(children, traverseResult);
          });
        }
        return element;
      }
    };
  };
};
