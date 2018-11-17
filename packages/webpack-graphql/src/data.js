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
function unwrapError({ name, message, details, stack, module }) {
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

    assets(compilation) {
      return Object.keys(compilation.assets).map(name => ({
        name,
        source: compilation.assets[name],
      }));
    },

    asset(compilation, { name }) {
      return { name, source: compilation.assets[name] };
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
  },
};

export function buildContext(compiler) {
  const compilerReady = new CompilerStatePlugin();

  compiler.apply(compilerReady);

  const context = { compilerReady, compiler };

  compiler.plugin('compilation', compilation => {
    if (compilation.generation) {
      compilation.generation++;
    } else {
      compilation.generation = 1;
    }
  });

  compiler.plugin('watch-run', (watch, callback) => {
    context.watch = watch;
    callback();
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
