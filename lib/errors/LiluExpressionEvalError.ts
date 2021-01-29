class LiluExpressionEvalError extends Error {
  expressionText: string | null;
  context: object | null;
  code: number;

  constructor(message: string, expressionText?: string, context?: object, code?: number) {
    super(message);

    this.name = 'LiluExpressionEvalError';
    this.expressionText = expressionText || null;
    this.context = context || null;
    this.code = code || -1;
  }

  toString(): string {
    return `${this.name} (${this.expressionText}): ${this.message}`;
  }

  toJSON(): object {
    return Object.assign({}, this, {
      message: this.message,
      expressionText: this.expressionText,
      context: this.context,
      code: this.code
    });
  }
}
