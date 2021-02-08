import * as array from './utils/array';
import * as obj from './utils/object';
import tbag from './utils/tbag';
import { Rule, RuleJSON, RuleMatchResult, RuleOptions } from './rule';
import { EvalContext } from './expression';
import { TraceBase } from './trace';
import timer from './utils/timer';
import { DEFAULT_OPERATORS, OperatorMap } from './operators';

export interface PermissionAttributes {
  [key: string]: any;
}

export interface PermissionOptions {
  strict: boolean,
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

export class Permission {
  protected _title: string;
  protected _strict: boolean;
  protected _actions: Array<string>;
  protected _attributes: PermissionAttributes;
  protected _rules: Array<Rule>;
  protected _ruleVariables: Array<string>;

  constructor(options: Partial<PermissionOptions>) {
    this._title = options.title || 'Untitled Permission';

    this._strict = options.strict || false;

    this._actions = obj.clone(options.actions || []);

    this._attributes = obj.clone(options.attributes || {});

    this._rules = (options.rules || []).map((opts) => {
      const ruleOptions = {
        ...opts,
        strict: options.strict || false,
        operators: options.operators || DEFAULT_OPERATORS
      }

      return new Rule(ruleOptions);
    });

    this._ruleVariables = array.uniq(
      array.flat(this._rules.map((rule) => rule.conditionVariables)),
    );
  }

  get name(): string {
    return 'LiluPermission';
  }

  get title(): string {
    return this._title;
  }

  get actions(): Array<string> {
    return obj.clone(this._actions);
  }

  get ruleVariables(): Array<string> {
    return obj.clone(this._ruleVariables);
  }

  get attributes(): PermissionAttributes {
    return obj.clone(this._attributes);
  }

  check(context: EvalContext): PermissionCheckResult {
    const tRoot = tbag();
    const trace: Array<TraceRule> = [];
    const startTimer = timer();

    const complete = (result: boolean): PermissionCheckResult => {
      const ms = startTimer.click();
      const symPrefix = result ? '✅' : '🔴';

      tRoot
        .w('%s (Permission) %s / %dms', symPrefix, this._title, ms)
        .w('• PASSED = %o', result);

      return {
        error: false,
        result,
        ms,
        trace,
        __t: tRoot,
      };
    };

    const fail = (errCode: number, errMsg: string): PermissionCheckResult => {
      const ms = startTimer.click();

      tRoot
        .w('❌ (Permission) / %dms', ms)
        .w('• title = %o', this.title)
        .w('• err_code = %d', errCode)
        .w('• err_msg = %s', errMsg)
        .w('• context = %s', JSON.stringify(context, null, 2).replace(/\n/g, '\n  '));

      return {
        error: true,
        errCode,
        errMsg,
        ms,
        trace,
        __t: tRoot,
      };
    };

    const missedContextKey = this._ruleVariables.find(
      (keyPath) => obj.get(context, keyPath) === undefined,
    );

    if (missedContextKey) {
      return fail(6, `missed context variable: ${missedContextKey}`);
    }

    for (const rule of this._rules) {
      let hasTraced = false;

      try {
        const r = rule.match(context);

        tRoot.attach(r.__t);

        trace.push({
          type: 'rule',
          item: rule.toJSON(),
          result: r,
        });
        hasTraced = true;

        if (r.error) {
          return fail(
            r.errCode as number,
            `error while "${rule.title}" match.`,
          );
        }

        if (!r.result) {
          return complete(false);
        }
      } catch (err) {
        if (!hasTraced) {
          trace.push({
            type: 'rule',
            item: rule.toJSON(),
            result: {
              error: true,
              errCode: -1,
              errMsg: err.message,
              ms: 0,
              trace: [],
              __t: tbag(),
            },
          });
        }
        return fail(
          -1,
          `critical error while match${rule.toString()}\n${err.stack}`,
        );
      }
    }

    return complete(true);
  }

  toString(): string {
    const actions = this._actions.join('", "');
    const rules = this._rules.map((v) => v.toString()).join('", "');

    return `${this.name}(\n  title = "${this._title}"\n  actions = ["${actions}"]\n rules =  ["${rules}"]\n)`;
  }

  toJSON(): PermissionJSON {
    return {
      name: this.name,
      title: this.title,
      actions: this.actions,
      attributes: this.attributes,
      rules: this._rules.map((v) => v.toJSON()),
    };
  }

  inspect(): object {
    return Object.assign({}, this);
  }
}
