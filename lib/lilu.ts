import debug from 'debug';
import globToRegExp from 'glob-to-regexp';

import * as obj from './utils/object';
import timer from './utils/timer';
import tbag from './utils/tbag';
import promiseOrCallback from './utils/promiseOrCallback';
import { EvalContext } from './expression';
import { DEFAULT_OPERATORS, OperatorMap } from './operators';
import {
  Permission,
  PermissionJSON,
  PermissionMatchResult,
  PermissionOptions,
} from './permission';
import { TraceBase } from './trace';
import promiseTimeout from './utils/promiseTimeout';
import { LiluGrantedError } from './errors/LiluGrantedError';

const d = debug('lilu:permission');

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

interface GrantedOptions {
  enviroment: LiluEnviroment;
  timeout: number | false;
  context: EvalContext;
}

interface GrantedResultError {
  errCode: number;
  errMsg: string;
}

interface GrantedTrace {
  toString: () => string;
  toJSON: () => Array<object>;
}

interface GrantedResult {
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

type GrantedCallback = (err: Error, passed: boolean) => void;

export interface TracePermission extends TraceBase {
  type: 'permission';
  item: PermissionJSON;
  result: PermissionMatchResult;
}

export class Lilu {
  protected _strict: boolean;

  protected _timeout: number | false;

  protected _enviroment: LiluEnviroment;

  protected _operators: LiluOperators;

  protected _permissionsByActionMap: Map<string, Array<Permission>>;

  protected _permissions: Array<Permission>;

  constructor(options?: Partial<LiluOptions>) {
    options = options || {};

    this._strict = options.strict || false;
    this._timeout = options.timeout || false;
    this._enviroment = obj.clone(options.enviroment || {});
    this._operators = obj.clone(options.operators || DEFAULT_OPERATORS);

    if (Array.isArray(options.operators)) {
      this._operators = obj.pick(
        DEFAULT_OPERATORS,
        this._operators,
      ) as LiluOperators;
    }

    this._permissionsByActionMap = new Map();
    this._permissions = (options.permissions || []).map((permissionOptions) => {
      const opts = {
        ...permissionOptions,
        operators: this._operators,
        strict: this._strict,
      };

      const permission = new Permission(opts);

      for (const actionName of permission.actions) {
        const list = this._permissionsByActionMap.get(actionName) || [];

        list.push(permission);

        this._permissionsByActionMap.set(actionName, list);
      }

      return permission;
    });
  }

  get permissions(): Array<Permission> {
    return [...this._permissions];
  }

  findActions(value: string | RegExp): Array<string> {
    const startTimer = timer();

    let pattern: RegExp | null = null;

    if (typeof value === 'string') {
      pattern = globToRegExp(value, { extended: true });
    }

    if (!(pattern instanceof RegExp)) {
      throw new TypeError(
        'Failed to find actions, the value argument expected as regexp or string.',
      );
    }

    const list: Array<string> = [];

    for (const value of this._permissionsByActionMap.keys()) {
      if (pattern.test(value)) {
        list.push(value);
      }
    }

    const ms = startTimer.click();

    d(
      'FIND ACTIONS: (%dms)\n  VALUE = %o\n  PATTERN = %o\n  RESULT: %o',
      ms,
      value,
      pattern,
      list,
    );

    return list;
  }

  granted(
    actionName: string,
    optionsOrContextOrCallback?:
      | EvalContext
      | Partial<GrantedOptions>
      | GrantedCallback,
    cb?: GrantedCallback,
  ): Promise<GrantedResult> {
    let callback: GrantedCallback | undefined = cb;

    const options: GrantedOptions = {
      timeout: this._timeout || false,
      enviroment: this._enviroment || {},
      context: {},
    };

    if (typeof actionName !== 'string') {
      throw new TypeError('First argument "actionName" expected as String.');
    }

    if (typeof optionsOrContextOrCallback === 'function') {
      callback = optionsOrContextOrCallback as GrantedCallback;
    } else if (
      optionsOrContextOrCallback &&
      optionsOrContextOrCallback.context
    ) {
      Object.assign(options, optionsOrContextOrCallback);
    } else if (typeof optionsOrContextOrCallback === 'object') {
      options.context = optionsOrContextOrCallback;
    }

    const self = this;

    return promiseOrCallback(callback, function() {
      const cb = arguments[0] as (err?: Error | null, result?: object) => void;
      self._granted(actionName, options).then(cb.bind(null, null), cb);
    });
  }

