import { parse } from '@hs/sporks';

module.exports = function(content) {
  if (!this.enhancedLoadContext) {
    throw new Error('missing EnhancedLoaderPlugin');
  }
  this.cacheable();

  const { source, directives } = parse(content);

  this._module.meta = Object.assign({}, this._module.meta, {
    source,
    directives,
  });

  return source;
};
