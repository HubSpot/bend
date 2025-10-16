/* @flow */

export default class WebpackDevServerPlugin {
  before: (app: any, server: any, compiler: any) => void;

  apply(compiler: any) {
    if (!compiler.options.devServer) {
      throw new Error(
        'To use webpack-dev-server plugins, you must include a `devServer` option in your webpack config'
      );
    }

    const originalOnListening = compiler.options.devServer.onListening;

    compiler.options.devServer.onListening = (devServer) => {
      if (originalOnListening) {
        originalOnListening(devServer);
      }

      this.before(devServer.app, devServer, compiler);
    };
  }
}
