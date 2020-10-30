import * as obj from '../utils/object';
import parse from './parse';
import evalExpression from './eval';
import validate from './validate';
import EXPRESSION_OPERATORS from './operators';

export default class LiLuExpression {
  constructor(str, options = {}) {
    if (typeof str === 'object') {
      options = str;
      str = options.str;
    }

    this._raw = str;
    this._parsed = null;
    this._variables = [];
    this.strict = options.strict || false;
    this._operators = obj.clone(options.operators || EXPRESSION_OPERATORS);

    this.parse();

    if (this.strict) {
      this.validate();
    }
  }

  get raw() {
    return this._raw;
  }

  get variables() {
    return [...this._variables];
  }

  get isValid() {
    try {
      this.validate();
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Console.log helper
   */
  toString() {
    return `${this.name} (${this._raw}): VALID = ${this.isValid} VARS = ${this._variables.join(', ')}`;
  }

  /*!
   * inspect helper
   */
  inspect() {
    return Object.assign({}, this);
  }

  parse = parse;
  eval = evalExpression;
  validate = validate;
}

/*!
 * Helper for JSON.stringify
 */
Object.defineProperty(LiLuExpression.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function() {
    return {
      name: this.name,
      strict: this.strict,
      str: this.str,
      variables: this.variables,
      operators: Object.keys(this._operators),
      isValid: this.isValid
    };
  }
});

Object.defineProperty(LiLuExpression.prototype, 'name', {
  value: 'LiLuExpression'
});
