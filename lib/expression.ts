import debug from 'debug';
import evaluate from 'static-eval';
import esprima from 'esprima';
import * as ESTree from 'estree';

import * as obj from './utils/object';
import { DEFAULT_OPERATORS, OperatorMap } from './operators';
import { LiluExpressionParserError } from './errors/LiluExpressionParserError';

const dParse = debug('lilu:expression:parse');
const dCast = debug('lilu:expression:cast');

// eslint-disable-next-line no-useless-escape
const EXPRESSION_REG_EXP = /({{(.*?)}}|\[.*?]|".*?"|[^\s]+)/g;

export interface ExpressionOptions {
  strict: boolean,
  operators: OperatorMap,
}

export class Expression {
  protected _raw: string;

  protected _parsed: Array<any> | null;

  protected _variables: Array<string>;

  protected _strict: boolean;

  protected _operators: OperatorMap

  constructor(str: string, options?: Partial<ExpressionOptions>) {
    options = options || {};

    this._raw = str;
    this._parsed = null;
    this._variables = [];
    this._strict = options.strict || false;
    this._operators = obj.clone(options.operators || DEFAULT_OPERATORS);

    this.parse();

    if (this._strict) {
      this.validate();
    }
  }

  get name(): string {
    return 'LiLuExpression';
  }

  get strict() {
    return this._strict;
  }

  get raw(): string {
    return this._raw;
  }

  get variables(): Array<string> {
    return [...this._variables];
  }

  get isValid(): boolean {
    try {
      this.validate();
      return true;
    } catch (_) {
      return false;
    }
  }

  validate(): boolean {
    if (this._parsed === null) {
      this.parse();
    }

    if (!this._parsed || !Array.isArray(this._parsed)) {
      throw new LiluExpressionParserError(
        'Unknown error while parsing an expression.', this._raw);
    }

    const raw = this._raw;
    const parsed = this._parsed;

    switch (true) {
      case parsed.length !== 3:
        throw new LiluExpressionParserError(
          `Expect 3 parts of expression, parsed: ${parsed.length}`, raw);

      case parsed[0].type === 'operator':
        throw new LiluExpressionParserError(
          'The first part of expression is operator.', raw);

      case parsed[0].type === 'unknown':
        throw new LiluExpressionParserError(
          'The first part of expression is unknown.', raw);

      case parsed[1].type !== 'operator':
        throw new LiluExpressionParserError(
          `The second part of expression must be an operator, parsed: ${parsed[1].type}.`, raw);

      case typeof this._operators[parsed[1].value] !== 'function':
        throw new LiluExpressionParserError(
          `The second part operator has unknown, parsed: ${parsed[1].value}.`, raw);

      case parsed[2].type === 'unknown':
        throw new LiluExpressionParserError(
          'The third part of expression is unknown.', raw);

      case parsed[2].type === 'operator':
        throw new LiluExpressionParserError(
          'The third part of expression is operator.', raw);

      default:
        return true;
    }
  }

  parse(): void {
    const str = this._raw;
    const parsed = [];
    const variables = [];

    dParse('LINE = "%s"', str);

    let matches;

    while ((matches = EXPRESSION_REG_EXP.exec(str)) !== null) {
      const str = (matches[3] || matches[2] || matches[1] || 'null').trim();

      let type = 'unknown';
      let value = null;

      if (!matches || !matches[0]) {
        // noting
      } else {
        [value, type] = this._castExpression(str);
      }

      dCast('STR = "%s"\n    TYPE = %s\n    RESULT = %o', str, type, value);

      parsed.push({ type, value, raw: str });

      if (type === 'variable') {
        variables.push(value);
      } else if (type === 'expression') {
        variables.push(
          ...this._extractEsprimaVariables(value)
        );
      }
    }
  }

  protected _castExpression(str: string): [string | ESTree.Expression, string] {
    try {
      let type: string = 'unknown';
      let value: string | ESTree.Expression = str;

      if (this._operators[str]) {
        return [str, 'operator'];
      }

      const expr = esprima.parseScript(str).body[0] as ESTree.ExpressionStatement;
      const ast = expr.expression;

      switch (true) {
        case ast.type === 'Identifier' || ast.type === 'MemberExpression':
          type = 'variable';
          break;

        case ast.type === 'Literal':
          value = evaluate(ast, {});
          type = this._castType(value);
          break;

        case ast.type === 'ArrayExpression' || ast.type === 'BinaryExpression':
          value = ast;
          type = 'expression';
          break;
      }

      return [value, type];
    } catch (_) {
      return [str, 'unknown'];
    }
  }

  protected _castType(value: any): string {
    switch (true) {
      case value === null:
        return 'null';

      case Array.isArray(value):
        return 'array';

      default:
        return typeof value;
    }
  }

  toString(): string {
    return `${this.name} (${this._raw}): VALID = ${this.isValid} VARS = ${this._variables.join(', ')}`;
  }

  toJSON(): object {
    return {
      name: this.name,
      strict: this.strict,
      str: this.raw,
      variables: this.variables,
      operators: Object.keys(this._operators),
      isValid: this.isValid
    }
  }

  inspect(): object {
    return Object.assign({}, this);
  }
}
