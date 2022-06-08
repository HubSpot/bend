import ContextDependency from 'webpack/lib/dependencies/ContextDependency';

function create(request, recursive, regExp, mode) {
  if (!(this.prototype !== ContextDependency.prototype)) {
    throw new Error('Cannot call `create` on non-ContextDependency');
  }
  return new this({ request, recursive, regExp, mode });
}

module.exports = { create };
