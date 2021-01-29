import * as array from './utils/array';
import { Expression, ExpressionOptions } from './expression';
import { DEFAULT_OPERATORS, OperatorMap } from './operators';

export type RuleOperation = 'OR' | 'AND';

export interface RuleOptions {
  title: string,
  operation: RuleOperation,
  conditions: Array<string>,
  operators: OperatorMap,
  strict: boolean,
}

export class Rule {
  protected _title: string;
  protected _operation: RuleOperation;
  protected _conditions: Array<Expression>;
  protected _conditionVariables: Array<string>;

  constructor(options: Partial<RuleOptions>) {
    this._title = options.title || 'Untitled Rule';

    this._operation = options.operation || 'AND';

    this._conditions = (options.conditions || []).map(exprStr => {
      const exprOptions: ExpressionOptions = {
        strict: options.strict || false,
        operators: options.operators || DEFAULT_OPERATORS
      };

      exprOptions.strict = options.strict || false;
      exprOptions.operators = options.operators || DEFAULT_OPERATORS;

      return new Expression(exprStr, exprOptions);
    });

    this._conditionVariables = array.uniq(
      array.flat(
        this._conditions.map(condition => condition.variables)
      )
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

  toString(): string {
    const conditions = this._conditions.join('",\n    "');
    return `${this.name}(\n  title = "${this._title}"\n  conditions = [\n    "${conditions}"]\n)`;
  }

  toJSON(): object {
    return {
      name: this.name,
      title: this.title,
      operation: this.operation,
      conditions: this.conditions.map(v => v.raw)
    }
  }

  inspect(): object {
    return Object.assign({}, this);
  }
}
