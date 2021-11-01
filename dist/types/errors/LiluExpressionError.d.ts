export declare class LiluExpressionError extends Error {
    name: string;
    expressionText: string | null;
    code: number;
    constructor(message: string, expressionText?: string, code?: number);
    toString(): string;
    toJSON(): object;
}
