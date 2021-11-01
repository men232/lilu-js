import { Rule, RuleJSON, RuleMatchResult, RuleOptions } from './rule';
import { EvalContext } from './expression';
import { TraceBase } from './trace';
import { OperatorMap } from './operators';
export interface PermissionAttributes {
    [key: string]: any;
}
export interface PermissionOptions {
    strict: boolean;
    operators: OperatorMap;
    title: string;
    actions: Array<string>;
    attributes: PermissionAttributes;
    rules: Array<Partial<RuleOptions>>;
}
export interface PermissionJSON {
    name: string;
    attributes: PermissionAttributes;
    rules: Array<RuleJSON>;
    title: string;
    actions: Array<string>;
}
export interface TraceRule extends TraceBase {
    type: 'rule';
    item: RuleJSON;
    result: RuleMatchResult;
}
export interface PermissionCheckResult {
    trace: Array<TraceRule>;
    error: boolean;
    result?: boolean;
    errCode?: number;
    errMsg?: string;
    ms: number;
    __t: object;
}
export declare class Permission {
    protected _title: string;
    protected _strict: boolean;
    protected _actions: Array<string>;
    protected _attributes: PermissionAttributes;
    protected _rules: Array<Rule>;
    protected _ruleVariables: Array<string>;
    constructor(options: Partial<PermissionOptions>);
    get name(): string;
    get title(): string;
    get actions(): Array<string>;
    get ruleVariables(): Array<string>;
    get attributes(): PermissionAttributes;
    check(context: EvalContext): PermissionCheckResult;
    toString(): string;
    toJSON(): PermissionJSON;
    inspect(): object;
}
