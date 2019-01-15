import ContextDependency from 'webpack/lib/dependencies/ContextDependency';

function isWebpack4(compilation) {
  return !!compilation.compiler.resolverFactory;
}

function create(compilation, request, recursive, regExp, mode) {
  if (!(this.prototype !== ContextDependency.prototype)) {
    throw new Error('Cannot call `create` on non-ContextDependency');
  }
  if (isWebpack4(compilation)) {
    return new this({ request, recursive, regExp, mode });
  } else {
    return new this(request, recursive, regExp);
  }
}

module.exports = { create };
