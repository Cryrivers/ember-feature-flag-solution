/* jshint node: true */
'use strict';
var BabelFeatureFlag = require('./babel-defeatureify');
function defeatureifyTemplate(element) {
  if (element.type === 'BlockStatement') {
    if (element.path.original === 'if') {
      if (element.params.length === 1) {
        var subexp = element.params[0];
        if (subexp.type === 'SubExpression' && subexp.path.original === 'feature-flag') {
          var feature = subexp.params[0].value;
          console.log(feature);
        }
      }
    }
  }
  if (element.children) {
    element.children.forEach(defeatureifyTemplate);
  }
}
module.exports = {
  name: 'ember-feature-flag-solution',
  included: function () {
    this.app.babel = {
      plugins: [
        BabelFeatureFlag({
          import: {
            module: 'ember-feature-flag-solution/helpers/feature-flag',
            name: 'featureFlag'
          },
          features: this.featureFlags()
        })
      ]
    };
    this.app.registry.add('htmlbars-ast-plugin', {
      name: 'feature-flag-template-defeatureify',
      plugin: function () {
        return {
          transform: function (node) {
            node.body.forEach(defeatureifyTemplate);
            return node;
          }
        };
      }
    });
  },
  featureFlags: function () {
    return this.app.featureFlags || {};
  },
  isDevelopingAddon: function () {
    return true;
  }
};
