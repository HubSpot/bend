export function buildInfo(mod) {
  // in webpack 3, buildInfo like `fileDependencies` was set directly on the module.
  // in webpack 4, it is set on the `buildInfo` object
  return mod.buildInfo ? mod.buildInfo : mod;
}
