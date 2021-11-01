import { TracePermission } from '../lilu';
export declare class LiluGrantedError extends Error {
    name: string;
    code: number;
    trace: Array<TracePermission>;
    execStack: string;
    originErr: Error | null;
    constructor(code: number, message: string, trace?: Array<TracePermission>, execStack?: string, originErr?: Error);
    get critical(): boolean;
    toString(): string;
    toJSON(): object;
    inspect(): object;
    static from(err: LiluGrantedError | any, extendTrace?: Array<TracePermission>, extendExecStack?: string): LiluGrantedError;
}
