import { EvalContext } from './expression';
import { OperatorMap } from './operators';
import { Permission, PermissionJSON, PermissionCheckResult, PermissionOptions } from './permission';
import { TraceBase } from './trace';
export interface LiluOperators {
    [key: string]: (left: any, b: any) => boolean;
}
export interface LiluEnviroment {
    [key: string]: any;
}
export interface LiluOptions {
    strict: boolean;
    timeout: number | false;
    operators: OperatorMap | Array<string>;
    enviroment: LiluEnviroment;
    permissions: Array<Partial<PermissionOptions>>;
}
export interface GrantedOptions {
    enviroment: LiluEnviroment;
    timeout: number | false;
    context: EvalContext;
}
export interface GrantedResultError {
    errCode: number;
    errMsg: string;
}
export interface GrantedTrace {
    toString: () => string;
    toJSON: () => Array<TracePermission>;
}
export interface GrantedResult {
    passed: boolean;
    timeout: boolean;
    errors: Array<GrantedResultError>;
    nErrors: number;
    permission: PermissionJSON | null;
    mismatched: Array<PermissionJSON>;
    ms: number;
    trace: GrantedTrace;
    __t: object;
}
export interface GrantedManyResult {
    actions: {
        allow: Array<string>;
        disallow: Array<string>;
    };
    permissions: {
        matched: Array<PermissionJSON>;
        mismatched: Array<PermissionJSON>;
    };
    passed: boolean;
    timeout: boolean;
    errors: Array<GrantedResultError>;
    nErrors: number;
    ms: number;
    trace: GrantedTrace;
    __t: object;
}
export interface CheckPermissionResult extends PermissionCheckResult {
    timeout: boolean;
}
export declare type GrantedCallback = (err: Error | null, passed: GrantedResult) => void;
export declare type GrantedManyCallback = (err: Error | null, passed: GrantedManyResult) => void;
export interface TracePermission extends TraceBase {
    type: 'permission';
    item: PermissionJSON;
    result: PermissionCheckResult;
}
export declare class Lilu {
    protected _strict: boolean;
    protected _timeout: number | false;
    protected _enviroment: LiluEnviroment;
    protected _operators: LiluOperators;
    protected _permissionsByActionMap: Map<string, Array<Permission>>;
    protected _permissions: Array<Permission>;
    constructor(options?: Partial<LiluOptions>);
    get permissions(): Array<Permission>;
    findActions(value: string | RegExp): Array<string>;
    granted(actionName: string, optionsOrContextOrCallback?: EvalContext | Partial<GrantedOptions> | GrantedCallback, cb?: GrantedCallback): Promise<GrantedResult>;
    grantedMany(actions: Array<string> | string | RegExp, optionsOrContextOrCallback?: EvalContext | Partial<GrantedOptions> | GrantedManyCallback, cb?: GrantedManyCallback): Promise<GrantedManyResult>;
    grantedAny(actions: Array<string> | string | RegExp, optionsOrContextOrCallback?: EvalContext | Partial<GrantedOptions> | GrantedCallback, cb?: GrantedCallback): Promise<GrantedResult>;
    protected _granted(actionName: string, options: GrantedOptions): Promise<GrantedResult>;
    protected _grantedMany(actions: Array<string>, options: GrantedOptions): Promise<GrantedManyResult>;
    protected _grantedAny(actions: Array<string>, options: GrantedOptions): Promise<GrantedResult>;
    _checkPermission(permission: Permission, options: GrantedOptions): Promise<CheckPermissionResult>;
}
