import fs from 'fs';
import path from 'path';

import crypto from 'crypto';
import { makeExecutableSchema } from 'graphql-tools';

import CompilerStatePlugin from './CompilerStatePlugin';

function moduleIdentifierHash(mod) {
  if (!mod.meta) {
    mod.meta = {};
  }
  if (!mod.meta.identifierHash) {
    mod.meta.identifierHash = crypto
      .createHash('md5')
      .update(mod.identifier())
      .digest('hex');
  }
  return mod.meta.identifierHash;
}

function getModule(compilation, identifierHash) {
  if (!compilation.modulesByIdentifierHash) {
    compilation.modulesByIdentifierHash = new Map(
      compilation.modules.map(mod => [moduleIdentifierHash(mod), mod])
    );
  }

  return compilation.modulesByIdentifierHash.get(identifierHash);
}

// returning an error directly is treated as an error
// https://github.com/graphql/graphql-js/issues/591
function unwrapError(e) {
  // Webpack allows us to register either error objects or strings as errors.
  if (typeof e === 'string') {
    return {
      message: e,
    };
  }
  const { name, message, details, stack, module } = e;
  return { name, message, details, stack, module };
}

// we only need resolvers for things that need to be serialized differently,
// or for methods that take arguments
const coreResolvers = {
  Stats: {
    json({ json }) {
      return json;
    },

    string({ stats, json }, { useColors }) {
      return stats.constructor.jsonToString(json, useColors);
    },
  },

  Compilation: {
    stats(compilation, { preset }) {
      const stats = compilation.getStats();
      return { stats, json: stats.toJson(preset) };
    },

    assets(compilation, _, context) {
      const assets = context.assetsByCompilation.get(compilation);
      return Object.keys(compilation.assets).map(name => ({
        name,
        source: assets[name],
      }));
    },

    asset(compilation, { name }, context) {
      const assets = context.assetsByCompilation.get(compilation);
      return { name, source: assets[name] };
    },

    module(compilation, { identifier, identifierHash }) {
      if (identifierHash) {
        return getModule(compilation, identifierHash);
      }
      return compilation._modules[identifier];
    },

    entrypoints(compilation) {
      return Object.keys(compilation.entrypoints).map(
        name => compilation.entrypoints[name]
      );
    },

    errorCount(compilation) {
      return compilation.errors.length;
    },

    errors(compilation) {
      return compilation.errors.map(unwrapError);
    },

    warningCount(compilation) {
      return compilation.warnings.length;
    },

    warnings(compilation) {
      return compilation.warnings.map(unwrapError);
    },
  },

  Module: {
    identifierHash(module) {
      return moduleIdentifierHash(module);
    },

    buildTimestamp(module) {
      return +module.buildTimestamp;
    },

    source(module) {
      return module._source;
    },

    issuerStack(module) {
      let current = module;
      const result = [];
      while (current.issuer) {
        current = current.issuer;
        result.push(current);
      }
      return result;
    },

    errorCount(module) {
      return module.errors.length;
    },

    errors(module) {
      return module.errors.map(unwrapError);
    },

    warningCount(module) {
      return module.warnings.length;
    },

    warnings(module) {
      return module.warnings.map(unwrapError);
    },

    chunks(module) {
      return module.getChunks();
    },

    reasons(module, _, context) {
      return context.compilerReady.then(compilation => {
        return Array.from(compilation.moduleGraph.getIncomingConnections(module))
      });
    }
  },

  Chunk: {
    modules(chunk) {
      return chunk.getModules();
    },
  },

  Raw: {
    __serialize(v) {
      return v;
    },
  },

  Query: {
    compiler(root, _, context) {
      const { compilerReady } = context;
      return {
        valid: compilerReady.valid,
        compilation: compilerReady,
      };
    },
  },

  Dependency: {
    loc(dep) {
      // there are some weird locations, like strings
      return dep.loc && dep.loc.start ? dep.loc : null;
    },

    module(dep, _, context) {
      return context.compilerReady.then(compilation => {
        return compilation.moduleGraph.getModule(dep)
      });
    }
  },

  Source: {
    source(s) {
      const value = s.source();
      return Buffer.isBuffer(value) ? null : value;
    },
  },
};

export function buildContext(compiler) {
  const compilerReady = new CompilerStatePlugin();
  // FIXME: This is a hack to get actual assets before they are replaced with SizeOnlySource instances
  const assetsByCompilation = new WeakMap();

  compilerReady.apply(compiler);

  const context = { compilerReady, compiler, assetsByCompilation };

  compiler.hooks.compilation.tap('webpack-graphql', compilation => {
    context.compilation = compilation;
    if (compilation.generation) {
      compilation.generation++;
    } else {
      compilation.generation = 1;
    }
  });

  compiler.hooks.watchRun.tapAsync('webpack-graphql', (watch, callback) => {
    context.watch = watch;
    callback();
  });

  compiler.hooks.emit.tap('webpack-graphql', compilation => {
    assetsByCompilation.set(compilation, {
      ...compilation.assets
    });

  });

  return context;
}

export function makeSchema({ typeDefs, resolvers }) {
  const coreTypeDefs = fs.readFileSync(
    path.join(__dirname, 'schema.graphql'),
    'utf8'
  );

  return makeExecutableSchema({
    typeDefs: [coreTypeDefs, ...typeDefs],
    resolvers: [coreResolvers, ...resolvers],
  });
}
