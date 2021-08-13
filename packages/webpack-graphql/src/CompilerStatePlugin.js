export default class CompilerStatePlugin {
  constructor() {
    this.resetPromise();
  }

  resetPromise() {
    this.promise = new Promise(resolve => {
      this._resolve = resolve;
    });
  }

  apply(compiler) {
    this.valid = false;

    compiler.hooks.done.tap('CompilerStatePlugin', ({ compilation }) => {
      this.valid = true;
      this._resolve(compilation);
    });

    [compiler.hooks.invalid, compiler.hooks.watchRun, compiler.hooks.run].forEach(hook => hook.tap('CompilerStatePlugin', () => {
      this.valid = false;
      this.resetPromise();
    }));
  }

  then(...args) {
    return this.promise.then(...args);
  }
}
