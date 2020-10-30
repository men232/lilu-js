import { LiluExpressionParserError } from '../error';

export default function validateExpression() {
  if (this._parsed === null) {
    this.parse();
  }

  if (!this._parsed || !Array.isArray(this._parsed)) {
    throw new LiluExpressionParserError(
      `Unknown error while parsing an expression.`, raw);
  }

  const raw = this._raw;
  const parsed = this._parsed;

  switch (true) {
    case parsed.length !== 3:
      throw new LiluExpressionParserError(
        `Expect 3 parts of expression, parsed: ${parsed.length}`, raw);

    case parsed[0].type === 'operator':
      throw new LiluExpressionParserError(
        `The first part of expression is operator.`, raw);

    case parsed[0].type === 'unknown':
      throw new LiluExpressionParserError(
        `The first part of expression is unknown.`, raw);

    case parsed[1].type !== 'operator':
      throw new LiluExpressionParserError(
        `The second part of expression must be an operator, parsed: ${parsed[1].type}.`, raw);

    case typeof this._operators[parsed[1].value] !== 'function':
      throw new LiluExpressionParserError(
        `The second part operator has unknown, parsed: ${parsed[1].value}.`, raw);

    case parsed[2].type === 'unknown':
      throw new LiluExpressionParserError(
        `The third part of expression is unknown.`, raw);

    case parsed[2].type === 'operator':
      throw new LiluExpressionParserError(
        `The third part of expression is operator.`, raw);

    default:
      return true;
  }
}
