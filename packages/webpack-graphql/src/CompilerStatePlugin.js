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

    compiler.plugin('compilation', compilation => {
      this.compilation = compilation;
    });

    compiler.plugin('done', () => {
      this.valid = true;
      process.nextTick(() => {
        if (this.valid) {
          this._resolve(this.compilation);
        }
      });
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

  onValid(listener) {
    if (this.valid) {
      listener(this.compilation);
    } else {
      this.promise.then(listener);
    }
  }

  then(...args) {
    return this.promise.then(...args);
  }
}
