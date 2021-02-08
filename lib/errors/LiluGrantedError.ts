import { TracePermission } from '../lilu';

export class LiluGrantedError extends Error {
  public name: string;
  public code: number;
  public trace: Array<TracePermission>;
  public execStack: string;
  public originErr: Error | null;

  constructor(
    code: number,
    message: string,
    trace?: Array<TracePermission>,
    execStack?: string,
    originErr?: Error,
  ) {
    super(message);

    this.name = 'LiluGrantedError';
    this.code = code || -1;
    this.trace = trace || [];
    this.execStack = execStack || '';
    this.originErr = originErr || null;
  }

  get critical() {
    return this.code === -1;
  }

  toString(): string {
    const title = `${this.name}(code = ${this.code}, "${this.message}")`;

    const originErr = this.originErr && this.originErr.stack
      ? '  - Origin Error: ' + this.originErr.stack.replace(/\n/g, '\n    ')
      : '';

    const execStack = this.execStack
      ? '  - Exec Stack: ' + this.execStack.replace(/\n/g, '\n    ')
      : '';

    return [title, originErr, execStack]
      .filter(v => v && v.length)
      .join('\n');
  }

  toJSON(): object {
    return Object.assign({}, this, {
      message: this.message,
      code: this.code,
      critical: this.critical,
      originErr: this.originErr ? Object.assign({}, this.originErr) : null,
      trace: this.trace,
      execStack: this.execStack,
    });
  }

  inspect(): object {
    return Object.assign(new Error(this.message), this);
  }
}
