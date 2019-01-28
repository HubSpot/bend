import ContextDependency from 'webpack/lib/dependencies/ContextDependency';

function isWebpack4() {
  // this instance method exists in webpack 3 but not 4
  return ContextDependency.prototype.isEqualResource == null;
}

function create(request, recursive, regExp, mode) {
  if (!(this.prototype !== ContextDependency.prototype)) {
    throw new Error('Cannot call `create` on non-ContextDependency');
  }
  if (isWebpack4()) {
    return new this({ request, recursive, regExp, mode });
  } else {
    return new this(request, recursive, regExp);
  }
}

module.exports = { create };
