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
    const matchTimer = timer();

    const complete = (result: boolean): RuleMatchResult => {
      const ms = matchTimer.click();

      tRoot
        .w('%s (Rule) %s / %dms', result ? '✅' : '🔴', this._title, ms)
        .w('• MATCHED = %o', result);

      return {
        result,
        trace,
        error: false,
        ms,
        __t: tRoot,
      };
    };

    const fail = (errCode: number, errMsg: string): RuleMatchResult => {
      const ms = matchTimer.click();

      tRoot
        .w('❌ (Rule) %d / ms', ms)
        .w('• title = %o', this._title)
        .w('• err_code = %d', errCode)
        .w('• err_msg =')
        .w('    - %s', errMsg.replace(/\n/g, '\n    - '));

      return {
        error: true,
        errMsg,
        errCode,
        trace,
        ms,
        __t: tRoot,
      };
    };

    let lastCondition = this._conditions[0];
    let isError = false;
    let lastErrCode = -1;
    let lastErrMsg = '';
    let isMatched: boolean;

    let n = 1;

    const conditionRun = (condition: Expression) => {
      if (isError) return false;

      lastCondition = condition;

      const tCond = tRoot.child();
      const r = condition.eval(context);

      trace.push({
        type: 'condition',
        item: condition.toJSON(),
        result: r,
      });

      tCond
        .w('%s (Condition #%d)', r.error ? '❌' : r.result ? '✅' : '🔴', n++)
        // .table()
        // .row()
        // .cell(r.error ? 'ERROR' : r.result ? 'OK!' : 'INVALID')
        // .cell('Condition #%d', n++)
        // .cell('"%s" = "%o"',
        //   condition.raw,
        //   r.error ? `err: ${r.errCode}` : r.result)
        // .label('%s (Condition #%d) | "%s" = "%o"',
        //   r.error ? '❌' : r.result ? '👌' : '🔴', n++,
        //   condition.raw,
        //   r.error ? `err: ${r.errCode}` : r.result
        // )
        // .tableWrite()
        .table()
        .label('"%s" = "%o"', condition.raw, r.error
          ? `err: ${r.errCode}`
          : r.result
        )
        .row()
          .cell('type')
          .cell('value')
          .cell('ensured')
        // .splitter()
        .row()
          .cell('@%s', r.stack.leftValue.type)
          .cell('"%s"', r.stack.leftValue.raw || '@missed_left')
          .cell('= %o', r.stack.leftValue.ensured)
        .row()
          .cell('@%s', r.stack.rightValue.type)
          .cell('"%s"', r.stack.rightValue.raw || '@missed_right')
          .cell('= %o', r.stack.rightValue.ensured)
        .tableWrite()
        .w('');

      if (r.error) {
        tCond
          .w('• ERROR:')
          .w('  • err_code = %d', r.errCode)
          .w('  • err_msg = %s', r.errMsg)
      }

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
      return fail(
        lastErrCode,
        `condition[${lastCondition.raw}].eval()\n${lastErrMsg || '@missed'}`,
      );
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
