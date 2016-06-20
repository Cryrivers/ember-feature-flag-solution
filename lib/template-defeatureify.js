/*jshint node:true*/
/* global module */
'use strict';

function MetaClass(options) {

  function TransformPrecompileFeatureFlag() {
    this.options = options || {};
    this.options.helperName = options.helperName || 'feature-flag';
    this.options.features = options.features || {};
    this.syntax = null;
  }

  TransformPrecompileFeatureFlag.prototype.transform = function(ast) {
    var context = this;
    var walker = new this.syntax.Walker();

    walker.visit(ast, function(node) {
      if (context.validate(node)) {
        context.processNode(node);
      }
    });

    return ast;
  };

  TransformPrecompileFeatureFlag.prototype.validate = function(node) {
    if (node && node.type) {
      return ['BlockStatement'].indexOf(node.type) > -1;
      //return ['BlockStatement', 'MustacheStatement', 'ElementNode'].indexOf(node.type) > -1;
    } else {
      return false;
    }
  };

  TransformPrecompileFeatureFlag.prototype.processNode = function(node) {
    this.processNodeParams(node);
  };

  /**
   * {{#if (feature-flag 'ember-dummy-feature')}} {{/if}}
   * @param  {AST.Node} node
   */
  TransformPrecompileFeatureFlag.prototype.processNodeParams = function(node) {
    if (
      node &&
      node.type === 'BlockStatement' &&
      (node.path && node.path.original === 'if' || node.path.original === 'unless') &&
      node.params.length === 1 &&
      node.params[0].type === 'SubExpression' &&
      node.params[0].path.original === this.options.helperName
    ) {
      var inverse = (node.path.original === 'unless');
      this.defeatureifyNode(node, inverse);
    } else {
      if (node.params) {
        for (var i = 0; i < node.params.length; i++) {
          this.processNode(node.params[i]);
        }
      }
    }
  };

  /**
   * {{x-component prop=(feature-flag 'ember-dummy-feature')}}
   * Do Not Implement for Now
   * @param {AST.Node} node
   */
  TransformPrecompileFeatureFlag.prototype.processNodeHash = function(node) {

  };

  /**
   * <button type="submit" disabled={{feature-flag 'ember-dummy-feature'}}>Submit</button> (node.attributes)
   * <div class="form-group {{if (feature-flag 'ember-dummy-feature') 'isValid' 'has-error'}}">
   * @param {AST.Node} node
   */
  TransformPrecompileFeatureFlag.prototype.processNodeAttributes = function(node) {

  };

  TransformPrecompileFeatureFlag.prototype.defeatureifyNode = function(node, inverse) {
    console.log(require('util').inspect(node, false, null));
  };

  return TransformPrecompileFeatureFlag;
}

module.exports = MetaClass;
