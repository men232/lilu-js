'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var debug = require('debug');
var globToRegExp = require('glob-to-regexp');
var obj = require('clone-deep');
var evaluate = require('static-eval');
var esprima = require('esprima');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var debug__default = /*#__PURE__*/_interopDefaultLegacy(debug);
var globToRegExp__default = /*#__PURE__*/_interopDefaultLegacy(globToRegExp);
var obj__default = /*#__PURE__*/_interopDefaultLegacy(obj);
var evaluate__default = /*#__PURE__*/_interopDefaultLegacy(evaluate);
var esprima__default = /*#__PURE__*/_interopDefaultLegacy(esprima);

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

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);

  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) symbols = symbols.filter(function (sym) {
      return Object.getOwnPropertyDescriptor(object, sym).enumerable;
    });
    keys.push.apply(keys, symbols);
  }

  return keys;
}

function _objectSpread2(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};

    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }

  return target;
}

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

function uniq(arr) {
  return [...new Set(arr)];
}
function flat(arr, depth) {
  depth = isNaN(depth) ? 1 : Number(depth);
  return depth ? Array.prototype.reduce.call(arr, function (acc, cur) {
    if (Array.isArray(cur)) {
      acc.push.apply(acc, flat(cur, depth - 1));
    } else {
      acc.push(cur);
    }

    return acc;
  }, []) : Array.prototype.slice.call(arr);
}

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

function textTable() {
  const rows = [];
  const instance = this;
  let MAX_LENGTH_PER_CELL = [];
  let MAX_LINES_PER_ROWS = [];
  let MAP_IS_ROW_LABEL = [];
  let MAX_CELL_AMOUNT = 0;
  const api = {
    row: createRow,
    label: createLabel,
    tableWrite: complete
  };

  function complete() {
    const isLabelFirst = !!MAP_IS_ROW_LABEL[0];
    const isLabelLast = !!MAP_IS_ROW_LABEL[rows.length - 1];
    const maxLabelLength = Math.max(0, ...rows.filter((v, idx) => !!MAP_IS_ROW_LABEL[idx]).map(row => Math.max(...row[0].map(v => v.length))));
    const maxRowLength = MAX_LENGTH_PER_CELL.reduce((a, b) => a + b, 0);

    if (maxLabelLength > maxRowLength) {
      const avgDiff = Math.round((maxLabelLength - maxRowLength) / MAX_CELL_AMOUNT);
      MAX_LENGTH_PER_CELL = MAX_LENGTH_PER_CELL.map(v => v + avgDiff);
    }

    const start = '┌' + MAX_LENGTH_PER_CELL.map(len => ''.padStart(len + 2, '─')).join(isLabelFirst ? '─' : '┬') + '┐\n';
    const end = '\n└' + MAX_LENGTH_PER_CELL.map(len => ''.padStart(len + 2, '─')).join(isLabelLast ? '─' : '┴') + '┘';
    const result = '' + start + rows.map((row, rowIdx) => {
      const lines = [];
      const isLabel = !!MAP_IS_ROW_LABEL[rowIdx];
      const isNextLabel = !!MAP_IS_ROW_LABEL[rowIdx + 1];
      const isLastRow = rowIdx === rows.length - 1;
      const rowSplitter = '\n├' + MAX_LENGTH_PER_CELL.map(len => ''.padStart(len + 2, '─')).join(isLabel ? isLastRow || isNextLabel ? '─' : '┬' : isNextLabel ? '┴' : '┼') + '┤\n';
      const cellSplitter = isLabel ? '   ' : ' │ ';

      for (let lineIdx = 0; lineIdx < MAX_LINES_PER_ROWS[rowIdx]; lineIdx++) {
        const cells = [];

        for (let cellIdx = 0; cellIdx < MAX_CELL_AMOUNT; cellIdx++) {
          const coll = row[cellIdx] ? row[cellIdx][lineIdx] ? row[cellIdx][lineIdx] : '' : '';

          if (isLabel) {
            const maxLen = MAX_LENGTH_PER_CELL.reduce((a, b) => a + b, 0) + Math.max((MAX_LENGTH_PER_CELL.length - 1) * 3, 0);
            cells.push(coll.padEnd(maxLen, ' '));
            break;
          } else {
            const maxLen = MAX_LENGTH_PER_CELL[cellIdx];
            cells.push(coll.padEnd(maxLen, ' '));
          }
        }

        lines.push('│ ' + cells.join(cellSplitter) + ' │');
      }

      return lines.join('\n') + (isLastRow ? '' : rowSplitter);
    }).join('') + end;
    return instance.w(result);
  }

  function createCell(rowIdx, fmt, ...args) {
    const row = rows[rowIdx];
    const lines = format(String(fmt), ...args).split('\n');
    const cellIdx = row.length;
    MAX_LENGTH_PER_CELL[cellIdx] = Math.max(MAX_LENGTH_PER_CELL[cellIdx] || 0, ...lines.map(v => v.length));
    MAX_LINES_PER_ROWS[rowIdx] = Math.max(MAX_LINES_PER_ROWS[rowIdx] || 0, lines.length);
    MAX_CELL_AMOUNT = Math.max(MAX_CELL_AMOUNT, cellIdx + 1);
    row.push(lines);
    return _objectSpread2(_objectSpread2({}, api), {}, {
      cell: createCell.bind(null, rowIdx)
    });
  }

  function createRow() {
    const row = [];
    const rowIdx = rows.push(row) - 1;
    return _objectSpread2(_objectSpread2({}, api), {}, {
      cell: createCell.bind(null, rowIdx)
    });
  }

  function createLabel(fmt, ...args) {
    createRow();
    const rowIdx = rows.length - 1;
    const cellLength = MAX_LENGTH_PER_CELL[0] || 0;
    createCell(rowIdx, fmt || '', ...args);
    MAX_LENGTH_PER_CELL[0] = cellLength;
    MAP_IS_ROW_LABEL[rowIdx] = true;
    return api;
  }

  return api;
}

