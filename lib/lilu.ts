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
  PermissionCheckResult,
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
    allow: Array<string>,
    disallow: Array<string>
  },
  permissions: {
    matched: Array<PermissionJSON>,
    mismatched: Array<PermissionJSON>
  },
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

export type GrantedCallback = (err: Error, passed: boolean) => void;

export interface TracePermission extends TraceBase {
  type: 'permission';
  item: PermissionJSON;
  result: PermissionCheckResult;
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

    const handlePermission = async (
      permission: Permission,
    ): Promise<boolean> => {
      const r = await this._checkPermission(permission, {
        timeout: (typeof timeout === 'number' && timeout > 0)
          ? timeout - startTimer.click()
          : false,
        enviroment,
        context
      });

      tRoot
        .attach(r.__t)
        .w('• CHECK ACTION = %s', actionName);

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
        passed = await handlePermission(permission);
      } catch (err) {
        const errCode = err.code || -1;
        const errMsg = err.message;

        tRoot.child()
          .w('❌❌❌ (Permission)')
          .w('• title = %s', permission.title)
          .w('• err_code = %d', errCode)
          .w('• err_msg = %s', errMsg)
          .w('• context = %s', JSON.stringify(context, null, 2).replace(/\n/g, '\n  '));

        throw new LiluGrantedError(
          errCode,
          errMsg,
          [],
          tRoot.collect(),
          err.originErr || err,
        );
      }

