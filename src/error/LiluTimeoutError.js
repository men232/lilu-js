class LiluTimeoutError extends Error {
  constructor(message, code) {
    super(message);

    this.code = code || -1;
  }

  /**
   * Console.log helper
   */
  toString() {
    return `${this.name}: ${this.message}`;
  }

  /*!
   * inspect helper
   */
  inspect() {
    return Object.assign(new Error(this.message), this);
  }
}

/*!
 * Helper for JSON.stringify
 */
Object.defineProperty(LiluTimeoutError.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function() {
    return Object.assign({}, this, {
      message: this.message,
      code: this.code
    });
  }
});

Object.defineProperty(LiluTimeoutError.prototype, 'name', {
  value: 'LiluTimeoutError'
});

export default LiluTimeoutError;
