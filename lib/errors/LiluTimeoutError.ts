export class LiluTimeoutError extends Error {
  public name: string;
  public code: number;

  constructor(message: string, code?: number) {
    super(message);

    this.name = 'LiluTimeoutError';
    this.code = code || -1;
  }

  toString(): string {
    return `${this.name}(${this.code}, ${this.message})`;
  }

  toJSON(): object {
    return Object.assign({}, this, {
      message: this.message,
      code: this.code
    });
  }

  inspect(): object {
    return Object.assign(new Error(this.message), this);
  }
}
