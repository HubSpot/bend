/* @flow */

export default class WebpackDevServerPlugin {
  setupMiddlewares?: (middlewares: any, devServer: any, compiler: any) => any;
  onListening?: (devServer: any, compiler: any) => void;

  apply(compiler: any) {
    if (!compiler.options.devServer) {
      throw new Error(
        'To use webpack-dev-server plugins, you must include a `devServer` option in your webpack config'
      );
    }

    if (this.setupMiddlewares) {
      const originalSetupMiddlewares = compiler.options.devServer.setupMiddlewares;
      
      compiler.options.devServer.setupMiddlewares = (middlewares, devServer) => {
        if (originalSetupMiddlewares) {
          middlewares = originalSetupMiddlewares(middlewares, devServer);
        }
        
        return this.setupMiddlewares(middlewares, devServer, compiler);
      };
    }

    if (this.onListening) {
      const originalOnListening = compiler.options.devServer.onListening;
      
      compiler.options.devServer.onListening = (devServer) => {
        if (originalOnListening) {
          originalOnListening(devServer);
        }

        this.onListening(devServer, compiler);
      };
    }
  }
}
