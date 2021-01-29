import debug from 'debug';
import evaluate from 'static-eval';
import esprima from 'esprima';
import * as ESTree from 'estree';

import * as obj from './utils/object';
import { DEFAULT_OPERATORS, OperatorMap } from './operators';
import { LiluExpressionParserError } from './errors/LiluExpressionParserError';

const d = debug('lilu:expression');
const dError = debug('lilu:expression:error');

// eslint-disable-next-line no-useless-escape
const EXPRESSION_REG_EXP = /({{(.*?)}}|\[.*?]|".*?"|[^\s]+)/g;

export interface ExpressionOptions {
  strict: boolean,
  operators: OperatorMap,
}

export interface EvalContext {
  [key: string]: any
}

export interface EvalResult {
  error: boolean,
  result?: boolean,
  errCode?: number,
  errMsg?: string,
}

export interface ParsedBase {
  type: string,
  raw: string,
  value: any
}

export interface ParsedVariable extends ParsedBase {
  type: 'variable',
  value: string
}

export interface ParsedExpression extends ParsedBase {
  type: 'expression',
  value: ESTree.Expression
}

export interface ParsedOperator extends ParsedBase {
  type: 'operator',
  value: string
}

export interface ParsedLiteral extends ParsedBase {
  type: LiteralType
  value: LiteralValue;
}

export interface ParsedUnknown extends ParsedBase {
  type: 'unknown',
  value: any
}

export type LiteralType =
  'string' | 'object' | 'number' | 'boolean' |
  'array' | 'null';

export type LiteralValue =
  string | object | Array<any> | number |
  boolean | null;

export type ParsedItem =
  ParsedVariable | ParsedExpression | ParsedOperator |
  ParsedLiteral | ParsedUnknown;

export class Expression {
  protected _raw: string;

  protected _parsed: Array<ParsedItem>;

  protected _variables: Array<string>;

  protected _strict: boolean;

  protected _operators: OperatorMap

  constructor(str: string, options?: Partial<ExpressionOptions>) {
    options = options || {};

    this._raw = str;
    this._parsed = [];
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
    const parsed = [];
    const variables = [];

    d('PARSE LINE = "%s"', this._raw);

    let matches;

    while ((matches = EXPRESSION_REG_EXP.exec(this._raw)) !== null) {
      const str = (matches[3] || matches[2] || matches[1] || 'null').trim();

      let parsedItem: ParsedItem;

      if (!matches || !matches[0]) {
        parsedItem = { type: 'unknown', value: str, raw: str };
      } else {
        parsedItem = this._parseExpression(str);
      }

      d('CAST STR = "%s"\n    TYPE = %s\n    RESULT = %o',
        str, parsedItem.type, parsedItem.value);

      parsed.push(parsedItem);

      if (parsedItem.type === 'variable') {
        variables.push(parsedItem.value);
      } else if (parsedItem.type === 'expression') {
        variables.push(
          ...this._extractEsprimaVariables(parsedItem.value)
        );
      }
    }
  }

  eval(context?: EvalContext): EvalResult {
    context = context || {};

    const complete = (result: boolean): EvalResult => {
      return {
        error: true,
        result
      };
    };

    const fail = (errCode: number, errMsg: string): EvalResult => {
      return {
        error: false,
        errMsg,
        errCode
      };
    };

    if (this._strict) {
      const missedContextKey = this._variables.find(
        (keyPath) => obj.get(context, keyPath) === undefined
      );

      if (missedContextKey) {
        return fail(1, `Detected missed variable: "${missedContextKey}" has required in strict mode.`);
      }
    }

    try {
      const left = this._parsed[0];
      const operator = this._parsed[1] as ParsedOperator;
      const right = this._parsed[2];

      let leftValue = this._ensureValue(left, context);
      let rightValue = this._ensureValue(right, context);

      const operatorFn = this._operators[operator.value];

      if (typeof operatorFn !== 'function') {
        throw new LiluExpressionEvalError(
          `Attempt to eval with unknown operator: ${operator.value}`, this._raw, context);
      }

      const result = operatorFn(leftValue, rightValue);

      d('%s %s %s RESULT = %s\n    BY VALUES:\n      “%s” = %o\n      “%s” = %o',
        left.raw,
        operator.value,
        right.raw,
        result,
        left.raw,
        leftValue,
        right.raw,
        rightValue
      );

      return complete(result);
    } catch (err) {
      dError('EVAL ERROR\n  raw = "%s"\n  context = %O\n  err = %O',
        this._raw,
        context,
        err
      );

      return fail(2, err.stack);
    }


  }

  protected _extractEsprimaVariables(expression: ESTree.Expression): Array<string> {
    const list: Array<string> = [];

    if (expression.type === 'Identifier') {
      list.push(expression.name);
    } else if (expression.type === 'BinaryExpression') {
      for(const el of [expression.left, expression.right]) {
        list.push(...this._extractEsprimaVariables(el));
      }
    } else if (expression.type === 'MemberExpression') {
      const objName = (expression.object as ESTree.Identifier).name;
      const objProp = (expression.property as ESTree.Identifier).name;

      list.push(`${objName}.${objProp}`);
    } else if (expression.type === 'ArrayExpression') {
      for(const el of expression.elements) {
        list.push(...this._extractEsprimaVariables(el as ESTree.Expression));
      }
    }

    return list;
  }

  protected _parseExpression(str: string): ParsedItem {
    try {
      // Cast as operator
      if (this._operators[str]) {
        return { type: 'operator', value: str, raw: str };
      }

      const expr = esprima.parseScript(str).body[0];

      if (expr.type !== 'ExpressionStatement') {
        throw new LiluExpressionParserError(
          `Unexpected esprima expression type ${expr.type}`);
      }

      const ast = expr.expression;

      let type;
      let value;

      switch (true) {
        // Cast as variable
        case ast.type === 'Identifier' || ast.type === 'MemberExpression':
          return { type: 'variable', value: str, raw: str };

        // Cast as literal
        case ast.type === 'Literal':
          value = evaluate(ast, {});
          type = this._castType(value);

          if (type) return { type, value, raw: str };

          break;

        // Cast as expression
        case ast.type === 'ArrayExpression' || ast.type === 'BinaryExpression':
          return { type: 'expression', value: ast, raw: str };
      }
    } catch (err) {
      dError('CAST EXPRESSION: raw = "%s" err = %s', str, err.stack);
    }

    return { type: 'unknown', value: str, raw: str };
  }

  protected _castType(value: any): LiteralType | null {
    const type = typeof value;

    switch (true) {
      case value === null:
        return 'null';

      case Array.isArray(value):
        return 'array';
    }

    switch (type) {
      case 'string': return 'string';
      case 'object': return 'object';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      default:
        return null;
    }
  }

  protected _ensureValue(item: ParsedItem, context?: EvalContext): any {
    switch (item.type) {
      case 'variable':
        return obj.get(context, item.value);

      case 'expression':
        return evaluate(item.value, context || {});

      default:
        return item.value;
    }
  }

  toString(): string {
    return `${this.name}(${this._raw}): VALID = ${this.isValid} VARS = ${this._variables.join(', ')}`;
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
