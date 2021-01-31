import { TracePermission } from '../lilu';

export class LiluGrantedError extends Error {
  public name: string;
  public code: number;
  public trace: Array<TracePermission>;
  public execStack: string;
  public originErr: Error | null;

  constructor(
    message: string,
    code?: number,
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
    return `${this.name}(${this.code}, ${this.message})\n${
      this.originErr ? `- Origin Error: ${this.originErr.stack}\n` : ''
    }- Exec Stack:\n${this.execStack || '_empty_'}`;
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
