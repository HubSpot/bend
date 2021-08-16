import LoaderDependency from 'webpack/lib/dependencies/LoaderDependency';
import ContextDependency from 'webpack/lib/dependencies/ContextDependency';

import { create } from './webpack-compat/context-dependency';
import { buildInfo } from './webpack-compat/normal-module';

class EnhancedLoaderContextDependency extends ContextDependency {
  get type() {
    return 'enhanced-loader-context';
  }
}
EnhancedLoaderContextDependency.create = create;

/**
 * Like the webpack LoaderPlugin, with promises and context support.
 */
module.exports = class EnhancedLoaderPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap(
      'EnhancedLoaderPlugin',
      (compilation, { normalModuleFactory, contextModuleFactory }) => {
        compilation.dependencyFactories.set(
          LoaderDependency,
          normalModuleFactory
        );
        compilation.dependencyFactories.set(
          EnhancedLoaderContextDependency,
          contextModuleFactory
        );

        compilation.hooks.normalModuleLoader.tap(
          'EnhancedLoaderPlugin',
          (loaderContext, loaderModule) => {
            loaderContext.enhancedLoadModule = function(
              request,
              module = loaderModule
            ) {
              const dep = new LoaderDependency(request);
              // TODO HQD not sure what to set for `loc`
              // dep.loc = request;
              return doLoad(this, dep, module);
            };

            loaderContext.enhancedLoadContext = function(
              request,
              recursive,
              regExp,
              module = loaderModule
            ) {
              const dep = EnhancedLoaderContextDependency.create(
                request,
                recursive,
                regExp,
                'sync'
              );
              // TODO HQD not sure what to set for `loc`
              // dep.loc = request;
              return doLoad(this, dep, module);
            };

            function doLoad(loaderContext, dep, module) {
              return new Promise((resolve, reject) => {
                // TODO HQD from LoaderPlugin
               compilation.buildQueue.increaseParallelism();
                compilation.handleModuleCreation(
                  {
                    factory: compilation.dependencyFactories.get(dep.constructor),
                    dependencies: [dep],
                    originModule: module,
                    context: module.context,
                    recursive: false,
                  },
                  err => {
                  compilation.buildQueue.decreaseParallelism();
                    if (err) {
                        return reject(err);
                      }
                      const moduleGraph = compilation.moduleGraph;
                      const depModule = moduleGraph.getModule(dep);

                      if (!depModule) {
                        return reject(new Error('Cannot load the module'));
                      }
                      if (depModule.building) {
                        depModule.building.push(next);
                      } else next();

                      function next(err) {
                        if (err) return reject(err);

                        if (depModule.error) return reject(depModule.error);

                        const moduleBuildInfo = buildInfo(depModule);

                        if (moduleBuildInfo.fileDependencies) {
                          moduleBuildInfo.fileDependencies.forEach(dep => {
                            loaderContext.addDependency(dep);
                          });
                        }
                        if (moduleBuildInfo.contextDependencies) {
                          moduleBuildInfo.contextDependencies.forEach(dep => {
                            loaderContext.addContextDependency(dep);
                          });
                        }
                        return resolve(depModule);
                      }
                  }
                );
              });
            }
          }
        );
      }
    );
  }
};
