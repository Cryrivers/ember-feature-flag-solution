/* jshint node: true */
'use strict';
module.exports = function(options) {
  options = options || {};
  options.import = options.import || {};
  options.import.name = options.import.name || 'default';

  if (typeof options.import.module !== 'string') {
    throw new Error("options.import.module must be the name of a module, e.g. 'my-app/features'");
  }

  return function(babel) {
    return new babel.Transformer('babel-remove-imports', {
      ImportDeclaration: function(node) {
        if (node.source.value === options.import.module) {
          this.dangerouslyRemove();
        }
      }
    });
  };
};
