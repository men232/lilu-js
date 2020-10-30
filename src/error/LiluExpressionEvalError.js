class LiluExpressionEvalError extends Error {
  constructor(message, expressionText, context, code) {
    super(message);

    this.expressionText = expressionText || null;
    this.context = context || null;
    this.code = code || -1;
  }

  /**
   * Console.log helper
   */
  toString() {
    return `${this.name} (${this.expressionText}): ${this.message}`;
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
Object.defineProperty(LiluExpressionEvalError.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function() {
    return Object.assign({}, this, {
      message: this.message,
      expressionText: this.expressionText,
      context: this.context,
      code: this.code
    });
  }
});

Object.defineProperty(LiluExpressionEvalError.prototype, 'name', {
  value: 'LiluExpressionEvalError'
});

export default LiluExpressionEvalError;
