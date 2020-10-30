import * as array from '../utils/array';
import * as obj from '../utils/object';
import timer from '../utils/timer';
import LiluPermissionRule from './LiluPermissionRule';

export default class LiluPermission {
  constructor(options = {}, operators, strict = false) {
    this.title = options.title || 'Untitled Permission';

    this.actions = obj.clone(options.actions || []);

    this._attributes = obj.clone(options.attributes || {});

    this.rules = (options.rules || [])
      .map(rule => new LiluPermissionRule(rule, operators, strict));

    this._ruleVariables = array.uniq(
      this.rules.map(rule => rule.conditionVariables).flat()
    );
  }

  get ruleVariables() {
    return obj.clone(this._ruleVariables);
  }

  get attributes() {
    return obj.clone(this._attributes);
  }

  check(context) {
    const rulesTrace = [];

    const ruleRun = (rule) => {
      const matchTimer = timer();
      const { matched: isMatched, trace } = rule.match(context);
      const ms = matchTimer.click();

      rulesTrace.push({ rule, isMatched, trace, ms });

      return isMatched;
    };

    const startTimer = timer();
    const isAllRulesPassed = this.rules.every(ruleRun);

    return {
      passed: isAllRulesPassed,
      context,
      trace: rulesTrace,
      ms: startTimer.click()
    };
  }

  /**
   * Console.log helper
   */
  toString(_, pad = 0) {
    const actions = `"${this.actions.join('", "')}"`;
    const sep = '- '.padStart(pad + 4, ' ');
    const rules = sep + this.rules
      .map(v => v.toString(null, pad + 4))
      .join('\n' + sep);

    return `${this.name} (${this.title}): [${actions}]\n${rules}`;
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
Object.defineProperty(LiluPermission.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function() {
    return {
      name: this.name,
      title: this.title,
      actions: obj.clone(this.actions),
      attributes: obj.clone(this._attributes),
      rules: this.rules.map(v => v.toJSON())
    };
  }
});

Object.defineProperty(LiluPermission.prototype, 'name', {
  value: 'LiluPermission'
});
