import debug from 'debug';
import globToRegExp from 'glob-to-regexp';

import * as obj from './utils/object.js';
import { DEFAULT_OPERATORS, OperatorMap } from './operators';
import { Permission, PermissionOptions } from './permission';
import timer from './utils/timer';

const d = debug('lilu:permission');

export interface LiluOperators {
  [key: string]: (left: any, b: any) => boolean
}

export interface LiluEnviroment {
  [key: string]: any
}

export interface LiluOptions {
  strict: boolean,
  timeout: number,
  operators: OperatorMap | Array<string>,
  enviroment: LiluEnviroment,
  permissions: Array<Partial<PermissionOptions>>
}

export class Lilu {
  protected _strict: boolean;

  protected _timeout: number;

  protected _enviroment: LiluEnviroment;

  protected _operators: LiluOperators;

  protected _permissionsByActionMap: Map<string, Array<Permission>>;

  protected _permissions: Array<Permission>;

  constructor(options?: Partial<LiluOptions>) {
    options = options || {};

    this._strict = options.strict || false;
    this._timeout = options.timeout || 0;
    this._enviroment = obj.clone(options.enviroment || {});
    this._operators = obj.clone(options.operators || {});

    if (Array.isArray(options.operators)) {
      this._operators = obj.pick(DEFAULT_OPERATORS, this._operators) as LiluOperators;
    }

    this._permissionsByActionMap = new Map();
    this._permissions = (options.permissions || []).map(permissionOptions => {
      const opts = {
        ...permissionOptions,
        operators: this._operators,
        strict: this._strict
      };

      const permission = new Permission(opts);

      for(const actionName of permission.actions) {
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

  findActions(value: string | RegExp) {
    const startTimer = timer();

    let pattern: RegExp | null = null;

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
}
