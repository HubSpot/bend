/* @flow */

export default class WebpackDevServerPlugin {
  setupMiddlewares: (middlewares: any[], devServer: any, compiler: any) => any[];

  apply(compiler: any) {
    if (!compiler.options.devServer) {
      throw new Error(
        'To use webpack-dev-server plugins, you must include a `devServer` option in your webpack config'
      );
    }

    const originalSetupMiddlewares = compiler.options.devServer.setupMiddlewares;

    compiler.options.devServer.setupMiddlewares = (middlewares, devServer) => {
      // Call original setupMiddlewares if it existed
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Call the plugin's setupMiddlewares method
      return this.setupMiddlewares(middlewares, devServer, compiler);
    };
  }
}
