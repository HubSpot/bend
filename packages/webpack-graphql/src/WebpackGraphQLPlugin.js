import WebpackDevServerPlugin from '@hs/webpack-dev-server-plugin';

export default class WebpackGraphQLPlugin extends WebpackDevServerPlugin {
  constructor(opts) {
    super();
    this.opts = opts;
  }

  setupMiddlewares(middlewares, devServer, compiler) {
    const { path, context, typeDefs, resolvers } = this.opts;
    const { buildContext, makeSchema } = require('./data');
    const graphqlHTTP = require('express-graphql');
    const app = devServer.app;

    app.use(
      path,
      graphqlHTTP({
        schema: makeSchema({ typeDefs, resolvers }),
        context: { ...buildContext(compiler), ...context },
        graphiql: true,
      })
    );

    return middlewares;
  }
}