const chr = function (s) {
  return s;
};

function createTBag() {
  const rootChilds = [];
  const lines = [];

  const collect = ({
    lines,
    childs
  }, prefix = '') => {
    if (!lines || !lines.length && childs && childs.length) {
      lines = flat(childs.map(v => v.lines));
      childs = flat(childs.map(v => v.childs));
      return collect({
        lines,
        childs
      }, prefix);
    }

    const splitter = prefix ? '\n' + prefix + (childs.length ? chr('│') : ' ') + ' ' : '\n';
    return prefix + lines.join(splitter) + '\n' + childs.map(function (child, ix) {
      const last = ix === childs.length - 1;
      const more = child.childs && child.childs.length;
      const prefix_ = prefix + (last ? ' ' : chr('│')) + ' ';
      return prefix + (last ? chr('└') : chr('├')) + chr('─') + (more ? chr('┬') : chr('─')) + ' ' + collect(child, prefix_).slice(prefix.length + 2);
    }).join('');
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

    table: textTable,

    a(...args) {
      const line = format(...args);
      lines.unshift(...line.split('\n'));
      return this;
    },

    attach(instance, prepend = false) {
      return this.child(instance, prepend);
    },

    merge(instance) {
      lines.push(...instance.lines);
      rootChilds.push(...instance.childs);
      return this;
    },

    child(instance, prepend = false) {
      instance = instance || createTBag();
      instance.isChild = true;
      instance.collect = this.isChild ? this.collect : rootCollect;

      if (prepend) {
        rootChilds.unshift(instance);
      } else {
        rootChilds.push(instance);
      }

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
  .table()
  .row()
    .cell('header 1')
    .cell('header 2')
    .cell('header 3')
  .row()
    .cell('cell 1\ntest')
    .cell('cell 2')
    .cell('cell 3 qewr q,lw;r qlwr m;qwlrm lqr; qwlr q;lwrm')
  .row()
    .cell('cell 1')
    .cell('cell 2')
    .cell('cell 3')
  .tableWrite()
  .child()
  .w('test 1')
  .w('test 2')
  .w('test 3')
  .child()
  .w('test 2.1')
  .w('test 2.2')
  .w('test 2.3')
  .collect()
);
*/

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

const DEFAULT_OPERATORS = {
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

class LiluExpressionError extends Error {
  constructor(message, expressionText, code) {
    super(message);

    _defineProperty(this, "name", void 0);

    _defineProperty(this, "expressionText", void 0);

    _defineProperty(this, "code", void 0);

    this.name = 'LiluExpressionError';
    this.expressionText = expressionText || null;
    this.code = code || -1;
  }

  toString() {
    return `${this.name}(${this.code}, "${this.expressionText}", ${this.message})`;
  }

  toJSON() {
    return Object.assign({}, this, {
      message: this.message,
      expressionText: this.expressionText,
      code: this.code
    });
  }

}

const d = debug__default['default']('lilu:expression');
const dError = debug__default['default']('lilu:expression:error'); // eslint-disable-next-line no-useless-escape

const EXPRESSION_REG_EXP = /({{(.*?)}}|\[.*?]|".*?"|[^\s]+)/g;
const EXPRESSION_LITERAL_TYPES = ['string', 'number', 'boolean', 'object', 'variable', 'expression', 'array', 'null'];
class Expression {
  constructor(str, options) {
    _defineProperty(this, "_raw", void 0);

    _defineProperty(this, "_parsed", void 0);

    _defineProperty(this, "_variables", void 0);

    _defineProperty(this, "_operators", void 0);

    options = options || {};
    this._raw = str;
    this._parsed = [];
    this._variables = [];
    this._operators = obj__default['default'](options.operators || DEFAULT_OPERATORS);

    this._parse();

    this._validateAndThrow();
  }

  get name() {
    return 'LiLuExpression';
  }

  get raw() {
    return this._raw;
  }

  get variables() {
    return [...this._variables];
  }

  get isValid() {
    try {
      this._validateAndThrow();

      return true;
    } catch (_) {
      return false;
    }
  }

  toString() {
    return `${this.name}(${this._raw}): VALID = ${this.isValid} VARS = ${this._variables.join(', ')}`;
  }

  toJSON() {
    return {
      name: this.name,
      str: this.raw,
      variables: this.variables,
      operators: Object.keys(this._operators),
      isValid: this.isValid
    };
  }

  eval(context) {
    context = context || {};
    const stack = {
      operator: null,
      leftValue: {
        raw: null,
        ensured: null,
        type: 'unknown'
      },
      rightValue: {
        raw: null,
        ensured: null,
        type: 'unknown'
      }
    };

    const complete = result => {
      return {
        error: false,
        result,
        stack
      };
    };

    const fail = (errCode, errMsg) => {
      return {
        error: true,
        errMsg,
        errCode,
        stack
      };
    };

    try {
      const left = this._parsed[0];
      const operator = this._parsed[1];
      const right = this._parsed[2];
      stack.leftValue.raw = left.raw;
      stack.leftValue.type = left.type;
      stack.rightValue.raw = right.raw;
      stack.rightValue.type = right.type;
      stack.leftValue.ensured = this._ensureValue(left, context);
      stack.rightValue.ensured = this._ensureValue(right, context);
      stack.operator = operator.value;
      const operatorFn = this._operators[operator.value];
      if (typeof operatorFn !== 'function') throw new Error(`Attempt to eval with unknown operator: ${this._raw}`);
      const result = operatorFn(stack.leftValue.ensured, stack.rightValue.ensured);
      d('%s %s %s RESULT = %s\n    BY VALUES:\n      "%s" = %o\n      "%s" = %o', stack.leftValue.raw, stack.operator, stack.rightValue.raw, result, stack.leftValue.raw, stack.leftValue.ensured, stack.rightValue.raw, stack.rightValue.ensured);
      return complete(result);
    } catch (err) {
      dError('EVAL ERROR\n  raw = "%s"\n  context = %O\n  err = %O', this._raw, context, err);
      return fail(err.code || -1, err.stack);
    }
  }

  inspect() {
    return Object.assign({}, this);
  }

  _validateAndThrow() {
    if (this._parsed === null) {
      this._parse();
    }

    if (!this._parsed || !Array.isArray(this._parsed)) {
      throw new LiluExpressionError('Unknown error while parsing an expression.', this._raw);
    }

    const raw = this._raw;
    const parsed = this._parsed;

    const isLiteral = type => EXPRESSION_LITERAL_TYPES.indexOf(type) > -1;

    switch (true) {
      case parsed.length !== 3:
        throw new LiluExpressionError(`Expect 3 parts of expression, parsed: ${parsed.length}`, raw);

      case !isLiteral(parsed[0].type):
        throw new LiluExpressionError(`The first part of expression expected to be ${JSON.stringify(EXPRESSION_LITERAL_TYPES)} parsed as: ${parsed[0].type}`, raw);

      case parsed[1].type !== 'operator':
        throw new LiluExpressionError(`The second part of expression expected to be an operator, parsed as: ${parsed[1].type}.`, raw);

      case typeof this._operators[parsed[1].value] !== 'function':
        throw new LiluExpressionError(`The second part of expression is unknown operator: ${parsed[1].value}.`, raw);

      case !isLiteral(parsed[2].type):
        throw new LiluExpressionError(`The third part of expression expected to be ${JSON.stringify(EXPRESSION_LITERAL_TYPES)} parsed as: ${parsed[2].type}`, raw);

      default:
        return true;
    }
  }

  _parse() {
    const parsed = [];
    const variables = [];
    d('PARSE LINE = "%s"', this._raw);
    let matches;

    while ((matches = EXPRESSION_REG_EXP.exec(this._raw)) !== null) {
      const str = (matches[3] || matches[2] || matches[1] || 'null').trim();
      let parsedItem;

      if (!matches || !matches[0]) {
        parsedItem = {
          type: 'unknown',
          value: str,
          raw: str
        };
      } else {
        parsedItem = this._parseExpression(str);
      }

      d('CAST STR = "%s"\n    TYPE = %s\n    RESULT = %o', str, parsedItem.type, parsedItem.value);
      parsed.push(parsedItem);

      if (parsedItem.type === 'variable') {
        variables.push(parsedItem.value);
      } else if (parsedItem.type === 'expression') {
        variables.push(...this._extractEsprimaVariables(parsedItem.value));
      }
    }

    this._parsed = parsed;
    this._variables = variables;
  }

  _extractEsprimaVariables(expression) {
    const list = [];

    if (expression.type === 'Identifier') {
      list.push(expression.name);
    } else if (expression.type === 'BinaryExpression') {
      for (const el of [expression.left, expression.right]) {
        list.push(...this._extractEsprimaVariables(el));
      }
    } else if (expression.type === 'MemberExpression') {
      const objName = expression.object.name;
      const objProp = expression.property.name;
      list.push(`${objName}.${objProp}`);
    } else if (expression.type === 'ArrayExpression') {
      for (const el of expression.elements) {
        list.push(...this._extractEsprimaVariables(el));
      }
    }

    return list;
  }

  _parseExpression(str) {
    try {
      // Cast as operator
      if (this._operators[str]) {
        return {
          type: 'operator',
          value: str,
          raw: str
        };
      }

      const expr = esprima__default['default'].parseScript(str).body[0];

      if (expr.type !== 'ExpressionStatement') {
        throw new LiluExpressionError(`Unexpected esprima expression type ${expr.type}`);
      }

      const ast = expr.expression;
      let type;
      let value;

      switch (true) {
        // Cast as variable
        case ast.type === 'Identifier' || ast.type === 'MemberExpression':
          return {
            type: 'variable',
            value: str,
            raw: str
          };
        // Cast as literal

        case ast.type === 'Literal':
          value = evaluate__default['default'](ast, {});
          type = this._castType(value);
          if (type) return {
            type,
            value,
            raw: str
          };
          break;
        // Cast as expression

        case ast.type === 'ArrayExpression' || ast.type === 'BinaryExpression':
          return {
            type: 'expression',
            value: ast,
            raw: str
          };
      }
    } catch (err) {
      dError('CAST EXPRESSION: raw = "%s" err = %s', str, err.stack);
    }

    return {
      type: 'unknown',
      value: str,
      raw: str
    };
  }

  _castType(value) {
    const type = typeof value;

    switch (true) {
      case value === null:
        return 'null';

      case Array.isArray(value):
        return 'array';
    }

    switch (type) {
      case 'string':
        return 'string';

      case 'object':
        return 'object';

      case 'number':
        return 'number';

      case 'boolean':
        return 'boolean';

      default:
        return null;
    }
  }

  _ensureValue(item, context) {
    switch (item.type) {
      case 'variable':
        return get(context, item.value);

      case 'expression':
        return evaluate__default['default'](item.value, context || {});

      default:
        return item.value;
    }
  }

}

class Rule {
  constructor(options) {
    _defineProperty(this, "_title", void 0);

    _defineProperty(this, "_operation", void 0);

    _defineProperty(this, "_conditions", void 0);

    _defineProperty(this, "_conditionVariables", void 0);

    this._title = options.title || 'Untitled Rule';
    this._operation = options.operation || 'AND';
    this._conditions = (options.conditions || []).map(exprStr => {
      const exprOptions = {
        strict: options.strict || false,
        operators: options.operators || DEFAULT_OPERATORS
      };
      return new Expression(exprStr, exprOptions);
    });
    this._conditionVariables = uniq(flat(this._conditions.map(condition => condition.variables)));
  }

  get name() {
    return 'LiluRule';
  }

  get title() {
    return this._title;
  }

  get conditionVariables() {
    return [...this._conditionVariables];
  }

  get conditions() {
    return this._conditions;
  }

  get operation() {
    return this._operation;
  }

  match(context) {
    const trace = [];
    const tRoot = createTBag();
    const matchTimer = timer();

    const complete = result => {
      const ms = matchTimer.click();
      tRoot.w('%s (Rule) %s / %dms', result ? '✅' : '🔴', this._title, ms).w('• MATCHED = %o', result);
      return {
        result,
        trace,
        error: false,
        ms,
        __t: tRoot
      };
    };

    const fail = (errCode, errMsg) => {
      const ms = matchTimer.click();
      tRoot.w('❌ (Rule) %d / ms', ms).w('• title = %o', this._title).w('• err_code = %d', errCode).w('• err_msg =').w('    - %s', errMsg.replace(/\n/g, '\n    - '));
      return {
        error: true,
        errMsg,
        errCode,
        trace,
        ms,
        __t: tRoot
      };
    };

    let lastCondition = this._conditions[0];
    let isError = false;
    let lastErrCode = -1;
    let lastErrMsg = '';
    let isMatched;
    let n = 1;

    const conditionRun = condition => {
      if (isError) return false;
      lastCondition = condition;
      const tCond = tRoot.child();
      const r = condition.eval(context);
      trace.push({
        type: 'condition',
        item: condition.toJSON(),
        result: r
      });
      tCond.w('%s (Condition #%d)', r.error ? '❌' : r.result ? '✅' : '🔴', n++) // .table()
      // .row()
      // .cell(r.error ? 'ERROR' : r.result ? 'OK!' : 'INVALID')
      // .cell('Condition #%d', n++)
      // .cell('"%s" = "%o"',
      //   condition.raw,
      //   r.error ? `err: ${r.errCode}` : r.result)
      // .label('%s (Condition #%d) | "%s" = "%o"',
      //   r.error ? '❌' : r.result ? '👌' : '🔴', n++,
      //   condition.raw,
      //   r.error ? `err: ${r.errCode}` : r.result
      // )
      // .tableWrite()
      .table().label('"%s" = "%o"', condition.raw, r.error ? `err: ${r.errCode}` : r.result).row().cell('type').cell('value').cell('ensured') // .splitter()
      .row().cell('@%s', r.stack.leftValue.type).cell('"%s"', r.stack.leftValue.raw || '@missed_left').cell('= %o', r.stack.leftValue.ensured).row().cell('@%s', r.stack.rightValue.type).cell('"%s"', r.stack.rightValue.raw || '@missed_right').cell('= %o', r.stack.rightValue.ensured).tableWrite().w('');

      if (r.error) {
        tCond.w('• ERROR:').w('  • err_code = %d', r.errCode).w('  • err_msg = %s', r.errMsg);
      }

      if (r.error) {
        isError = true;
        lastErrCode = r.errCode || -1;
        lastErrMsg = r.errMsg || 'unknown error';
      }

      return !r.error && r.result == true;
    };

    if (this.operation === 'OR') {
      isMatched = this.conditions.some(conditionRun);
    } else {
      isMatched = this.conditions.every(conditionRun);
    }

    if (isError) {
      return fail(lastErrCode, `condition[${lastCondition.raw}].eval()\n${lastErrMsg || '@missed'}`);
    }

    return complete(isMatched);
  }

  toString() {
    const conditions = this._conditions.join('",\n    "');

    return `${this.name}(\n  title = "${this._title}"\n  conditions = [\n    "${conditions}"]\n)`;
  }

  toJSON() {
    return {
      name: this.name,
      title: this.title,
      operation: this.operation,
      conditions: this.conditions.map(v => v.raw)
    };
  }

  inspect() {
    return Object.assign({}, this);
  }

}

class Permission {
  constructor(options) {
    _defineProperty(this, "_title", void 0);

    _defineProperty(this, "_strict", void 0);

    _defineProperty(this, "_actions", void 0);

    _defineProperty(this, "_attributes", void 0);

    _defineProperty(this, "_rules", void 0);

    _defineProperty(this, "_ruleVariables", void 0);

    this._title = options.title || 'Untitled Permission';
    this._strict = options.strict || false;
    this._actions = obj__default['default'](options.actions || []);
    this._attributes = obj__default['default'](options.attributes || {});
    this._rules = (options.rules || []).map(opts => {
      const ruleOptions = _objectSpread2(_objectSpread2({}, opts), {}, {
        strict: options.strict || false,
        operators: options.operators || DEFAULT_OPERATORS
      });

      return new Rule(ruleOptions);
    });
    this._ruleVariables = uniq(flat(this._rules.map(rule => rule.conditionVariables)));
  }

  get name() {
    return 'LiluPermission';
  }

  get title() {
    return this._title;
  }

  get actions() {
    return obj__default['default'](this._actions);
  }

  get ruleVariables() {
    return obj__default['default'](this._ruleVariables);
  }

  get attributes() {
    return obj__default['default'](this._attributes);
  }

  check(context) {
    const tRoot = createTBag();
    const trace = [];
    const startTimer = timer();

    const complete = result => {
      const ms = startTimer.click();
      const symPrefix = result ? '✅' : '🔴';
      tRoot.w('%s (Permission) %s / %dms', symPrefix, this._title, ms).w('• PASSED = %o', result);
      return {
        error: false,
        result,
        ms,
        trace,
        __t: tRoot
      };
    };

    const fail = (errCode, errMsg) => {
      const ms = startTimer.click();
      tRoot.w('❌ (Permission) / %dms', ms).w('• title = %o', this.title).w('• err_code = %d', errCode).w('• err_msg = %s', errMsg).w('• context = %s', JSON.stringify(context, null, 2).replace(/\n/g, '\n  '));
      return {
        error: true,
        errCode,
        errMsg,
        ms,
        trace,
        __t: tRoot
      };
    };

    const missedContextKey = this._ruleVariables.find(keyPath => get(context, keyPath) === undefined);

    if (missedContextKey) {
      return fail(6, `missed context variable: ${missedContextKey}`);
    }

    for (const rule of this._rules) {
      let hasTraced = false;

      try {
        const r = rule.match(context);
        tRoot.attach(r.__t);
        trace.push({
          type: 'rule',
          item: rule.toJSON(),
          result: r
        });
        hasTraced = true;

        if (r.error) {
          return fail(r.errCode, `error while "${rule.title}" match.`);
        }

        if (!r.result) {
          return complete(false);
        }
      } catch (err) {
        if (!hasTraced) {
          trace.push({
            type: 'rule',
            item: rule.toJSON(),
            result: {
              error: true,
              errCode: -1,
              errMsg: err.message,
              ms: 0,
              trace: [],
              __t: createTBag()
            }
          });
        }

        return fail(-1, `critical error while match${rule.toString()}\n${err.stack}`);
      }
    }

    return complete(true);
  }

  toString() {
    const actions = this._actions.join('", "');

    const rules = this._rules.map(v => v.toString()).join('", "');

    return `${this.name}(\n  title = "${this._title}"\n  actions = ["${actions}"]\n rules =  ["${rules}"]\n)`;
  }

  toJSON() {
    return {
      name: this.name,
      title: this.title,
      actions: this.actions,
      attributes: this.attributes,
      rules: this._rules.map(v => v.toJSON())
    };
  }

  inspect() {
    return Object.assign({}, this);
  }

}

class LiluTimeoutError extends Error {
  constructor(message, code) {
    super(message);

    _defineProperty(this, "name", void 0);

    _defineProperty(this, "code", void 0);

    this.name = 'LiluTimeoutError';
    this.code = code || -1;
  }

  toString() {
    return `${this.name}(${this.code}, ${this.message})`;
  }

  toJSON() {
    return Object.assign({}, this, {
      message: this.message,
      code: this.code
    });
  }

  inspect() {
    return Object.assign(new Error(this.message), this);
  }

}

function promiseTimeout(promise, timeoutMillis, message) {
  let error = new LiluTimeoutError(message || 'Timeout error', 408);
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

class LiluGrantedError extends Error {
  constructor(code, message, trace, execStack, originErr) {
    super(message);

    _defineProperty(this, "name", void 0);

    _defineProperty(this, "code", void 0);

    _defineProperty(this, "trace", void 0);

    _defineProperty(this, "execStack", void 0);

    _defineProperty(this, "originErr", void 0);

    this.name = 'LiluGrantedError';
    this.code = code || -1;
    this.trace = trace || [];
    this.execStack = execStack || '';
    this.originErr = originErr || null;
  }

  get critical() {
    return this.code === -1;
  }

  toString() {
    const title = `${this.name}(code = ${this.code}, "${this.message}")`;
    const originErr = this.originErr && this.originErr.stack ? '  - Origin Error: ' + this.originErr.stack.replace(/\n/g, '\n    ') : '';
    const execStack = this.execStack ? '  - Exec Stack: ' + this.execStack.replace(/\n/g, '\n    ') : '';
    return [title, originErr, execStack].filter(v => v && v.length).join('\n');
  }

  toJSON() {
    return Object.assign({}, this, {
      message: this.message,
      code: this.code,
      critical: this.critical,
      originErr: this.originErr ? Object.assign({}, this.originErr) : null,
      trace: this.trace,
      execStack: this.execStack
    });
  }

  inspect() {
    return Object.assign(new Error(this.message), this);
  }

  static from(err, extendTrace, extendExecStack) {
    const errCode = err.code || -1;
    const errMsg = err.message || 'unknown error';
    const newErr = new LiluGrantedError(errCode, errMsg);

    if (err instanceof LiluGrantedError) {
      newErr.trace = [...(extendTrace || []), ...(err.trace || [])];

      if (extendExecStack) {
        const tRoot = createTBag().w(extendExecStack);

        if (err.execStack) {
          tRoot.child().w(err.execStack);
        }

        newErr.execStack = tRoot.collect();
      } else {
        newErr.execStack = err.execStack || '';
      }

      newErr.originErr = err.originErr || err;
    } else {
      newErr.trace = extendTrace || [];
      newErr.execStack = extendExecStack || '';
      newErr.originErr = err;
    }

    return newErr;
  }

}

const d$1 = debug__default['default']('lilu:permission');
class Lilu {
  constructor(options) {
    _defineProperty(this, "_strict", void 0);

    _defineProperty(this, "_timeout", void 0);

    _defineProperty(this, "_enviroment", void 0);

    _defineProperty(this, "_operators", void 0);

    _defineProperty(this, "_permissionsByActionMap", void 0);

    _defineProperty(this, "_permissions", void 0);

    options = options || {};
    this._strict = options.strict || false;
    this._timeout = options.timeout || false;
    this._enviroment = obj__default['default'](options.enviroment || {});
    this._operators = obj__default['default'](options.operators || DEFAULT_OPERATORS);

    if (Array.isArray(options.operators)) {
      this._operators = pick(DEFAULT_OPERATORS, this._operators);
    }

    this._permissionsByActionMap = new Map();
    this._permissions = (options.permissions || []).map(permissionOptions => {
      const opts = _objectSpread2(_objectSpread2({}, permissionOptions), {}, {
        operators: this._operators,
        strict: this._strict
      });

      const permission = new Permission(opts);

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
    let pattern = null;

    if (typeof value === 'string') {
      pattern = globToRegExp__default['default'](value, {
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

  granted(actionName, optionsOrContextOrCallback, cb) {
    let callback = cb;
    const options = {
      timeout: this._timeout || false,
      enviroment: this._enviroment || {},
      context: {}
    };

    if (typeof actionName !== 'string') {
      throw new TypeError('First argument "actionName" expected as String.');
    }

    if (typeof optionsOrContextOrCallback === 'function') {
      callback = optionsOrContextOrCallback;
    } else if (optionsOrContextOrCallback && optionsOrContextOrCallback.context) {
      Object.assign(options, optionsOrContextOrCallback);
    } else if (typeof optionsOrContextOrCallback === 'object') {
      options.context = optionsOrContextOrCallback;
    }

    const self = this;
    return promiseOrCallback(callback, function () {
      const cb = arguments[0];

      self._granted(actionName, options).then(cb.bind(null, null), cb);
    });
  }

  grantedMany(actions, optionsOrContextOrCallback, cb) {
    let callback = cb;
    const options = {
      timeout: this._timeout || false,
      enviroment: this._enviroment || {},
      context: {}
    };

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

    if (typeof optionsOrContextOrCallback === 'function') {
      callback = optionsOrContextOrCallback;
    } else if (optionsOrContextOrCallback && optionsOrContextOrCallback.context) {
      Object.assign(options, optionsOrContextOrCallback);
    } else if (typeof optionsOrContextOrCallback === 'object') {
      options.context = optionsOrContextOrCallback;
    }

    const self = this;
    return promiseOrCallback(callback, function () {
      const cb = arguments[0];

      self._grantedMany(actions, options).then(cb.bind(null, null), cb);
    });
  }

  grantedAny(actions, optionsOrContextOrCallback, cb) {
    let callback = cb;
    const options = {
      timeout: this._timeout || false,
      enviroment: this._enviroment || {},
      context: {}
    };

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

    if (typeof optionsOrContextOrCallback === 'function') {
      callback = optionsOrContextOrCallback;
    } else if (optionsOrContextOrCallback && optionsOrContextOrCallback.context) {
      Object.assign(options, optionsOrContextOrCallback);
    } else if (typeof optionsOrContextOrCallback === 'object') {
      options.context = optionsOrContextOrCallback;
    }

    const self = this;
    return promiseOrCallback(callback, function () {
      const cb = arguments[0];

      self._grantedAny(actions, options).then(cb.bind(null, null), cb);
    });
  }

  async _granted(actionName, options) {
    const {
      enviroment = this._enviroment,
      timeout = this._timeout,
      context = {}
    } = options;
    const errors = [];
    const mismatched = [];
    const trace = [];
    const tRoot = createTBag();
    let isTimeout = false;
    const startTimer = timer();
    const permissionsList = this._permissionsByActionMap.get(actionName) || [];

    const complete = permission => {
      const ms = startTimer.click();
      const passed = !!permission;
      return {
        passed,
        timeout: isTimeout,
        permission: permission ? permission.toJSON() : null,
        mismatched,
        errors,
        nErrors: errors.length,
        ms,
        trace: {
          toString: () => tRoot.collect(),
          toJSON: () => obj__default['default'](trace)
        },
        __t: tRoot
      };
    };

    const handlePermission = async (permission) => {
      const r = await this._checkPermission(permission, {
        timeout: typeof timeout === 'number' && timeout > 0 ? timeout - startTimer.click() : false,
        enviroment,
        context
      });
      tRoot.attach(r.__t).w('• CHECK ACTION = %s', actionName);
      trace.push({
        type: 'permission',
        item: permission.toJSON(),
        result: r
      });

      if (r.error) {
        errors.push({
          errCode: r.errCode || -1,
          errMsg: r.errMsg || 'unknown error'
        });
        return false;
      } else if (!r.result) {
        mismatched.push(permission.toJSON());
      }

      return !!r.result;
    };

    for (const permission of permissionsList) {
      let passed = false;

      try {
        passed = await handlePermission(permission);
      } catch (err) {
        err = LiluGrantedError.from(err, trace, tRoot.collect());
        errors.push({
          errCode: err.code,
          errMsg: err.message
        });
        throw err;
      }

      if (passed) {
        return complete(permission);
      }
    }

    return complete();
  }

  async _grantedMany(actions, options) {
    const {
      enviroment = this._enviroment,
      timeout = this._timeout,
      context = {}
    } = options;
    const trace = [];
    const tRoot = createTBag();
    const allow = [];
    const disallow = [];
    const matchedMap = new Map();
    const mismatchedMap = new Map();
    let errors = [];
    let unprocessedActions = [...actions];
    let isTimeout = false;
    const startTimer = timer();

    const done = () => {
      const ms = startTimer.click();
      const passed = actions.length === allow.length && !disallow.length;
      const symPrefix = errors.length ? '❌' : passed ? '✅' : '🔴';
      const matched = Array.from(matchedMap.keys());
      const mismatched = Array.from(mismatchedMap.keys());
      tRoot.w('%s (Granted Many) / %d ms', symPrefix, ms);

      if (errors.length) {
        tRoot.w('• ERRORS = %d', errors.length);
      }

      tRoot.w('• PASSED = %o', passed).w('• TIMEOUT = %o', isTimeout).w('• ALLOW = %s', allow.join('\n        - ') || 'N/A').w('• DISALLOW = %s', disallow.join('\n           - ') || 'N/A').w('• MATCHED = %s', matched.map(v => v.title).join('\n          - ') || 'N/A').w('• MISMATCHED = %s', mismatched.map(v => v.title).join('\n             - ') || 'N/A');
      return {
        actions: {
          allow,
          disallow
        },
        permissions: {
          matched: matched.map(v => v.toJSON()),
          mismatched: mismatched.map(v => v.toJSON())
        },
        passed: passed,
        timeout: isTimeout,
        errors,
        nErrors: errors.length,
        ms,
        trace: {
          toString: () => tRoot.collect(),
          toJSON: () => obj__default['default'](trace)
        },
        __t: tRoot
      };
    };

    const onError = err => {
      err = LiluGrantedError.from(err, trace, tRoot.collect());
      errors.push({
        errCode: err.code,
        errMsg: err.message
      }); // call to collect current state

      done();
      throw err;
    };

    const handlePermission = async (permission, targetAction) => {
      const r = await this._checkPermission(permission, {
        enviroment,
        context,
        timeout: typeof timeout === 'number' && timeout > 0 ? timeout - startTimer.click() : false
      });
      isTimeout = r.timeout;
      tRoot.attach(r.__t).w('• CHECK ACTION = %s', targetAction);
      trace.push({
        type: 'permission',
        item: permission.toJSON(),
        result: r
      });

      if (r.error) {
        errors.push({
          errCode: r.errCode || -1,
          errMsg: r.errMsg || 'unknown error'
        });
      }

      if (r.result) {
        matchedMap.set(permission, true);
        return true;
      }

      mismatchedMap.set(permission, true);
      return false;
    };

    while (unprocessedActions.length > 0 && !isTimeout) {
      const actionName = unprocessedActions.pop();
      if (!actionName) break;

      let permissions = this._permissionsByActionMap.get(actionName);

      if (!permissions || !permissions.length) {
        disallow.push(actionName);
        continue;
      } // Is already matched


      if (permissions.some(p => matchedMap.has(p))) {
        allow.push(actionName);
        continue;
      } // cut off mismatched


      permissions = permissions.filter(p => !mismatchedMap.has(p));

      if (!permissions.length) {
        disallow.push(actionName);
        continue;
      }

      for (const permission of permissions) {
        try {
          const passed = await handlePermission(permission, actionName);

          if (passed) {
            allow.push(actionName);
            break;
          } else {
            disallow.push(actionName);
          }
        } catch (err) {
          return onError(err);
        }
      }
    }

    return done();
  }

  async _grantedAny(actions, options) {
    const {
      enviroment = this._enviroment,
      timeout = this._timeout,
      context = {}
    } = options;
    const trace = [];
    const tRoot = createTBag();
    const mismatchedMap = new Map();
    let errors = [];
    let unprocessedActions = [...actions];
    let isTimeout = false;
    let passed = false;
    let lastCheckPermission = null;
    const startTimer = timer();

    const done = () => {
      const ms = startTimer.click();
      const symPrefix = errors.length ? '❌' : passed ? '✅' : '🔴';
      const allow = lastCheckPermission !== null ? lastCheckPermission.actions : [];
      const mismatched = Array.from(mismatchedMap.keys()).map(v => v.toJSON());
      tRoot.w('%s (Granted Any) / %d ms', symPrefix, ms);

      if (errors.length) {
        tRoot.w('• ERRORS = %d', errors.length);
      }

      tRoot.w('• TIMEOUT = %o', isTimeout).w('• ALLOW = %s', allow.join('\n        - ') || 'N/A').w('• MISMATCHED = %s', mismatched.map(v => v.title).join('\n             - ') || 'N/A');
      return {
        passed,
        timeout: isTimeout,
        mismatched,
        errors,
        nErrors: errors.length,
        permission: lastCheckPermission !== null ? lastCheckPermission.toJSON() : null,
        ms,
        trace: {
          toString: () => tRoot.collect(),
          toJSON: () => obj__default['default'](trace)
        },
        __t: tRoot
      };
    };

    const onError = err => {
      err = LiluGrantedError.from(err, trace, tRoot.collect());
      errors.push({
        errCode: err.code,
        errMsg: err.message
      }); // call to collect current state

      done();
      throw err;
    };

    const handlePermission = async permission => {
      const r = await this._checkPermission(permission, {
        enviroment,
        context,
        timeout: typeof timeout === 'number' && timeout > 0 ? timeout - startTimer.click() : false
      });
      isTimeout = r.timeout;
      tRoot.attach(r.__t);
      trace.push({
        type: 'permission',
        item: permission.toJSON(),
        result: r
      });

      if (r.error) {
        errors.push({
          errCode: r.errCode || -1,
          errMsg: r.errMsg || 'unknown error'
        });
      }

      if (r.result) {
        return true;
      }

      mismatchedMap.set(permission, true);
      return false;
    };

    while (unprocessedActions.length > 0 && !isTimeout && !passed) {
      const actionName = unprocessedActions.pop();
      if (!actionName) break;

      let permissions = this._permissionsByActionMap.get(actionName);

      if (!permissions || !permissions.length) {
        continue;
      } // cut off mismatched


      permissions = permissions.filter(p => !mismatchedMap.has(p));

      if (!permissions.length) {
        continue;
      }

      for (const permission of permissions) {
        try {
          passed = await handlePermission(permission);
          lastCheckPermission = permission;
        } catch (err) {
          return onError(err);
        }

        if (passed) return done();
      }
    }

    return done();
  }

  async _checkPermission(permission, options) {
    const {
      enviroment,
      timeout,
      context = {}
    } = options;
    const startTimer = timer();
    const wholeContext = obj__default['default'](context);
    let isVarsComputed = false;
    let tRoot = createTBag();
    let tEnv = createTBag(); // Compute enviroment variables

    const computePermissionVariables = async () => {
      for (const variableName of permission.ruleVariables) {
        const contextValue = get(wholeContext, variableName);

        if (contextValue !== undefined) {
          continue;
        }

        if (!isVarsComputed) {
          tEnv.w('• ENV COMPUTED:');
          isVarsComputed = true;
        }

        const ensureTimer = timer();
        let enviromentValue = get(enviroment, variableName);

        if (typeof enviromentValue === 'function') {
          try {
            enviromentValue = await enviromentValue.call(enviroment);
            tEnv.w('    - %s = @%s %o (%d ms)', variableName, typeof enviromentValue, enviromentValue, ensureTimer.click());
          } catch (err) {
            tEnv.w('    - %s = ❌ err:%s (%d ms)\n       - %s', variableName, err.message, ensureTimer.click(), err.stack.replace(/\n/g, '\n       - '));
            if (this._strict) throw err;
          }
        }

        if (enviromentValue !== undefined) {
          set(wholeContext, variableName, enviromentValue);
        }
      }
    };

    const handlePermission = async () => {
      await computePermissionVariables();
      const r = permission.check(wholeContext); // @ts-ignore

      tRoot = r.__t;
      return _objectSpread2(_objectSpread2({}, r), {}, {
        timeout: false
      });
    };

    let result;

    try {
      if (timeout) {
        const timeoutLeft = timeout - startTimer.click();
        result = await promiseTimeout(handlePermission(), timeoutLeft, 'timeout');
      } else {
        result = await handlePermission();
      }

      if (result.error && this._strict) {
        const trace = [{
          type: 'permission',
          item: permission.toJSON(),
          result
        }];
        throw new LiluGrantedError(result.errCode || -1, result.errMsg || 'unknown error', trace);
      }

      tRoot.merge(tEnv);
    } catch (err) {
      const errCode = err.code || -1;
      const errMsg = err.message;
      const isTimeoutError = err.name === 'LiluTimeoutError';
      const isCriticalError = !isTimeoutError && errCode === -1;

      if (isTimeoutError || isCriticalError) {
        tRoot.w(isTimeoutError ? '⏰ (Permission)' : '❌❌❌ (Permission)').w('• title = %s', permission.title).w('• err_code = %d', errCode).w('• err_msg = %s', errMsg).w('• context = %s', JSON.stringify(wholeContext, null, 2).replace(/\n/g, '\n  '));
      }

      tRoot.merge(tEnv);

      if (!isTimeoutError && this._strict || isCriticalError) {
        throw LiluGrantedError.from(err, [], tRoot.collect());
      } else {
        result = {
          trace: [],
          error: true,
          timeout: isTimeoutError,
          errCode,
          errMsg,
          ms: 0,
          __t: tRoot
        };
      }
    }

    result.ms = startTimer.click();
    return result;
  }

}

exports.Lilu = Lilu;
//# sourceMappingURL=lilu.cjs.js.map
