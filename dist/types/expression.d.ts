import * as ESTree from 'estree';
import { OperatorMap } from './operators';
export interface ExpressionOptions {
    strict: boolean;
    operators: OperatorMap;
}
export interface EvalContext {
    [key: string]: any;
}
export interface EvalStack {
    leftValue: {
        raw: null | string;
        ensured: any;
        type: string;
    };
    rightValue: {
        raw: null | string;
        ensured: any;
        type: string;
    };
    operator: null | string;
}
export interface EvalResult {
    error: boolean;
    stack: EvalStack;
    result?: boolean;
    errCode?: number;
    errMsg?: string;
}
export interface ParsedBase {
    type: string;
    raw: string;
    value: any;
}
export interface ParsedVariable extends ParsedBase {
    type: 'variable';
    value: string;
}
export interface ParsedExpression extends ParsedBase {
    type: 'expression';
    value: ESTree.Expression;
}
export interface ParsedOperator extends ParsedBase {
    type: 'operator';
    value: string;
}
export interface ParsedLiteral extends ParsedBase {
    type: LiteralType;
    value: LiteralValue;
}
export interface ParsedUnknown extends ParsedBase {
    type: 'unknown';
    value: any;
}
export interface ExpressionJSON {
    str: string;
    variables: Array<string>;
    operators: string[];
    isValid: boolean;
    name: string;
}
export declare type LiteralType = 'string' | 'object' | 'number' | 'boolean' | 'array' | 'null';
export declare type LiteralValue = string | object | Array<any> | number | boolean | null;
export declare type ParsedItem = ParsedVariable | ParsedExpression | ParsedOperator | ParsedLiteral | ParsedUnknown;
export declare const EXPRESSION_LITERAL_TYPES: string[];
export declare class Expression {
    protected _raw: string;
    protected _parsed: Array<ParsedItem>;
    protected _variables: Array<string>;
    protected _operators: OperatorMap;
    constructor(str: string, options?: Partial<ExpressionOptions>);
    get name(): string;
    get raw(): string;
    get variables(): Array<string>;
    get isValid(): boolean;
    toString(): string;
    toJSON(): ExpressionJSON;
    eval(context?: EvalContext): EvalResult;
    inspect(): object;
    protected _validateAndThrow(): boolean;
    protected _parse(): void;
    protected _extractEsprimaVariables(expression: ESTree.Expression): Array<string>;
    protected _parseExpression(str: string): ParsedItem;
    protected _castType(value: any): LiteralType | null;
    protected _ensureValue(item: ParsedItem, context?: EvalContext): any;
}
