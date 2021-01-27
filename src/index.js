import debug from 'debug';
import globToRegExp from 'glob-to-regexp';

import * as obj from './utils/object';
import * as array from './utils/array';
import promiseOrCallback from './utils/promiseOrCallback';
import promiseDelay from './utils/promiseDelay';
import promiseTimeout from './utils/promiseTimeout';
import timer from './utils/timer';

import LiluPermission from './LiluPermission';
import EXPRESSION_OPERATORS from './LiLuExpression/operators';
import tbag from './utils/tbag';

const d = debug('lilu:permission');

export class Lilu {
  constructor(options = {}) {
    // eslint-disable no-multi-spaces
    this.strict      = options.strict || false;                              // eslint-disable-line
    this._timeout    = options.timeout || 0;                                 // eslint-disable-line
    this._enviroment = obj.clone(options.enviroment || {});                  // eslint-disable-line
    this._operators  = obj.clone(options.operators || EXPRESSION_OPERATORS); // eslint-disable-line

    if (Array.isArray(this._operators)) {
      this._operators = obj.pick(EXPRESSION_OPERATORS, this._operators);
    }

    this._permissionsByActionMap = new Map();
    this._permissions = (options.permissions || []).map(permissionOptions => {
      const permission = new LiluPermission(
        permissionOptions,
        this._operators,
        this.strict
      );

      for(const actionName of permission.actions) {
        const list = this._permissionsByActionMap.get(actionName) || [];

        list.push(permission);

        this._permissionsByActionMap.set(actionName, list);
      }

      return permission;
    });

  }

  get permissions() {
    return [...this._permissions];
  }

  findActions(value) {
    const startTimer = timer();

    let pattern = value;

    if (typeof value === 'string') {
      pattern = globToRegExp(value, { extended: true });
    }

    if (!(pattern instanceof RegExp)) {
      throw new TypeError(
        'Failed to find actions, the value argument expected as regexp or string.'
      );
    }

    const list = [];

    for(const value of this._permissionsByActionMap.keys()) {
      if (pattern.test(value)) {
        list.push(value);
      }
    }

    const ms = startTimer.click();

    d('FIND ACTIONS: (%dms)\n  VALUE = %o\n  PATTERN = %o\n  RESULT: %o',
      ms, value, pattern, list);

    return list;
  }

  granted(actionName, params, callback) {
    if (typeof actionName !== 'string') {
      throw new TypeError('First argument "actionName" expected as String.');
    }

    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    const options = {
      timeout: this._timeout || false,
      context: params
    };

    if (params && params.context !== undefined) {
      Object.assign(options, params);
    }

    return promiseOrCallback(callback, cb => {
      this._granted(actionName, options).then(cb.bind(null, null), cb);
    });
  }

  grantedMany(actions, params, callback) {
    if (typeof actions === 'string') {
      if (actions.indexOf('*') > -1) {
        const pattern = actions;
        actions = this.findActions(pattern);
      } else {
        actions = [actions];
      }
    } else if (actions instanceof RegExp) {
      const pattern = actions;

      actions = this.findActions(pattern);
    }

    if (!Array.isArray(actions)) {
      throw new TypeError('First argument "actions" expected as Array.');
    }

    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    const options = {
      timeout: this._timeout || false,
      context: params
    };

    if (params && params.context !== undefined) {
      Object.assign(options, params);
    }

    return promiseOrCallback(callback, cb => {
      this._grantedMany(actions, options).then(cb.bind(null, null), cb);
    });
  }

  grantedAny(actions, params, callback) {
    if (typeof actions === 'string') {
      if (actions.indexOf('*') > -1) {
        const pattern = actions;
        actions = this.findActions(pattern);
      } else {
        actions = [actions];
      }
    } else if (actions instanceof RegExp) {
      const pattern = actions;

      actions = this.findActions(pattern);
    }

    if (!Array.isArray(actions)) {
      throw new TypeError('First argument "actions" expected as Array.');
    }

    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    const options = {
      timeout: this._timeout || false,
      context: params
    };

    if (params && params.context !== undefined) {
      Object.assign(options, params);
    }

    return promiseOrCallback(callback, cb => {
      this._grantedAny(actions, options).then(cb.bind(null, null), cb);
    });
  }

