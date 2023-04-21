/* @flow */

import type { ParseResult } from '@hs/sporks';
import path from 'path';
import { getOptions } from 'loader-utils';

type WebpackModule = {
  meta: ParseResult & { sporksStacks?: Array<any> },
  dependencies: Array<{ request: string }>,
  context: string,
  request: string,
  resource: string,
  _source: any,
};

type Handler = (...args: Array<string>) => Promise<Array<WebpackModule>>;

type Handlers = { [directive: string]: Handler };

function parseResourcePath(resource) {
  const i = resource.indexOf('?');
  if (i < 0) {
    return resource;
  }
  return resource.substr(0, i);
}

function withResourceQuery(request: string, query: string) {
  const parts = request.split('!');
  const filepath = parts[parts.length - 1];
  if (filepath.indexOf('?') > -1) {
    return `${request}&${query}`;
  }
  return `${request}?${query}`;
}

module.exports = function(source: string, sourceMap: any) {
  if (this._module.meta.source == null || !this._module.meta.directives) {
    throw new Error('missing sporks/preloader');
  }
  const Sources = this.webpackVersionPlugin.webpackSources;

  const callback = this.async();
  this.cacheable();

  // FIXME document this option
  const options = getOptions(this) || {};
  const resolveOptions = options.resolve || {};
  const { types = {}, replaceExtensions = {} } = resolveOptions;

  const rootModule: WebpackModule = this._module;

  const extname = path.extname(this.resourcePath);
  const type = types[extname] || extname;

  const matchTypes = [type, ...(replaceExtensions[type] || [])];

  const matchRe = new RegExp(
    `(${matchTypes.join('|').replace(/\./g, '\\.')})$`
  );

  const processModule = async (
    mod: WebpackModule
  ): Promise<Array<WebpackModule>> => {
    if (mod.meta.source == null || !mod.meta.directives) {
      // something must have gone wrong in pitch
      throw new Error('missing sporks/preloader');
    }
    const { directives }: ParseResult = mod.meta;

    let fromModule = mod;
    if (fromModule != rootModule) {
      fromModule = Object.create(rootModule);
      Object.assign(fromModule, {
        context: mod.context,
        request: mod.request,
      });
    }

    const enhancedLoadModule = (request: string): Promise<WebpackModule> => {
      const sporksInternalRequest = withResourceQuery(
        request,
        'sporks-internal'
      );
      return this.enhancedLoadModule(sporksInternalRequest, fromModule);
    };

    const enhancedLoadContext = async (
      request: string,
      recursive: boolean,
      pattern?: string
    ): Promise<Array<WebpackModule>> => {
      const patternRe = pattern ? new RegExp(pattern) : matchRe;
      const contextModule: WebpackModule = await this.enhancedLoadContext(
        request,
        recursive,
        patternRe,
        fromModule
      );

      // FIXME for resons I don't uderstand, "context-module-factory" "alternatives" seem to produce duplicate results here
      const depPaths = Array.from(
        new Set(
          contextModule.dependencies.map(({ request }) =>
            path.join(contextModule.context, request)
          )
        )
      );

      return Promise.all(
        depPaths
          // exclude the root module
          // TODO why exclude the this.resourcePath and not mod.resourcePath?
          .filter(depPath => depPath != this.resourcePath)
          .map(depPath => enhancedLoadModule(depPath))
      );
    };

    const parts = await Promise.all(
      directives.map(({ directive, args }) => {
        const handlers: Handlers = {
          require: p => {
            const extname = path.extname(p);
            if (extname === '') {
              p += type;
            } else if (extname !== type) {
              const pType = types[extname];
              if (!pType) {
                // an extension we don't know about (possibly like file.min)
                p += type;
              } else if (pType === type) {
                p = p.slice(0, -extname.length) + type;
              } else {
                throw new Error(`${extname} can't be required from a ${type}`);
              }
            }
            return Promise.all([enhancedLoadModule(p)]);
          },

          require_env: (...args) => {
            if (args.length > 0) {
              throw new Error(
                'The require_env directive should take no parameters'
              );
            }
            const { name, ext } = path.parse(parseResourcePath(mod.resource));
            if (ext !== '.js') {
              throw new Error('require_env is only allowed in .js files');
            }
            const env = options.sporksEnv || 'development';
            return handlers.require(`./${name}.${env}.js`);
          },

          require_tree: (path, pattern) => {
            return enhancedLoadContext(path, true, pattern);
          },

          require_directory: (path, pattern) => {
            return enhancedLoadContext(path, false, pattern);
          },

          require_lang: p => {
            if (p.indexOf('*') === -1) {
              throw new Error(
                `Cannot use require_lang without including the language wildcard ('*')`
              );
            }
            const currentLang = path.basename(
              parseResourcePath(mod.resource),
              '.lyaml'
            );
            return handlers.require(p.replace('*', currentLang));
          },
        };

        const fn = handlers[directive];
        if (!fn) {
          this.emitWarning(`Invalid directive ${directive}`);
          return [];
        } else {
          return fn(...args);
        }
      })
    );

    return [].concat(...parts);
  };

  async function processModulesRecursive(
    mod: WebpackModule,
    stack = new Set()
  ): Promise<Array<WebpackModule>> {
    if (stack.has(mod.resource)) {
      throw new Error(
        `circular requires:\n * ${Array.from([...stack, mod.resource]).join(
          '\n * '
        )}`
      );
    }
    if (!mod.meta) {
      // $FlowFixMe I don't think mod.meta can be missing: processModule would fail on missing directives
      mod.meta = {};
    }
    if (!mod.meta.sporksStacks) {
      mod.meta.sporksStacks = [];
    }
    mod.meta.sporksStacks.push([...stack].reverse());

    stack.add(mod.resource);

    let modules;
    try {
      modules = await processModule(mod);
    } catch (e) {
      if (e._processModulesRecursive) {
        throw e;
      }
      const err: any = new Error(
        `${e.message}\nWhile requiring ${mod.resource} in\n * ${Array.from(
          stack
        ).join('\n * ')}`
      );
      err.hideStack = true;
      err._processModulesRecursive = stack;
      throw err;
    }

    const includedModules = await Promise.all(
      modules.map(m => processModulesRecursive(m, new Set(stack)))
    );

    return [].concat(...includedModules, [mod]);
  }

  processModulesRecursive(rootModule)
    .then(modules => {
      // dedupe modules
      const uniqueModules = new Set(modules);

      const parts = [].concat(
        ...Array.from(uniqueModules, m => {
          let modSource;
          if (m === rootModule) {
            if (sourceMap) {
              modSource = new Sources.SourceMapSource(
                source,
                this.resourcePath,
                sourceMap
              );
            } else {
              modSource = new Sources.OriginalSource(source, this.resourcePath);
            }
          } else {
            modSource = m._source;
          }

          return [modSource, '\n\n'];
        })
      );

      const result = new Sources.ConcatSource(...parts).sourceAndMap();
      return result;
    })
    .then(
      result => callback(null, result.source, result.map),
      err => callback(err)
    )
    .catch(err =>
      setImmediate(() => {
        throw err;
      })
    );
};
