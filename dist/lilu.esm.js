import debug from 'debug';
import globToRegExp from 'glob-to-regexp';
import obj from 'clone-deep';
import evaluate from 'static-eval';
import esprima from 'esprima';

function set(obj, path, value) {
  if (Object(obj) !== obj) return obj; // If not yet an array, get the keys from the string-path

  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];
  path.slice(0, -1).reduce((a, c, i) => // Iterate all of them except the last one
  Object(a[c]) === a[c] // Does the key exist and is its value an object?
  // Yes: then follow that path
  ? a[c] // No: create the key. Is the next key a potential array-index?
  : a[c] = Math.abs(path[i + 1]) >> 0 === +path[i + 1] ? [] // Yes: assign a new array object
  : {}, // No: assign a new plain object
  obj)[path[path.length - 1]] = value; // Finally assign the value to the last key

  return obj; // Return the top-level object to allow chaining
}
function get(obj, path, defaultValue = undefined) {
  const travel = regexp => String.prototype.split.call(path, regexp).filter(Boolean).reduce((res, key) => res !== null && res !== undefined ? res[key] : res, obj);

  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
}
function pick(obj, list) {
  const result = {};

  for (const key of list) {
    result[key] = get(obj, key);
  }

  return result;
}

function uniq(arr) {
  return [...new Set(arr)];
}
function pull(items, valuesToRemove) {
  return items.filter(item => !valuesToRemove.includes(item));
}

function promiseOrCallback(callback, fn) {
  if (typeof callback === 'function') {
    return fn(function (error) {
      if (error != null) {
        try {
          callback(error);
        } catch (error) {
          return process.nextTick(() => {
            throw error;
          });
        }

        return;
      }

      callback.apply(this, arguments);
    });
  }

  return new Promise((resolve, reject) => {
    fn(function (error, res) {
      if (error !== null) {
        return reject(error);
      }

      if (arguments.length > 2) {
        return resolve(Array.prototype.slice.call(arguments, 1));
      }

      resolve(res);
    });
  });
}

function promiseDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

class LiluExpressionEvalError extends Error {
  constructor(message, expressionText, context, code) {
    super(message);
    this.expressionText = expressionText || null;
    this.context = context || null;
    this.code = code || -1;
  }
  /**
   * Console.log helper
   */


  toString() {
    return `${this.name} (${this.expressionText}): ${this.message}`;
  }
  /*!
   * inspect helper
   */


  inspect() {
    return Object.assign(new Error(this.message), this);
  }

}
/*!
 * Helper for JSON.stringify
 */


Object.defineProperty(LiluExpressionEvalError.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function () {
    return Object.assign({}, this, {
      message: this.message,
      expressionText: this.expressionText,
      context: this.context,
      code: this.code
    });
  }
});
Object.defineProperty(LiluExpressionEvalError.prototype, 'name', {
  value: 'LiluExpressionEvalError'
});

class LiluExpressionParserError extends Error {
  constructor(message, expressionText, code) {
    super(message);
    this.expressionText = expressionText || null;
    this.code = code || -1;
  }
  /**
   * Console.log helper
   */


  toString() {
    return `${this.name} (${this.expressionText}): ${this.message}`;
  }
  /*!
   * inspect helper
   */


  inspect() {
    return Object.assign(new Error(this.message), this);
  }

}
/*!
 * Helper for JSON.stringify
 */


Object.defineProperty(LiluExpressionParserError.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function () {
    return Object.assign({}, this, {
      message: this.message,
      expressionText: this.expressionText,
      code: this.code
    });
  }
});
Object.defineProperty(LiluExpressionParserError.prototype, 'name', {
  value: 'LiluExpressionParserError'
});

class LiluTimeoutError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code || -1;
  }
  /**
   * Console.log helper
   */


  toString() {
    return `${this.name}: ${this.message}`;
  }
  /*!
   * inspect helper
   */


  inspect() {
    return Object.assign(new Error(this.message), this);
  }

}
/*!
 * Helper for JSON.stringify
 */


Object.defineProperty(LiluTimeoutError.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function () {
    return Object.assign({}, this, {
      message: this.message,
      code: this.code
    });
  }
});
Object.defineProperty(LiluTimeoutError.prototype, 'name', {
  value: 'LiluTimeoutError'
});

