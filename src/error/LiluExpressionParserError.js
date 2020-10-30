class LiluExpressionParserError extends Error {
  constructor(message, expressionText, code) {
    super(message);

    this.expressionText = expressionText || null;
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
Object.defineProperty(LiluExpressionParserError.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function() {
    return Object.assign({}, this, {
      message: this.message,
      expressionText: this.expressionText,
      code: this.code
    });
  }
});

Object.defineProperty(LiluExpressionParserError.prototype, 'name', {
  value: 'LiluExpressionParserError'
});

export default LiluExpressionParserError;
