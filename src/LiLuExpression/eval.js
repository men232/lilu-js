import evaluate from 'static-eval';
import debug from 'debug';

import * as obj from '../utils/object';
import { LiluExpressionEvalError } from '../error';

const d = debug('lilu:expression:eval');
const dError = debug('lilu:expression:eval:error');

export default function evalExpression(context = {}) {
  this.validate();

  if (this.strict) {
    const missedContextKey = this._variables.find(
      (keyPath) => obj.get(context, keyPath) === undefined
    );

    if (missedContextKey) {
      dError('Failed to eval "%s", "%s" has missed in context: %o',
        this._raw, missedContextKey, context);

      throw new LiluExpressionEvalError(
        `Detected missed variable: "${missedContextKey}" has required in strict mode.`,
        this._raw,
        context
      );
    }
  }

  const [left, operator, right] = this._parsed;

  let leftValue = ensureValue(left, context);
  let rightValue = ensureValue(right, context);

  const operatorFn = this._operators[operator.value];

  try {
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

    return {
      left: { ...left, ensured: leftValue },
      right: { ...right, ensured: rightValue },
      operator: operator.value,
      result
    };
  } catch (err) {
    dError('%s %s %s ERROR = %s\n    BY VALUES:\n      “%s” = %o\n      “%s” = %o',
      left.raw,
      operator.value,
      right.raw,
      err.message,
      left.raw,
      leftValue,
      right.raw,
      rightValue
    );
  'string' | 'object' | 'number' | 'boolean' |
  'array' | 'null';
    throw new LiluExpressionEvalError(
      `Execution error: ${err.message}`,
      this._raw,
      context
    );
  }
}

function ensureValue({ type, value }, context) {
  switch (type) {
    case 'variable':
      return obj.get(context, value);

   case 'expression':
     return evaluate(value, context);

    default:
      return value;
  }
}
