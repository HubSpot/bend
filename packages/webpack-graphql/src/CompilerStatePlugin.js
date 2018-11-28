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

    compiler.plugin('done', ({ compilation }) => {
      this.valid = true;
      this._resolve(compilation);
    });

    // on compiling
    const invalidPlugin = () => {
      this.valid = false;
      this.resetPromise();
    };

    function invalidAsyncPlugin(compiler, callback) {
      invalidPlugin();
      callback();
    }

    compiler.plugin('invalid', invalidPlugin);
    compiler.plugin('watch-run', invalidAsyncPlugin);
    compiler.plugin('run', invalidAsyncPlugin);
  }

  then(...args) {
    return this.promise.then(...args);
  }
}
