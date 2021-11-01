export declare class LiluTimeoutError extends Error {
    name: string;
    code: number;
    constructor(message: string, code?: number);
    toString(): string;
    toJSON(): object;
    inspect(): object;
}
