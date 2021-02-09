export class LiluExpressionError extends Error {
  name: string;
  expressionText: string | null;
  code: number;

  constructor(message: string, expressionText?: string, code?: number) {
    super(message);

    this.name = 'LiluExpressionError';
    this.expressionText = expressionText || null;
    this.code = code || -1;
  }

  toString(): string {
    return `${this.name}(${this.code}, "${this.expressionText}", ${this.message})`;
  }

  toJSON(): object {
    return Object.assign({}, this, {
      message: this.message,
      expressionText: this.expressionText,
      code: this.code
    });
  }
}