  async _grantedAny(actions, options = {}) {
    options = options || {};

    const tRoot = tbag();
    const trace = [];

    const startTimer = timer();

    let result = null;

    for(const actionName of actions) {
      const opts = { ...options };

      if (opts.timeout) {
        opts.timeout = opts.timeout - startTimer.click();
      }

      result = await this._granted(actionName, opts);

      tRoot.childs.push(...result.t.childs);
      trace.push(...result.trace.__obj);

      if (result.passed) {
        break;
      }
    }

    const ms = startTimer.click();

    tRoot.w('GRANTED ANY: [%s] (%d ms)', actions.join(' OR '), ms);

    return {
      ...result,
      ms,
      trace: {
        toString: () => tRoot.collect(),
        toJSON: () => obj.clone(trace),
        __obj: trace
      },
      t: tRoot,
    };
  }

  async _grantedMany(actions, options = {}) {
    options = options || {};

    actions = [...actions];

    const allow = [];
    const disallow = [];
    const trace = [];
    const tRoot = tbag();

    let procActions = [...actions];
    const startTimer = timer();

    while(procActions.length > 0) {
      const actionName = procActions.pop();

      const opts = { ...options };

      if (opts.timeout) {
        opts.timeout = opts.timeout - startTimer.click();
      }

      let result = await this._granted(actionName, opts);

      tRoot.childs.push(...result.t.childs);
      trace.push(...result.trace.__obj);

      if (result.passed) {
        // take all actions from permission and exclude from processing list
        procActions = array.pull(procActions, result.permission.actions);

        allow.push(result);
      } else {
        disallow.push(result);
      }
    }

    const ms = startTimer.click();

    tRoot.w('GRANTED: [%s] (%d ms)', actions.join(' AND '), ms);

    return {
      allow,
      disallow,
      ms,
      trace: {
        toString: () => tRoot.collect(),
        toJSON: () => obj.clone(trace),
        __obj: trace
      },
      t: tRoot,
    };
  }

  async _granted(actionName, options = {}) {
    const {
      enviroment = this._enviroment,
      timeout = false,
      context = {}
    } = options || {};

    const startTimer = timer();

    const permissionsList = this._permissionsByActionMap.get(actionName) || [];

    let permission = null;
    let passed = false;
    let mismatched = [];

    const tRoot = tbag();
    let trace = [];

    const wholeContext = obj.clone(context);

    const ensurePermissionVariables = async permission => {
      for(const variableName of permission.ruleVariables) {
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
          }
        }

        obj.set(wholeContext, variableName, enviromentValue);
      }
    };

    const handlePermission = async permission => {
      await ensurePermissionVariables(permission);

      const result = permission.check(wholeContext);

      tRoot.attach(result.t);
      result.t.w(' • TARGET = %s', actionName);

      trace.push({
        type: 'permission',
        item: permission.toJSON(),
        ...result
      });

      if (result.passed) {
        passed = true;
      } else {
        mismatched.push(permission.toJSON());
        permission = null;

        await promiseDelay(0);
      }
    };

    for(permission of permissionsList) {
      if (timeout) {
        const timeoutLeft = timeout - startTimer.click();

        await promiseTimeout(
          handlePermission(permission),
          timeoutLeft,
          `"${actionName}" reached execution timeout.`
        );
      } else {
        await handlePermission(permission);
      }

      if (passed) break;
    }

    const ms = startTimer.click();

    tRoot.w('GRANTED: [%s] (%d ms)', actionName, ms);

    return {
      passed,
      permission: permission ? permission.toJSON() : null,
      mismatched,
      ms,
      trace: {
        toString: () => tRoot.collect(),
        toJSON: () => obj.clone(trace),
        __obj: trace
      },
      t: tRoot,
    };
  }
}

/*!
 * Helper for JSON.stringify
 */
Object.defineProperty(Lilu.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function() {
    return {
      name: this.name,
      strict: this.strict,
      operators: Object.keys(this._operators),
      permissions: this.permissions.map(v => v.toJSON())
    };
  }
});

Object.defineProperty(Lilu.prototype, 'name', {
  value: 'Lilu'
});
