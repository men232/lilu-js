import * as array from '../utils/array';
import LiLuExpression from '../LiLuExpression';
import tbag from '../utils/tbag';
import timer from '../utils/timer';

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
    const operation = this.operation;
    const tRoot = tbag();
    const tCond = tRoot.child();

    let matched;

    const conditionRun = (condition) => {
      const r = condition.eval(context);

      tCond.w('CONDITION %o PASSED = %o\n • BY VALUES:\n   • “%s” = %o\n   • “%s” = %o',
        condition.raw,
        r.result,
        r.left.raw,
        r.left.ensured,
        r.right.raw,
        r.right.ensured
      );

      trace.push({
        type: 'condition',
        item: condition.toJSON(),
        evalResult: r
      });

      return r.result === true;
    };

    const matchTimer = timer();

    if (this.operation === 'OR') {
      matched = this.conditions.some(conditionRun);
    } else {
      matched = this.conditions.every(conditionRun);
    }

    const ms = matchTimer.click();

    tRoot.w('RULE %o RESULT = %o (%d ms)',
      this.title,
      matched,
      ms
    );

    return {
      matched,
      operation,
      trace,
      ms,
      t: tRoot,
    };
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