function promiseTimeout(promise, timeoutMillis, message) {
  let error = new LiluTimeoutError(message || 'Timeout error');
  let timeout;
  return Promise.race([promise, new Promise(function (resolve, reject) {
    timeout = setTimeout(function () {
      reject(error);
    }, timeoutMillis);
  })]).then(function (v) {
    clearTimeout(timeout);
    return v;
  }, function (err) {
    clearTimeout(timeout);
    throw err;
  });
}

function timer() {
  let startAt = Date.now();
  const instance = {
    reset: () => {
      startAt = Date.now();
      return instance;
    },
    click: () => Date.now() - startAt
  };
  return instance;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

const EXPRESSION_REG_EXP = /(\{\{(.*?)\}\}|\[.*?\]|\".*?\"|[^\s]+)/g;
const dParse = debug('lilu:expression:parse');
const dCast = debug('lilu:expression:cast');
function parseExpression() {
  const str = String(this._raw);
  const matchResult = Array.from(str.matchAll(EXPRESSION_REG_EXP));
  dParse('LINE = "%s"', str);
  const parsed = [];
  const variables = [];

  for (const match of matchResult) {
    const str = (match[3] || match[2] || match[1] || 'null').trim();
    let type = 'unknown';
    let value = null;

    if (!match || !match[0]) ; else {
      [value, type] = castExpression.call(this, str);
    }

    dCast('STR = "%s"\n    TYPE = %s\n    RESULT = %o', str, type, value);
    parsed.push({
      type,
      value,
      raw: str
    });

    if (type === 'variable') {
      variables.push(value);
    } else if (type === 'expression') {
      variables.push(...extractEsprimaVariables(value));
    }
  }

  this._parsed = parsed;
  this._variables = uniq(variables); // make uniq
}

function extractEsprimaVariables(expression) {
  const list = [];

  if (expression.type === 'Identifier') {
    list.push(expression.name);
  } else if (expression.type === 'BinaryExpression') {
    for (const el of [expression.left, expression.right]) {
      list.push(...extractEsprimaVariables(el));
    }
  } else if (expression.type === 'MemberExpression') {
    list.push(`${expression.object.name}.${expression.property.name}`);
  } else if (expression.elements) {
    for (const el of expression.elements) {
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

const d = debug('lilu:expression:eval');
const dError = debug('lilu:expression:eval:error');
function evalExpression(context = {}) {
  this.validate();

  if (this.strict) {
    const missedContextKey = this._variables.find(keyPath => get(context, keyPath) === undefined);

    if (missedContextKey) {
      dError('Failed to eval "%s", "%s" has missed in context: %o', this._raw, missedContextKey, context);
      throw new LiluExpressionEvalError(`Detected missed variable: "${missedContextKey}" has required in strict mode.`, this._raw, context);
    }
  }

  const [left, operator, right] = this._parsed;
  let leftValue = ensureValue(left, context);
  let rightValue = ensureValue(right, context);
  const operatorFn = this._operators[operator.value];

  try {
    const result = operatorFn(leftValue, rightValue);
    d('%s %s %s RESULT = %s\n    BY VALUES:\n      “%s” = %o\n      “%s” = %o', left.raw, operator.value, right.raw, result, left.raw, leftValue, right.raw, rightValue);
    return {
      left: { ...left,
        ensured: leftValue
      },
      right: { ...right,
        ensured: rightValue
      },
      operator: operator.value,
      result
    };
  } catch (err) {
    dError('%s %s %s ERROR = %s\n    BY VALUES:\n      “%s” = %o\n      “%s” = %o', left.raw, operator.value, right.raw, err.message, left.raw, leftValue, right.raw, rightValue);
    throw new LiluExpressionEvalError(`Execution error: ${err.message}`, this._raw, context);
  }
}

function ensureValue({
  type,
  value
}, context) {
  switch (type) {
    case 'variable':
      return get(context, value);

    case 'expression':
      return evaluate(value, context);

    default:
      return value;
  }
}

function validateExpression() {
  if (this._parsed === null) {
    this.parse();
  }

  if (!this._parsed || !Array.isArray(this._parsed)) {
    throw new LiluExpressionParserError(`Unknown error while parsing an expression.`, raw);
  }

  const raw = this._raw;
  const parsed = this._parsed;

  switch (true) {
    case parsed.length !== 3:
      throw new LiluExpressionParserError(`Expect 3 parts of expression, parsed: ${parsed.length}`, raw);

    case parsed[0].type === 'operator':
      throw new LiluExpressionParserError(`The first part of expression is operator.`, raw);

    case parsed[0].type === 'unknown':
      throw new LiluExpressionParserError(`The first part of expression is unknown.`, raw);

    case parsed[1].type !== 'operator':
      throw new LiluExpressionParserError(`The second part of expression must be an operator, parsed: ${parsed[1].type}.`, raw);

    case typeof this._operators[parsed[1].value] !== 'function':
      throw new LiluExpressionParserError(`The second part operator has unknown, parsed: ${parsed[1].value}.`, raw);

    case parsed[2].type === 'unknown':
      throw new LiluExpressionParserError(`The third part of expression is unknown.`, raw);

    case parsed[2].type === 'operator':
      throw new LiluExpressionParserError(`The third part of expression is operator.`, raw);

    default:
      return true;
  }
}

var EXPRESSION_OPERATORS = {
  '>': (leftValue, rightValue) => {
    return leftValue > rightValue;
  },
  '>=': (leftValue, rightValue) => {
    return leftValue > rightValue;
  },
  '<': (leftValue, rightValue) => {
    return leftValue < rightValue;
  },
  '<=': (leftValue, rightValue) => {
    return leftValue <= rightValue;
  },
  '==': (leftValue, rightValue) => {
    return leftValue === rightValue;
  },
  '!=': (leftValue, rightValue) => {
    return leftValue !== rightValue;
  },
  'in': (leftValue, rightValue) => {
    if (!Array.isArray(leftValue)) leftValue = [leftValue];
    if (!Array.isArray(rightValue)) rightValue = [rightValue];
    return leftValue.some(value => rightValue.indexOf(value) > -1);
  }
};

class LiLuExpression {
  constructor(str, options = {}) {
    _defineProperty(this, "parse", parseExpression);

    _defineProperty(this, "eval", evalExpression);

    _defineProperty(this, "validate", validateExpression);

    if (typeof str === 'object') {
      options = str;
      str = options.str;
    }

    this._raw = str;
    this._parsed = null;
    this._variables = [];
    this.strict = options.strict || false;
    this._operators = obj(options.operators || EXPRESSION_OPERATORS);
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

}
/*!
 * Helper for JSON.stringify
 */

Object.defineProperty(LiLuExpression.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function () {
    return {
      name: this.name,
      strict: this.strict,
      str: this.raw,
      variables: this.variables,
      operators: Object.keys(this._operators),
      isValid: this.isValid
    };
  }
});
Object.defineProperty(LiLuExpression.prototype, 'name', {
  value: 'LiLuExpression'
});

function format(fmt, ...args) {
  const re = /(%?)(%([jdsoO]))/g;

  if (args.length) {
    fmt = fmt.replace(re, (match, escaped, ptn, flag) => {
      let arg = args.shift();

      switch (flag) {
        case 's':
          arg = '' + arg;
          break;

        case 'd':
          arg = Number(arg);
          break;

        case 'j':
          arg = JSON.stringify(arg);
          break;

        case 'o':
          arg = JSON.stringify(arg);
          break;

        case 'O':
          arg = JSON.stringify(arg, null, 2);
          break;
      }

      if (!escaped) {
        return arg;
      }

      args.unshift(arg);
      return match;
    });
  }

  if (args.length) {
    fmt += ' ' + args.join(' ');
  } // update escaped %% values


  fmt = fmt.replace(/%{2}/g, '%');
  return '' + fmt;
}

function createTBag() {
  const rootChilds = [];
  const lines = [];

  const collect = ({
    lines,
    childs
  }, pad = 0) => {
    if (!lines.length && !childs.length) {
      return '';
    }

    const p = ''.padStart(pad, ' ');
    let result = '\n' + p + lines.join('\n' + p);

    for (const item of childs) {
      result += '\n' + ''.padStart(pad) + '  ' + collect(item, pad + 2);
    }

    return result.trim();
  };

  const rootCollect = () => collect({
    lines,
    childs: rootChilds
  });

  return {
    w(...args) {
      const line = format(...args);
      lines.push(...line.split('\n'));
      return this;
    },

    attach(instance) {
      return this.child(instance);
    },

    child(instance) {
      instance = instance || createTBag();
      instance.isChild = true;
      instance.collect = this.isChild ? this.collect : rootCollect;
      rootChilds.push(instance);
      return instance;
    },

    childs: rootChilds,
    lines: lines,
    collect: rootCollect,
    str: () => collect({
      lines,
      childs: rootChilds
    })
  };
}
/*
  const t = createTBag();

  console.log(
  t
    .w('line 1')
    .w('line 2')
    .w('line 3')
    .w('line 4')
    .child()
    .w('line 1.1 with\n * some 1\n * some 2')
    .w('line 1.2')
    .w('line 1.3')
    .w('line 1.4')
    .child()
    .w('line 2.1')
    .w('line 2.2')
    .w('line 2.3')
    .w('line 2.4')
    .collect()
  );
  console.log('-----');
  console.log(t.collect())
 */

class LiluPermissionRule {
  constructor(options = {}, operators, strict = false) {
    this.title = options.title || 'Untitled Rule';
    this.operation = options.operation || 'AND';
    this.conditions = (options.conditions || []).map(cond => new LiLuExpression(cond, {
      operators,
      strict
    }));
    this._conditionVariables = uniq(this.conditions.map(condition => condition.variables).flat());
  }

  get conditionVariables() {
    return [...this._conditionVariables];
  }

  match(context) {
    const trace = [];
    const operation = this.operation;
    const tRoot = createTBag();
    const tCond = tRoot.child();
    let matched;

    const conditionRun = condition => {
      const r = condition.eval(context);
      tCond.w('CONDITION %o PASSED = %o\n • BY VALUES:\n   • “%s” = %o\n   • “%s” = %o', condition.raw, r.result, r.left.raw, r.left.ensured, r.right.raw, r.right.ensured);
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
    tRoot.w('RULE %o RESULT = %o (%d ms)', this.title, matched, ms);
    return {
      matched,
      operation,
      trace,
      ms,
      t: tRoot
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
  value: function () {
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

class LiluPermission {
  constructor(options = {}, operators, strict = false) {
    this.title = options.title || 'Untitled Permission';
    this.actions = obj(options.actions || []);
    this._attributes = obj(options.attributes || {});
    this.rules = (options.rules || []).map(rule => new LiluPermissionRule(rule, operators, strict));
    this._ruleVariables = uniq(this.rules.map(rule => rule.conditionVariables).flat());
  }

  get ruleVariables() {
    return obj(this._ruleVariables);
  }

  get attributes() {
    return obj(this._attributes);
  }

  check(context) {
    const tRoot = createTBag();
    const trace = [];

    const ruleRun = rule => {
      const result = rule.match(context);
      tRoot.attach(result.t);
      trace.push({
        type: 'rule',
        item: rule.toJSON(),
        ...result,
        ms
      });
      return result.matched;
    };

    const startTimer = timer();
    const isAllRulesPassed = this.rules.every(ruleRun);
    const ms = startTimer.click();
    tRoot.w('PERMISSION %o\n • PASSED: %o (%d ms)', this.title, isAllRulesPassed, ms);
    return {
      passed: isAllRulesPassed,
      context,
      trace,
      t: tRoot,
      ms
    };
  }
  /**
   * Console.log helper
   */


  toString(_, pad = 0) {
    const actions = `"${this.actions.join('", "')}"`;
    const sep = '- '.padStart(pad + 4, ' ');
    const rules = sep + this.rules.map(v => v.toString(null, pad + 4)).join('\n' + sep);
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
  value: function () {
    return {
      name: this.name,
      title: this.title,
      actions: obj(this.actions),
      attributes: obj(this._attributes),
      rules: this.rules.map(v => v.toJSON())
    };
  }
});
Object.defineProperty(LiluPermission.prototype, 'name', {
  value: 'LiluPermission'
});

const d$1 = debug('lilu:permission');
class Lilu {
  constructor(options = {}) {
    // eslint-disable no-multi-spaces
    this.strict = options.strict || false; // eslint-disable-line

    this._timeout = options.timeout || 0; // eslint-disable-line

    this._enviroment = obj(options.enviroment || {}); // eslint-disable-line

    this._operators = obj(options.operators || EXPRESSION_OPERATORS); // eslint-disable-line

    if (Array.isArray(this._operators)) {
      this._operators = pick(EXPRESSION_OPERATORS, this._operators);
    }

    this._permissionsByActionMap = new Map();
    this._permissions = (options.permissions || []).map(permissionOptions => {
      const permission = new LiluPermission(permissionOptions, this._operators, this.strict);

      for (const actionName of permission.actions) {
        const list = this._permissionsByActionMap.get(actionName) || [];
        list.push(permission);

        this._permissionsByActionMap.set(actionName, list);
      }

      return permission;
    });
  }

  get permissions() {
    return [...this._permissions];
  }

  findActions(value) {
    const startTimer = timer();
    let pattern = value;

    if (typeof value === 'string') {
      pattern = globToRegExp(value, {
        extended: true
      });
    }

    if (!(pattern instanceof RegExp)) {
      throw new TypeError('Failed to find actions, the value argument expected as regexp or string.');
    }

    const list = [];

    for (const value of this._permissionsByActionMap.keys()) {
      if (pattern.test(value)) {
        list.push(value);
      }
    }

    const ms = startTimer.click();
    d$1('FIND ACTIONS: (%dms)\n  VALUE = %o\n  PATTERN = %o\n  RESULT: %o', ms, value, pattern, list);
    return list;
  }

  granted(actionName, params, callback) {
    if (typeof actionName !== 'string') {
      throw new TypeError('First argument "actionName" expected as String.');
    }

    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    const options = {
      timeout: this._timeout || false,
      context: params
    };

    if (params && params.context !== undefined) {
      Object.assign(options, params);
    }

    return promiseOrCallback(callback, cb => {
      this._granted(actionName, options).then(cb.bind(null, null), cb);
    });
  }

  grantedMany(actions, params, callback) {
    if (typeof actions === 'string') {
      if (actions.indexOf('*') > -1) {
        const pattern = actions;
        actions = this.findActions(pattern);
      } else {
        actions = [actions];
      }
    } else if (actions instanceof RegExp) {
      const pattern = actions;
      actions = this.findActions(pattern);
    }

    if (!Array.isArray(actions)) {
      throw new TypeError('First argument "actions" expected as Array.');
    }

    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    const options = {
      timeout: this._timeout || false,
      context: params
    };

    if (params && params.context !== undefined) {
      Object.assign(options, params);
    }

    return promiseOrCallback(callback, cb => {
      this._grantedMany(actions, options).then(cb.bind(null, null), cb);
    });
  }

  grantedAny(actions, params, callback) {
    if (typeof actions === 'string') {
      if (actions.indexOf('*') > -1) {
        const pattern = actions;
        actions = this.findActions(pattern);
      } else {
        actions = [actions];
      }
    } else if (actions instanceof RegExp) {
      const pattern = actions;
      actions = this.findActions(pattern);
    }

    if (!Array.isArray(actions)) {
      throw new TypeError('First argument "actions" expected as Array.');
    }

    if (typeof params === 'function') {
      callback = params;
      params = null;
    }

    const options = {
      timeout: this._timeout || false,
      context: params
    };

    if (params && params.context !== undefined) {
      Object.assign(options, params);
    }

    return promiseOrCallback(callback, cb => {
      this._grantedAny(actions, options).then(cb.bind(null, null), cb);
    });
  }

  async _grantedAny(actions, options = {}) {
    options = options || {};
    const tRoot = createTBag();
    const trace = [];
    const startTimer = timer();
    let result = null;

    for (const actionName of actions) {
      const opts = { ...options
      };

      if (opts.timeout) {
        opts.timeout = opts.timeout - startTimer.click();
      }

      result = await this._granted(actionName, opts);
      tRoot.childs.push(...result.t.childs);
      trace.push(...result.trace.__obj);

      if (result.passed) {
        break;
      }
    }

    const ms = startTimer.click();
    tRoot.w('GRANTED ANY: [%s] (%d ms)', actions.join(' OR '), ms);
    return { ...result,
      ms,
      trace: {
        toString: () => tRoot.collect(),
        toJSON: () => obj(trace),
        __obj: trace
      },
      t: tRoot
    };
  }

  async _grantedMany(actions, options = {}) {
    options = options || {};
    actions = [...actions];
    const allow = [];
    const disallow = [];
    const trace = [];
    const tRoot = createTBag();
    let procActions = [...actions];
    const startTimer = timer();

    while (procActions.length > 0) {
      const actionName = procActions.pop();
      const opts = { ...options
      };

      if (opts.timeout) {
        opts.timeout = opts.timeout - startTimer.click();
      }

      let result = await this._granted(actionName, opts);
      tRoot.childs.push(...result.t.childs);
      trace.push(...result.trace.__obj);

      if (result.passed) {
        // take all actions from permission and exclude from processing list
        procActions = pull(procActions, result.permission.actions);
        allow.push(result);
      } else {
        disallow.push(result);
      }
    }

    const ms = startTimer.click();
    tRoot.w('GRANTED: [%s] (%d ms)', actions.join(' AND '), ms);
    return {
      allow,
      disallow,
      ms,
      trace: {
        toString: () => tRoot.collect(),
        toJSON: () => obj(trace),
        __obj: trace
      },
      t: tRoot
    };
  }

  async _granted(actionName, options = {}) {
    const {
      enviroment = this._enviroment,
      timeout = false,
      context = {}
    } = options || {};
    const startTimer = timer();
    const permissionsList = this._permissionsByActionMap.get(actionName) || [];
    let permission = null;
    let passed = false;
    let mismatched = [];
    const tRoot = createTBag();
    let trace = [];
    const wholeContext = obj(context);

    const ensurePermissionVariables = async permission => {
      for (const variableName of permission.ruleVariables) {
        const contextValue = get(wholeContext, variableName);

        if (contextValue !== undefined) {
          continue;
        }

        let enviromentValue = get(enviroment, variableName);

        if (typeof enviromentValue === 'function') {
          try {
            enviromentValue = await enviromentValue.call(enviroment);
          } catch (err) {
            enviromentValue = err;
          }
        }

        set(wholeContext, variableName, enviromentValue);
      }
    };

    const handlePermission = async permission => {
      await ensurePermissionVariables(permission);
      const result = permission.check(wholeContext);
      tRoot.attach(result.t);
      result.t.w(' • TARGET = %s', actionName);
      trace.push({
        type: 'permission',
        item: permission.toJSON(),
        ...result
      });

      if (result.passed) {
        passed = true;
      } else {
        mismatched.push(permission.toJSON());
        permission = null;
        await promiseDelay(0);
      }
    };

    for (permission of permissionsList) {
      if (timeout) {
        const timeoutLeft = timeout - startTimer.click();
        await promiseTimeout(handlePermission(permission), timeoutLeft, `"${actionName}" reached execution timeout.`);
      } else {
        await handlePermission(permission);
      }

      if (passed) break;
    }

    const ms = startTimer.click();
    tRoot.w('GRANTED: [%s] (%d ms)', actionName, ms);
    return {
      passed,
      permission: permission ? permission.toJSON() : null,
      mismatched,
      ms,
      trace: {
        toString: () => tRoot.collect(),
        toJSON: () => obj(trace),
        __obj: trace
      },
      t: tRoot
    };
  }

}
/*!
 * Helper for JSON.stringify
 */

Object.defineProperty(Lilu.prototype, 'toJSON', {
  enumerable: false,
  writable: false,
  configurable: true,
  value: function () {
    return {
      name: this.name,
      strict: this.strict,
      operators: Object.keys(this._operators),
      permissions: this.permissions.map(v => v.toJSON())
    };
  }
});
Object.defineProperty(Lilu.prototype, 'name', {
  value: 'Lilu'
});

export { Lilu };
//# sourceMappingURL=lilu.esm.js.map
