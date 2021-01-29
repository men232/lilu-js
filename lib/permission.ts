import * as array from './utils/array';
import * as obj from './utils/object';
import { Rule, RuleOptions } from './rule';

export interface PermissionAttributes {
  [key: string]: any
}

export interface PermissionOptions {
  title: string,

  actions: Array<string>,

  attributes: PermissionAttributes,

  rules: Array<Partial<RuleOptions>>
}

export class Permission {
  protected _title: string;

  protected _actions: Array<string>;

  protected _attributes: PermissionAttributes;

  protected _rules: Array<Rule>;

  protected _ruleVariables: Array<string>;

  constructor(options: Partial<PermissionOptions>) {
    this._title = options.title || 'Untitled Permission';

    this._actions = obj.clone(options.actions || []);

    this._attributes = obj.clone(options.attributes || {});

    this._rules = (options.rules || [])
      .map(ruleOptions => new Rule(ruleOptions));

    this._ruleVariables = array.uniq(
      array.flat(this._rules.map(rule => rule.conditionVariables))
    );
  }

  get name(): string {
    return 'LiluPermission';
  }

  get title(): string {
    return this._title;
  }

  get actions(): Array<string> {
    return obj.clone(this._actions);
  }

  get ruleVariables(): Array<string> {
    return obj.clone(this._ruleVariables);
  }

  get attributes(): PermissionAttributes {
    return obj.clone(this._attributes);
  }

  toString() {
    const actions = this._actions.join('", "');
    const rules = this._rules
      .map(v => v.toString())
      .join('", "');

    return `${this.name}(\n  title = "${this._title}"\n  actions = ["${actions}"]\n rules =  ["${rules}"]\n)`;
  }

  toJSON() {
    return {
      name: this.name,
      title: this.title,
      actions: this.actions,
      attributes: this.attributes,
      rules: this._rules.map(v => v.toJSON())
    }
  }

  inspect(): object {
    return Object.assign({}, this);
  }
}
