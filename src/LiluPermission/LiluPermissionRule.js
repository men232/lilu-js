import * as array from '../utils/array';
import LiLuExpression from '../LiLuExpression';

export default class LiluPermissionRule {
  constructor(options = {}, operators, strict = false) {
    this.title = options.title || 'Untitled Rule';

    this.operation = options.operation || 'AND';

    this.conditions = (options.conditions || [])
      .map(cond => new LiLuExpression(cond, { operators, strict }));

    this._conditionVariables = array.uniq(
      this.conditions.map(condition => condition.variables).flat()
    );
  }

  get conditionVariables() {
    return [...this._conditionVariables];
  }

  match(context) {
    const trace = [];

    let isMatched = false;

    const conditionRun = (condition) => {
      const r = condition.eval(context);

      trace.push({ condition, evalResult: r });

      return r.result === true;
    };

    if (this.operation === 'OR') {
      isMatched = this.conditions.some(conditionRun);
    } else {
      isMatched = this.conditions.every(conditionRun);
    }

    return { matched: isMatched, trace };
  }

  /**
   * Console.log helper
   */
  toString(_, pad = 0) {
    const sep = '- '.padStart(pad + 4, ' ');
    const conditions = sep + this.conditions.join('\n' + sep);
    return `${this.name} (${this.title}):\n${conditions}`;
  }

  /*!
   * inspect helper
   */
  inspect() {
    return Object.assign({}, this);
  }
}

/*!
 * Helper for JSON.stringify
 */
Object.defineProperty(LiluPermissionRule.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function() {
    return {
      name: this.name,
      title: this.title,
      operation: this.operation,
      conditions: this.conditions.map(v => v._raw)
    };
  }
});

Object.defineProperty(LiluPermissionRule.prototype, 'name', {
  value: 'LiluPermissionRule'
});
