/* @flow */

export default class WebpackDevServerPlugin {
  before: (app: any, server: any) => void;

  apply(compiler: any) {
    if (!compiler.options.devServer) {
      throw new Error(
        'To use webpack-dev-server plugins, you must include a `devServer` option in your webpack config'
      );
    }

    const originalBefore = compiler.options.devServer.before;

    compiler.options.devServer.before = (app, server) => {
      if (originalBefore) {
        originalBefore(app, server);
      }

      this.before(app, server);
    };
  }
}
