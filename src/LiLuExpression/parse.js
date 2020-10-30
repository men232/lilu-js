import debug from 'debug';
import evaluate from 'static-eval';
import esprima from 'esprima';

import * as array from '../utils/array';

// eslint-disable-next-line no-useless-escape
const EXPRESSION_REG_EXP = /(\{\{(.*?)\}\}|\[.*?\]|\".*?\"|[^\s]+)/g;

const dParse = debug('lilu:expression:parse');
const dCast = debug('lilu:expression:cast');

export default function parseExpression() {
  const str = String(this._raw);

  const matchResult = Array.from(str.matchAll(EXPRESSION_REG_EXP));

  dParse('LINE = "%s"', str);

  const parsed = [];
  const variables = [];

  for(const match of matchResult) {
    const str = (match[3] || match[2] || match[1] || 'null').trim();

    let type = 'unknown';
    let value = null;

    if (!match || !match[0]) {
      // noting
    } else {
      [value, type] = castExpression.call(this, str);
    }

    dCast('STR = "%s"\n    TYPE = %s\n    RESULT = %o', str, type, value);

    parsed.push({ type, value, raw: str });

    if (type === 'variable') {
      variables.push(value);
    } else if (type === 'expression') {
      variables.push(
        ...extractEsprimaVariables(value)
      );
    }
  }

  this._parsed = parsed;
  this._variables = array.uniq(variables); // make uniq
}

function extractEsprimaVariables(expression) {
  const list = [];

  if (expression.type === 'Identifier') {
    list.push(expression.name);
  } else if (expression.type === 'BinaryExpression') {
    for(const el of [expression.left, expression.right]) {
      list.push(...extractEsprimaVariables(el));
    }
  } else if (expression.type === 'MemberExpression') {
    list.push(`${expression.object.name}.${expression.property.name}`);
  } else if (expression.elements) {
    for(const el of expression.elements) {
      list.push(...extractEsprimaVariables(el));
    }
  }

  return list;
}

function castExpression(str) {
  try {
    let type = 'unknown';
    let value = str;

    if (this._operators[str]) {
      return [str, 'operator'];
    }

    const ast = esprima.parse(str).body[0].expression;

    switch (true) {
      case ast.type === 'Identifier' || ast.type === 'MemberExpression':
        type = 'variable';
        break;

      case ast.type === 'Literal':
        value = evaluate(ast);
        type = castType(value);
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

function castType(value) {
  switch (true) {
    case value === null:
      return 'null';

    case Array.isArray(value):
      return 'array';

    default:
      return typeof value;
  }
}
