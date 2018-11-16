module.exports = function(...args) {
  if (!this.noParse) {
    throw new Error('missing OptionalParsePlugin');
  }
  this.cacheable();
  this.noParse();
  this._module.useSourceMap = true;
  this.callback(null, ...args);
};
