import { EvalContext, EvalResult, Expression, ExpressionJSON } from './expression';
import { OperatorMap } from './operators';
import { TraceBase } from './trace';
export declare type RuleOperation = 'OR' | 'AND';
export interface RuleOptions {
    title: string;
    operation: RuleOperation;
    conditions: Array<string>;
    operators: OperatorMap;
    strict: boolean;
}
export interface RuleMatchResult {
    trace: Array<TraceCondition>;
    error: boolean;
    result?: boolean;
    errCode?: number;
    errMsg?: string;
    ms: number;
    __t: object;
}
export interface RuleJSON {
    name: string;
    title: string;
    conditions: string[];
    operation: string;
}
export interface TraceCondition extends TraceBase {
    type: 'condition';
    item: ExpressionJSON;
    result: EvalResult;
}
export declare class Rule {
    protected _title: string;
    protected _operation: RuleOperation;
    protected _conditions: Array<Expression>;
    protected _conditionVariables: Array<string>;
    constructor(options: Partial<RuleOptions>);
    get name(): string;
    get title(): string;
    get conditionVariables(): Array<string>;
    get conditions(): Array<Expression>;
    get operation(): string;
    match(context: EvalContext): RuleMatchResult;
    toString(): string;
    toJSON(): RuleJSON;
    inspect(): object;
}
