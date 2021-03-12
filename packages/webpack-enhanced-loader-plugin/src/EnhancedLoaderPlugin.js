import LoaderDependency from 'webpack/lib/dependencies/LoaderDependency';
import ContextDependency from 'webpack/lib/dependencies/ContextDependency';

import { addModuleDependencies } from './webpack-compat/compilation';
import { create } from './webpack-compat/context-dependency';
import { buildInfo } from './webpack-compat/normal-module';

class EnhancedLoaderContextDependency extends ContextDependency {}
EnhancedLoaderContextDependency.prototype.type = 'enhanced-loader-context';
EnhancedLoaderContextDependency.create = create;

/**
 * Like the webpack LoaderPlugin, with promises and context support.
 */
module.exports = class EnhancedLoaderPlugin {
  apply(compiler) {
    compiler.plugin(
      'compilation',
      (compilation, { normalModuleFactory, contextModuleFactory }) => {
        compilation.dependencyFactories.set(
          LoaderDependency,
          normalModuleFactory
        );
        compilation.dependencyFactories.set(
          EnhancedLoaderContextDependency,
          contextModuleFactory
        );

        compilation.plugin(
          'normal-module-loader',
          (loaderContext, loaderModule) => {
            loaderContext.enhancedLoadModule = function(
              request,
              module = loaderModule
            ) {
              const dep = new LoaderDependency(request);
              dep.loc = request;
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
              dep.loc = request;
              return doLoad(this, dep, module);
            };

            function doLoad(loaderContext, dep, module) {
              return new Promise((resolve, reject) => {
                compilation.semaphore.release();
                addModuleDependencies(
                  compilation,
                  module,
                  [dep],
                  true,
                  'blm',
                  false,
                  err => {
                    compilation.semaphore.acquire(() => {
                      if (err) {
                        return reject(err);
                      }

                      if (!dep.module) {
                        return reject(new Error('Cannot load the module'));
                      }
                      if (dep.module.building) {
                        dep.module.building.push(next);
                      } else next();

                      function next(err) {
                        if (err) return reject(err);

                        if (dep.module.error) return reject(dep.module.error);

                        const moduleBuildInfo = buildInfo(dep.module);

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
                        return resolve(dep.module);
                      }
                    });
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
