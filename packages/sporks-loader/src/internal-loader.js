module.exports = function(...args) {
  this.cacheable();
  this._module.useSourceMap = true;
  this.callback(null, ...args);
};
