function isWebpack4(compilation) {
  return !!compilation.compiler.resolverFactory;
}

function addModuleDependencies(
  compilation,
  module,
  deps,
  bail,
  cacheGroup,
  recursive,
  callback
) {
  compilation.addModuleDependencies(
    module,
    isWebpack4(compilation)
      ? deps.map(dep => ({
          factory: compilation.dependencyFactories.get(dep.constructor),
          dependencies: [dep],
        }))
      : [deps],
    bail,
    cacheGroup,
    recursive,
    callback
  );
}

module.exports = { addModuleDependencies };