      if (passed) {
        return complete(permission);
      }
    }

    return complete();
  }

  async _grantedMany(
    actions: Array<string>,
    options: GrantedOptions
  ): Promise<GrantedManyResult> {
    const {
      enviroment = this._enviroment,
      timeout = this._timeout,
      context = {},
    } = options;

    const trace: Array<TracePermission> = [];
    const tRoot = tbag();

    const allow: Array<string> = [];
    const disallow: Array<string> = [];

    const matchedMap: Map<Permission, true> = new Map();
    const mismatchedMap: Map<Permission, true> = new Map();

    let errors: Array<GrantedResultError> = [];
    let unprocessedActions = [...actions];
    let isTimeout = false;

    const startTimer = timer();

    const handlePermission = async (permission: Permission): Promise<boolean> => {
      try {
        const r = await this._checkPermission(permission, {
          enviroment,
          context,
          timeout: typeof timeout === 'number' && timeout > 0
            ? timeout - startTimer.click()
            : false
        });

        isTimeout = r.timeout;

        tRoot.attach(r.__t)
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
        }

        if (r.result) {
          matchedMap.set(permission, true);
          return true
        }

        mismatchedMap.set(permission, true);
        return false;
      } catch (err) {
        const errCode = err.code || -1;
        const errMsg = err.message;

        tRoot.child()
          .w('❌❌❌ (Permission)')
          .w('• title = %s', permission.title)
          .w('• err_code = %d', errCode)
          .w('• err_msg = %s', errMsg)
          .w('• context = %s', JSON.stringify(context, null, 2).replace(/\n/g, '\n  '));

        throw new LiluGrantedError(
          errCode,
          errMsg,
          [],
          tRoot.collect(),
          err.originErr || err,
        );
      }
    };

    while (unprocessedActions.length > 0 && !isTimeout) {
      const actionName = unprocessedActions.pop();

      if (!actionName) break;

      let permissions = this._permissionsByActionMap.get(actionName);

      if (!permissions || !permissions.length) {
        disallow.push(actionName);
        continue;
      }

      // Is already matched
      if (permissions.some(p => matchedMap.has(p))) {
        allow.push(actionName);
        continue;
      }

      // cut off mismatched
      permissions = permissions.filter(p => !mismatchedMap.has(p));

      if (!permissions.length) {
        disallow.push(actionName);
        continue;
      }

      let passed = false;

      for (const permission of permissions) {
        passed = await handlePermission(permission);

        if (passed) {
          break;
        }
      }

      if (passed) {
        allow.push(actionName);
      } else {
        disallow.push(actionName);
      }
    }

    const ms = startTimer.click();
    const passed = actions.length === allow.length && !disallow.length;

    const symPrefix = errors.length
        ? '❌'
        : passed ? '✅' : '🔴';

    const matched = Array.from(matchedMap.keys());
    const mismatched = Array.from(mismatchedMap.keys());

    tRoot
      .w('%s (Granted Many) / %d ms', symPrefix, ms)
      .w('• ALLOW = %s', allow.join('\n        - ') || 'N/A')
      .w('• DISALLOW = %s', disallow.join('\n           - ') || 'N/A')
      .w('• MATCHED = %s', matched.map(v => v.title).join('\n          - ') || 'N/A')
      .w('• MISMATCHED = %s', mismatched.map(v => v.title).join('\n             - ') || 'N/A');

    if (errors.length) {
      tRoot.w('• ERRORS = %d', errors.length);
    }

    return {
      actions: { allow, disallow },
      permissions: {
        matched: matched.map(v => v.toJSON()),
        mismatched: mismatched.map(v => v.toJSON())
      },
      passed: passed,
      timeout: isTimeout,
      errors,
      nErrors: errors.length,
      ms,
      trace: {
        toString: () => tRoot.collect(),
        toJSON: () => obj.clone(trace),
      },
      __t: tRoot,
    }
  }

  async _checkPermission(
    permission: Permission,
    options: GrantedOptions
  ): Promise<CheckPermissionResult> {
    const {
      enviroment,
      timeout,
      context = {},
    } = options;

    const startTimer = timer();
    const wholeContext: EvalContext = obj.clone(context);

    let isVarsComputed = false;

    let tRoot = tbag();
    let tEnv = tbag();

    // Compute enviroment variables
    const computePermissionVariables = async () => {
      for (const variableName of permission.ruleVariables) {
        const contextValue = obj.get(wholeContext, variableName);

        if (contextValue !== undefined) {
          continue;
        }

        if (!isVarsComputed) {
          tEnv.w('• ENV COMPUTED:');
          isVarsComputed = true;
        }

        const ensureTimer = timer();
        let enviromentValue = obj.get(enviroment, variableName);

        if (typeof enviromentValue === 'function') {
          try {
            enviromentValue = await enviromentValue.call(enviroment);

            tEnv.w('  - %s = @%s %o (%d ms)',
              variableName,
              typeof enviromentValue,
              enviromentValue,
              ensureTimer.click()
            );
          } catch (err) {
            tEnv.w('  - %s = ❌ err:%s (%d ms)',
              variableName,
              err.message,
              ensureTimer.click()
            );
          }
        }

        if (enviromentValue !== undefined) {
          obj.set(wholeContext, variableName, enviromentValue);
        }
      }
    };

    const handlePermission = async (): Promise<CheckPermissionResult> => {
      await computePermissionVariables();

      const r = permission.check(wholeContext);

      // @ts-ignore
      tRoot = r.__t;

      return { ...r, timeout: false };
    };

    let result: CheckPermissionResult;

    try {
      if (timeout) {
        const timeoutLeft = timeout - startTimer.click();

        result = await promiseTimeout(
          handlePermission(),
          timeoutLeft,
          'timeout',
        );
      } else {
        result = await handlePermission();
      }
    } catch (err) {
      const errCode = err.code || -1;
      const errMsg = err.message;
      const isTimeoutError = err.name === 'LiluTimeoutError';
      const isCriticalError = !isTimeoutError && errCode === -1;

      tRoot
        .w(isTimeoutError ? '⏰ (Permission)' : '❌❌❌ (Permission)')
        .w('• title = %s', permission.title)
        .w('• err_code = %d', errCode)
        .w('• err_msg = %s', errMsg)
        .w('• context = %s', JSON.stringify(wholeContext, null, 2).replace(/\n/g, '\n  '))
        .merge(tEnv);

      if (isCriticalError) {
        throw new LiluGrantedError(
          errCode,
          errMsg,
          [],
          tRoot.collect(),
          err,
        );
      } else {
        result = {
          trace: [],
          error: true,
          timeout: isTimeoutError,
          errCode,
          errMsg,
          ms: 0,
          __t: tRoot
        }
      }
    }

    tRoot.merge(tEnv).w('');

    result.ms = startTimer.click();
    return result;
  }
}
