const preloaderPath = require.resolve('./preloader');

module.exports = function(...args) {
  if (!this.noParse) {
    throw new Error('missing OptionalParsePlugin');
  }
  this.cacheable();
  this.noParse();
  this._module.useSourceMap = true;
  this.callback(null, ...args);
};

module.exports.pitch = function() {
  this.loaders.push({
    request: 'sporks/preloader',
    path: preloaderPath,
    query: '',
  });
};
