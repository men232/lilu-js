import * as array from './utils/array';
import timer from './utils/timer';
import tbag from './utils/tbag';
import {
  EvalContext,
  EvalResult,
  Expression,
  ExpressionJSON,
  ExpressionOptions,
} from './expression';
import { DEFAULT_OPERATORS, OperatorMap } from './operators';
import { TraceBase } from './trace';

export type RuleOperation = 'OR' | 'AND';

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
  __t: object
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

export class Rule {
  protected _title: string;
  protected _operation: RuleOperation;
  protected _conditions: Array<Expression>;
  protected _conditionVariables: Array<string>;

  constructor(options: Partial<RuleOptions>) {
    this._title = options.title || 'Untitled Rule';

    this._operation = options.operation || 'AND';

    this._conditions = (options.conditions || []).map((exprStr) => {
      const exprOptions: ExpressionOptions = {
        strict: options.strict || false,
        operators: options.operators || DEFAULT_OPERATORS,
      };

      exprOptions.strict = options.strict || false;
      exprOptions.operators = options.operators || DEFAULT_OPERATORS;

      return new Expression(exprStr, exprOptions);
    });

    this._conditionVariables = array.uniq(
      array.flat(this._conditions.map((condition) => condition.variables)),
    );
  }

  get name(): string {
    return 'LiluRule';
  }

  get title(): string {
    return this._title;
  }

  get conditionVariables(): Array<string> {
    return [...this._conditionVariables];
  }

  get conditions(): Array<Expression> {
    return this._conditions;
  }

  get operation(): string {
    return this._operation;
  }

  match(context: EvalContext): RuleMatchResult {
    const trace: Array<TraceCondition> = [];
    const tRoot = tbag();
    const tCond = tRoot.child();
    const matchTimer = timer();

    const complete = (result: boolean): RuleMatchResult => {
      const ms = matchTimer.click();

      tRoot.w('%s @RULE[%o] %d ms\n• MATCHED = %o',
        result ? '✅' : '🔴',
        this.title,
        ms,
        result
      );

      return {
        result,
        trace,
        error: false,
        ms,
        __t: tRoot
      };
    };

    const fail = (errCode: number, errMsg: string): RuleMatchResult => {
      const ms = matchTimer.click();

      tRoot.w(
        '❌ @RULE[%o] %d ms\n• err_code = %d\n• err_msg =\n    - %s',
        this.title,
        ms,
        errCode,
        errMsg.replace(/\n/g, '\n    - '),
      );

      return {
        error: true,
        errMsg,
        errCode,
        trace,
        ms,
        __t: tRoot
      };
    };

    let lastCondition = this._conditions[0];
    let isError = false;
    let lastErrCode = -1;
    let lastErrMsg = '';
    let isMatched: boolean;

    const conditionRun = (condition: Expression) => {
      if (isError) return false;

      lastCondition = condition;

      const r = condition.eval(context);

      trace.push({
        type: 'condition',
        item: condition.toJSON(),
        result: r,
      });

      const symPrefix = r.error
        ? '❌'
        : r.result ? '✅' : '🔴';

      const padVarType = Math.max(
        r.stack.leftValue.type.length,
        r.stack.rightValue.type.length,
      ) + 3;

      const padVarRaw = Math.max(
        String(r.stack.leftValue.raw).length,
        String(r.stack.rightValue.raw).length,
      ) + 3;

      const varHeader = `${'type '.padEnd(padVarType + 2, '─')}${'value '.padEnd(padVarRaw + 2, '─')} ensured`;

      tCond.w(
        `${symPrefix} @CONDITION\nƒ %s = %o\n• BY VALUES:\n└── ${varHeader}\n  • @%s %s = %o\n  • @%s %s = %o${
          r.error
            ? '\n• ERROR:\n  • err_code = %d\n  • err_msg = %s'
            : ''
        }\n`,
        condition.raw,
        r.result,
        r.stack.leftValue.type.padEnd(padVarType, ' '),
        (r.stack.leftValue.raw || '@missed_left').padEnd(padVarRaw, ' '),
        r.stack.leftValue.ensured,
        r.stack.rightValue.type.padEnd(padVarType, ' '),
        (r.stack.rightValue.raw || '@missed_right').padEnd(padVarRaw, ' '),
        r.stack.rightValue.ensured,
        r.errCode,
        r.errMsg,
      );

      if (r.error) {
        isError = true;
        lastErrCode = r.errCode || -1;
        lastErrMsg = r.errMsg || 'unknown error';
      }

      return !r.error && r.result == true;
    };

    if (this.operation === 'OR') {
      isMatched = this.conditions.some(conditionRun);
    } else {
      isMatched = this.conditions.every(conditionRun);
    }

    if (isError) {
      return fail(lastErrCode, `condition[${lastCondition.raw}].eval()\n${lastErrMsg || '@missed'}`);
    }

    return complete(isMatched);
  }

  toString(): string {
    const conditions = this._conditions.join('",\n    "');
    return `${this.name}(\n  title = "${this._title}"\n  conditions = [\n    "${conditions}"]\n)`;
  }

  toJSON(): RuleJSON {
    return {
      name: this.name,
      title: this.title,
      operation: this.operation,
      conditions: this.conditions.map((v) => v.raw),
    };
  }

  inspect(): object {
    return Object.assign({}, this);
  }
}