  async _granted(
    actionName: string,
    options: GrantedOptions,
  ): Promise<GrantedResult> {
    const {
      enviroment = this._enviroment,
      timeout = this._timeout,
      context = {},
    } = options;

    const errors: Array<GrantedResultError> = [];
    const mismatched: Array<PermissionJSON> = [];
    const trace: Array<TracePermission> = [];
    const tRoot = tbag();
    const tChild = tRoot.child();

    let isTimeout = false;

    const startTimer = timer();

    const permissionsList = this._permissionsByActionMap.get(actionName) || [];

    const complete = (permission?: Permission): GrantedResult => {
      const ms = startTimer.click();
      const passed = !!permission;

      return {
        passed,
        timeout: isTimeout,
        permission: permission ? permission.toJSON() : null,
        mismatched,
        errors,
        nErrors: errors.length,
        ms,
        trace: {
          toString: () => tRoot.collect(),
          toJSON: () => obj.clone(trace),
        },
        __t: tRoot,
      };
    };

    const wholeContext: EvalContext = obj.clone(context);

    const ensurePermissionVariables = async (permission: Permission) => {
      for (const variableName of permission.ruleVariables) {
        const contextValue = obj.get(wholeContext, variableName);

        if (contextValue !== undefined) {
          continue;
        }

        let enviromentValue = obj.get(enviroment, variableName);

        if (typeof enviromentValue === 'function') {
          try {
            enviromentValue = await enviromentValue.call(enviroment);
          } catch (err) {
            enviromentValue = err;
            // TO-DO: Log error into tbag
          }
        }

        if (enviromentValue !== undefined) {
          obj.set(wholeContext, variableName, enviromentValue);
        }
      }
    };

    const handlePermission = async (
      permission: Permission,
    ): Promise<boolean> => {
      await ensurePermissionVariables(permission);

      const r = permission.check(wholeContext);

      tRoot
        .attach(r.__t)
        .w('• ACTION = %s', actionName);

      trace.push({
        type: 'permission',
        item: permission.toJSON(),
        result: r,
      });

      if (r.error) {
        errors.push({
          errCode: r.errCode || -1,
          errMsg: r.errMsg || 'unknown error',
        });

        return false;
      } else if (!r.result) {
        mismatched.push(permission.toJSON());
      }

      return !!r.result;
    };

    for (const permission of permissionsList) {
      let passed = false;

      try {
        if (timeout) {
          const timeoutLeft = timeout - startTimer.click();

          passed = await promiseTimeout(
            handlePermission(permission),
            timeoutLeft,
            `timeout - ${permission.title}`,
          );
        } else {
          passed = await handlePermission(permission);
        }
      } catch (err) {
        const errCode = err.code || -1;
        const errMsg = err.message;
        const isTimeoutError = err.name === 'LiluTimeoutError';
        const isCriticalError = !isTimeoutError && errCode === -1;

        if (isTimeoutError) isTimeout = true;

        tChild.w(
          '%s[%o]\n• err_code = %d\n• err_msg = %s\n• context = %s',
          isTimeoutError ? '⏰ @PERMISSION' : '❌❌❌ @PERMISSION',
          permission.title,
          errCode,
          errMsg,
          JSON.stringify(wholeContext, null, 2).replace(/\n/g, '\n  ')
        );

        if (isCriticalError) {
          throw new LiluGrantedError(
            errCode,
            errMsg,
            trace,
            tRoot.collect(),
            err,
          );
        }

        errors.push({ errCode, errMsg });
      }

      if (passed) {
        return complete(permission);
      }
    }

    return complete();
  }
}
