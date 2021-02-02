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

function set(obj, path, value) {
  if (Object(obj) !== obj) return obj;
  // If not yet an array, get the keys from the string-path
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || [];

  path.slice(0,-1).reduce((a, c, i) => // Iterate all of them except the last one
   Object(a[c]) === a[c] // Does the key exist and is its value an object?
       // Yes: then follow that path
       ? a[c]
       // No: create the key. Is the next key a potential array-index?
       : a[c] = Math.abs(path[i+1])>>0 === +path[i+1]
             ? [] // Yes: assign a new array object
             : {}, // No: assign a new plain object
   obj)[path[path.length-1]] = value; // Finally assign the value to the last key

  return obj; // Return the top-level object to allow chaining
}

function get(obj, path, defaultValue = undefined) {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);

  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);

  return result === undefined || result === obj ? defaultValue : result;
}

function pick(obj, list) {
  const result = {};

  for(const key of list) {
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

  return depth ? Array.prototype.reduce.call(arr, function(acc, cur) {
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
      switch(flag) {
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
      if(!escaped) {
        return arg;
      }
      args.unshift(arg);
      return match;
    });
  }

  if (args.length) {
    fmt += ' ' + args.join(' ');
  }

  // update escaped %% values
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

    const maxLabelLength = Math.max(
      ...rows
        .filter((v, idx) => !!MAP_IS_ROW_LABEL[idx])
        .map(row => Math.max(...row[0].map(v => v.length)))
    );

    const maxRowLength = MAX_LENGTH_PER_CELL.reduce((a, b) => a + b, 0);

    if (maxLabelLength > maxRowLength) {
      const avgDiff = Math.round((maxLabelLength - maxRowLength) / MAX_CELL_AMOUNT);
      MAX_LENGTH_PER_CELL = MAX_LENGTH_PER_CELL.map(v => v + avgDiff);
    }

    const start = '┌' + MAX_LENGTH_PER_CELL
      .map(len => ''.padStart(len + 2, '─'))
      .join(isLabelFirst ? '─' : '┬') + '┐\n';

    const end = '\n└' + MAX_LENGTH_PER_CELL
      .map(len => ''.padStart(len + 2, '─'))
      .join(isLabelLast ? '─' : '┴') + '┘';

    const result = ''
      + start
      + rows.map((row, rowIdx) => {
        const lines = [];
        const isLabel = !!MAP_IS_ROW_LABEL[rowIdx];
        const isNextLabel = !!MAP_IS_ROW_LABEL[rowIdx + 1];
        const isLastRow = rowIdx === (rows.length - 1);

        const rowSplitter = '\n├' + MAX_LENGTH_PER_CELL
          .map(len => ''.padStart(len + 2, '─'))
          .join(
            isLabel
              ? (isLastRow || isNextLabel ? '─' : '┬')
              : (isNextLabel ? '┴' : '┼')
          ) + '┤\n';

        const cellSplitter = isLabel
          ? '   '
          : ' │ ';

        for (let lineIdx = 0; lineIdx < MAX_LINES_PER_ROWS[rowIdx]; lineIdx++) {
          const cells = [];

          for (let cellIdx = 0; cellIdx < MAX_CELL_AMOUNT; cellIdx++) {
            const coll = row[cellIdx]
              ? (row[cellIdx][lineIdx] ? row[cellIdx][lineIdx] : '')
              : '';

            if (isLabel) {
              const maxLen = MAX_LENGTH_PER_CELL.reduce((a, b) => a + b + 2, 0);
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
      }).join('')
      + end
    ;

    return instance.w(result);
  }

  function createCell(rowIdx, fmt, ...args) {
    const row = rows[rowIdx];
    const lines = format(String(fmt), ...args).split('\n');
    const cellIdx = row.length;

    MAX_LENGTH_PER_CELL[cellIdx] = Math.max(
      MAX_LENGTH_PER_CELL[cellIdx] || 0,
      ...lines.map(v => v.length)
    );

    MAX_LINES_PER_ROWS[rowIdx] = Math.max(
      MAX_LINES_PER_ROWS[rowIdx] || 0,
      lines.length
    );

    MAX_CELL_AMOUNT = Math.max(MAX_CELL_AMOUNT, cellIdx + 1);
    row.push(lines);

    return {
      ...api,
      cell: createCell.bind(null, rowIdx)
    }
  }

  function createRow() {
    const row = [];
    const rowIdx = rows.push(row) - 1;

    return {
      ...api,
      cell: createCell.bind(null, rowIdx)
    }
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

const chr = function(s) {
  return s;
};

function createTBag() {
  const rootChilds = [];
  const lines = [];

  const collect = ({ lines, childs }, prefix = '') => {
    if (!lines || !lines.length && childs && childs.length) {
      lines = flat(childs.map(v => v.lines));
      childs = flat(childs.map(v => v.childs));

      return collect({ lines, childs }, prefix);
    }

    const splitter = prefix
      ? '\n' + prefix + (childs.length ? chr('│') : ' ') + ' '
      : '\n';

    return prefix
      + lines.join(splitter) + '\n'
      + childs.map(function(child, ix) {
        const last = ix === childs.length - 1;
        const more = child.childs && child.childs.length;
        const prefix_ = prefix + (last ? ' ' : chr('│')) + ' ';

        return prefix
          + (last ? chr('└') : chr('├')) + chr('─')
          + (more ? chr('┬') : chr('─')) + ' '
          + collect(child, prefix_).slice(prefix.length + 2)
          ;
      }).join('')
      ;
  };

  const rootCollect = () => collect({ lines, childs: rootChilds });

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
    attach(instance) {
      return this.child(instance);
    },
    child(instance) {
      instance = instance || createTBag();

      instance.isChild = true;
      instance.collect = this.isChild
        ? this.collect
        : rootCollect;

      rootChilds.push(instance);

      return instance;
    },
    childs: rootChilds,
    lines: lines,
    collect: rootCollect,
    str: () => collect({ lines, childs: rootChilds })
  }
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
    return fn(function(error) {
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
    fn(function(error, res) {
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
        if (!Array.isArray(leftValue))
            leftValue = [leftValue];
        if (!Array.isArray(rightValue))
            rightValue = [rightValue];
        return leftValue.some((value) => rightValue.indexOf(value) > -1);
    }
};

class LiluExpressionParserError extends Error {
    constructor(message, expressionText, code) {
        super(message);
        this.name = 'LiluExpressionParserError';
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
const dError = debug__default['default']('lilu:expression:error');
// eslint-disable-next-line no-useless-escape
const EXPRESSION_REG_EXP = /({{(.*?)}}|\[.*?]|".*?"|[^\s]+)/g;
class Expression {
    constructor(str, options) {
        options = options || {};
        this._raw = str;
        this._parsed = [];
        this._variables = [];
        this._strict = options.strict || false;
        this._operators = obj__default['default'](options.operators || DEFAULT_OPERATORS);
        this._parse();
        this.validate();
    }
    get name() {
        return 'LiLuExpression';
    }
    get strict() {
        return this._strict;
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
        }
        catch (_) {
            return false;
        }
    }
    validate() {
        if (this._parsed === null) {
            this._parse();
        }
        if (!this._parsed || !Array.isArray(this._parsed)) {
            throw new LiluExpressionParserError('Unknown error while parsing an expression.', this._raw);
        }
        const raw = this._raw;
        const parsed = this._parsed;
        switch (true) {
            case parsed.length !== 3:
                throw new LiluExpressionParserError(`Expect 3 parts of expression, parsed: ${parsed.length}`, raw);
            case parsed[0].type === 'operator':
                throw new LiluExpressionParserError('The first part of expression is operator.', raw);
            case parsed[0].type === 'unknown':
                throw new LiluExpressionParserError('The first part of expression is unknown.', raw);
            case parsed[1].type !== 'operator':
                throw new LiluExpressionParserError(`The second part of expression must be an operator, parsed: ${parsed[1].type}.`, raw);
            case typeof this._operators[parsed[1].value] !== 'function':
                throw new LiluExpressionParserError(`The second part operator has unknown, parsed: ${parsed[1].value}.`, raw);
            case parsed[2].type === 'unknown':
                throw new LiluExpressionParserError('The third part of expression is unknown.', raw);
            case parsed[2].type === 'operator':
                throw new LiluExpressionParserError('The third part of expression is operator.', raw);
            default:
                return true;
        }
    }
    toString() {
        return `${this.name}(${this._raw}): VALID = ${this.isValid} VARS = ${this._variables.join(', ')}`;
    }
    toJSON() {
        return {
            name: this.name,
            strict: this.strict,
            str: this.raw,
            variables: this.variables,
            operators: Object.keys(this._operators),
            isValid: this.isValid,
        };
    }
    eval(context) {
        context = context || {};
        const stack = {
            operator: null,
            leftValue: { raw: null, ensured: null, type: 'unknown' },
            rightValue: { raw: null, ensured: null, type: 'unknown' },
        };
        const complete = (result) => {
            return {
                error: false,
                result,
                stack,
            };
        };
        const fail = (errCode, errMsg) => {
            return {
                error: true,
                errMsg,
                errCode,
                stack,
            };
        };
        // if (this._strict) {
        //   const missedContextKey = this._variables.find(
        //     (keyPath) => obj.get(context, keyPath) === undefined,
        //   );
        //
        //   if (missedContextKey) {
        //     return fail(-1, `missed context variable: ${missedContextKey}`);
        //   }
        // }
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
            if (typeof operatorFn !== 'function')
                throw new LiluExpressionEvalError(`Attempt to eval with unknown operator: ${operator.value}`, this._raw, context, 2);
            const result = operatorFn(stack.leftValue.ensured, stack.rightValue.ensured);
            d('%s %s %s RESULT = %s\n    BY VALUES:\n      "%s" = %o\n      "%s" = %o', stack.leftValue.raw, stack.operator, stack.rightValue.raw, result, stack.leftValue.raw, stack.leftValue.ensured, stack.rightValue.raw, stack.rightValue.ensured);
            return complete(result);
        }
        catch (err) {
            dError('EVAL ERROR\n  raw = "%s"\n  context = %O\n  err = %O', this._raw, context, err);
            return fail(err.code || -1, err.stack);
        }
    }
    inspect() {
        return Object.assign({}, this);
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
                parsedItem = { type: 'unknown', value: str, raw: str };
            }
            else {
                parsedItem = this._parseExpression(str);
            }
            d('CAST STR = "%s"\n    TYPE = %s\n    RESULT = %o', str, parsedItem.type, parsedItem.value);
            parsed.push(parsedItem);
            if (parsedItem.type === 'variable') {
                variables.push(parsedItem.value);
            }
            else if (parsedItem.type === 'expression') {
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
        }
        else if (expression.type === 'BinaryExpression') {
            for (const el of [expression.left, expression.right]) {
                list.push(...this._extractEsprimaVariables(el));
            }
        }
        else if (expression.type === 'MemberExpression') {
            const objName = expression.object.name;
            const objProp = expression.property.name;
            list.push(`${objName}.${objProp}`);
        }
        else if (expression.type === 'ArrayExpression') {
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
                return { type: 'operator', value: str, raw: str };
            }
            const expr = esprima__default['default'].parseScript(str).body[0];
            if (expr.type !== 'ExpressionStatement') {
                throw new LiluExpressionParserError(`Unexpected esprima expression type ${expr.type}`);
            }
            const ast = expr.expression;
            let type;
            let value;
            switch (true) {
                // Cast as variable
                case ast.type === 'Identifier' || ast.type === 'MemberExpression':
                    return { type: 'variable', value: str, raw: str };
                // Cast as literal
                case ast.type === 'Literal':
                    value = evaluate__default['default'](ast, {});
                    type = this._castType(value);
                    if (type)
                        return { type, value, raw: str };
                    break;
                // Cast as expression
                case ast.type === 'ArrayExpression' || ast.type === 'BinaryExpression':
                    return { type: 'expression', value: ast, raw: str };
            }
        }
        catch (err) {
            dError('CAST EXPRESSION: raw = "%s" err = %s', str, err.stack);
        }
        return { type: 'unknown', value: str, raw: str };
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
        this._title = options.title || 'Untitled Rule';
        this._operation = options.operation || 'AND';
        this._conditions = (options.conditions || []).map((exprStr) => {
            const exprOptions = {
                strict: options.strict || false,
                operators: options.operators || DEFAULT_OPERATORS,
            };
            exprOptions.strict = options.strict || false;
            exprOptions.operators = options.operators || DEFAULT_OPERATORS;
            return new Expression(exprStr, exprOptions);
        });
        this._conditionVariables = uniq(flat(this._conditions.map((condition) => condition.variables)));
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
        const complete = (result) => {
            const ms = matchTimer.click();
            tRoot
                .w('%s (Rule) %s / %dms', result ? '✅' : '🔴', this._title, ms)
                .w('• MATCHED = %o', result);
            return {
                result,
                trace,
                error: false,
                ms,
                __t: tRoot,
            };
        };
        const fail = (errCode, errMsg) => {
            const ms = matchTimer.click();
            tRoot
                .w('❌ (Rule) %d / ms', ms)
                .w('• title = %o', this._title)
                .w('• err_code = %d', errCode)
                .w('• err_msg =')
                .w('    - %s', errMsg.replace(/\n/g, '\n    - '));
            return {
                error: true,
                errMsg,
                errCode,
                trace,
                ms,
                __t: tRoot,
            };
        };
        let lastCondition = this._conditions[0];
        let isError = false;
        let lastErrCode = -1;
        let lastErrMsg = '';
        let isMatched;
        let n = 1;
        const conditionRun = (condition) => {
            if (isError)
                return false;
            lastCondition = condition;
            const tCond = tRoot.child();
            const r = condition.eval(context);
            trace.push({
                type: 'condition',
                item: condition.toJSON(),
                result: r,
            });
            tCond
                .w('%s (Condition #%d)', r.error ? '❌' : r.result ? '✅' : '🔴', n++)
                .child()
                .table()
                .label('"%s" = "%o"', condition.raw, r.error
                ? `err: ${r.errCode}`
                : r.result)
                .row()
                .cell('type')
                .cell('value')
                .cell('ensured')
                // .splitter()
                .row()
                .cell('@%s', r.stack.leftValue.type)
                .cell('"%s"', r.stack.leftValue.raw || '@missed_left')
                .cell('= "%o"', r.stack.leftValue.ensured)
                .row()
                .cell('@%s', r.stack.rightValue.type)
                .cell('"%s"', r.stack.rightValue.raw || '@missed_right')
                .cell('= "%o"', r.stack.rightValue.ensured)
                .tableWrite()
                .w('');
            if (r.error) {
                tCond
                    .w('• ERROR:')
                    .w('  • err_code = %d', r.errCode)
                    .w('  • err_msg = %s', r.errMsg);
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
        }
        else {
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
            conditions: this.conditions.map((v) => v.raw),
        };
    }
    inspect() {
        return Object.assign({}, this);
    }
}

class Permission {
    constructor(options) {
        this._title = options.title || 'Untitled Permission';
        this._strict = options.strict || false;
        this._actions = obj__default['default'](options.actions || []);
        this._attributes = obj__default['default'](options.attributes || {});
        this._rules = (options.rules || []).map((opts) => {
            const ruleOptions = Object.assign(Object.assign({}, opts), { strict: options.strict || false, operators: options.operators || DEFAULT_OPERATORS });
            return new Rule(ruleOptions);
        });
        this._ruleVariables = uniq(flat(this._rules.map((rule) => rule.conditionVariables)));
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
        const complete = (result) => {
            const ms = startTimer.click();
            const symPrefix = result ? '✅' : '🔴';
            tRoot
                .w('%s (Permission) %s / %dms', symPrefix, this._title, ms)
                .w('• PASSED = %o', result);
            return {
                error: false,
                result,
                ms,
                trace,
                __t: tRoot,
            };
        };
        const fail = (errCode, errMsg) => {
            const ms = startTimer.click();
            tRoot
                .w('❌ (Permission) / %dms', ms)
                .w('• title = %o', this.title)
                .w('• err_code = %d', errCode)
                .w('• err_msg = %s', errMsg)
                .w('• context = %s', JSON.stringify(context, null, 2).replace(/\n/g, '\n  '));
            return {
                error: true,
                errCode,
                errMsg,
                ms,
                trace,
                __t: tRoot,
            };
        };
        if (this._strict) {
            const missedContextKey = this._ruleVariables.find((keyPath) => get(context, keyPath) === undefined);
            if (missedContextKey) {
                return fail(6, `missed context variable: ${missedContextKey}`);
            }
        }
        for (const rule of this._rules) {
            let hasTraced = false;
            try {
                const r = rule.match(context);
                tRoot.attach(r.__t);
                trace.push({
                    type: 'rule',
                    item: rule.toJSON(),
                    result: r,
                });
                hasTraced = true;
                if (r.error) {
                    return fail(r.errCode, `error while "${rule.title}" match.`);
                }
                if (!r.result) {
                    return complete(false);
                }
            }
            catch (err) {
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
                            __t: createTBag(),
                        },
                    });
                }
                return fail(-1, `critical error while match${rule.toString()}\n${err.stack}`);
            }
        }
        return complete(true);
    }
    toString() {
        const actions = this._actions.join('", "');
        const rules = this._rules.map((v) => v.toString()).join('", "');
        return `${this.name}(\n  title = "${this._title}"\n  actions = ["${actions}"]\n rules =  ["${rules}"]\n)`;
    }
    toJSON() {
        return {
            name: this.name,
            title: this.title,
            actions: this.actions,
            attributes: this.attributes,
            rules: this._rules.map((v) => v.toJSON()),
        };
    }
    inspect() {
        return Object.assign({}, this);
    }
}

class LiluTimeoutError extends Error {
    constructor(message, code) {
        super(message);
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
  let error = new LiluTimeoutError(message || 'Timeout error', 7);
  let timeout;

  return Promise.race([
    promise,
    new Promise(function(resolve, reject) {
      timeout = setTimeout(function() {
        reject(error);
      }, timeoutMillis);
    }),
  ]).then(function(v) {
    clearTimeout(timeout);
    return v;
  }, function(err) {
    clearTimeout(timeout);
    throw err;
  });
}

class LiluGrantedError extends Error {
    constructor(message, code, trace, execStack, originErr) {
        super(message);
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
        return `${this.name}(${this.code}, ${this.message})\n${this.originErr ? `- Origin Error: ${this.originErr.stack}\n` : ''}- Exec Stack:\n${this.execStack || '_empty_'}`;
    }
    toJSON() {
        return Object.assign({}, this, {
            message: this.message,
            code: this.code,
            critical: this.critical,
            originErr: this.originErr ? Object.assign({}, this.originErr) : null,
            trace: this.trace,
            execStack: this.execStack,
        });
    }
    inspect() {
        return Object.assign(new Error(this.message), this);
    }
}

const d$1 = debug__default['default']('lilu:permission');
class Lilu {
    constructor(options) {
        options = options || {};
        this._strict = options.strict || false;
        this._timeout = options.timeout || false;
        this._enviroment = obj__default['default'](options.enviroment || {});
        this._operators = obj__default['default'](options.operators || DEFAULT_OPERATORS);
        if (Array.isArray(options.operators)) {
            this._operators = pick(DEFAULT_OPERATORS, this._operators);
        }
        this._permissionsByActionMap = new Map();
        this._permissions = (options.permissions || []).map((permissionOptions) => {
            const opts = Object.assign(Object.assign({}, permissionOptions), { operators: this._operators, strict: this._strict });
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
            pattern = globToRegExp__default['default'](value, { extended: true });
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
            context: {},
        };
        if (typeof actionName !== 'string') {
            throw new TypeError('First argument "actionName" expected as String.');
        }
        if (typeof optionsOrContextOrCallback === 'function') {
            callback = optionsOrContextOrCallback;
        }
        else if (optionsOrContextOrCallback &&
            optionsOrContextOrCallback.context) {
            Object.assign(options, optionsOrContextOrCallback);
        }
        else if (typeof optionsOrContextOrCallback === 'object') {
            options.context = optionsOrContextOrCallback;
        }
        const self = this;
        return promiseOrCallback(callback, function () {
            const cb = arguments[0];
            self._granted(actionName, options).then(cb.bind(null, null), cb);
        });
    }
    async _granted(actionName, options) {
        const { enviroment = this._enviroment, timeout = this._timeout, context = {}, } = options;
        const errors = [];
        const mismatched = [];
        const trace = [];
        const tRoot = createTBag();
        const tChild = tRoot.child();
        let isTimeout = false;
        const startTimer = timer();
        const permissionsList = this._permissionsByActionMap.get(actionName) || [];
        const complete = (permission) => {
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
                    toJSON: () => obj__default['default'](trace),
                },
                __t: tRoot,
            };
        };
        const wholeContext = obj__default['default'](context);
        const ensurePermissionVariables = async (permission) => {
            for (const variableName of permission.ruleVariables) {
                const contextValue = get(wholeContext, variableName);
                if (contextValue !== undefined) {
                    continue;
                }
                let enviromentValue = get(enviroment, variableName);
                if (typeof enviromentValue === 'function') {
                    try {
                        enviromentValue = await enviromentValue.call(enviroment);
                    }
                    catch (err) {
                        enviromentValue = err;
                        // TO-DO: Log error into tbag
                    }
                }
                if (enviromentValue !== undefined) {
                    set(wholeContext, variableName, enviromentValue);
                }
            }
        };
        const handlePermission = async (permission) => {
            await ensurePermissionVariables(permission);
            const r = permission.check(wholeContext);
            tRoot
                .attach(r.__t)
                .w('• ACTION = %s', actionName);
            trace.push({
                type: 'permission',
                item: permission.toJSON(),
                result: r,
            });
            if (r.error) {
                errors.push({
                    errCode: r.errCode || -1,
                    errMsg: r.errMsg || 'unknown error',
                });
                return false;
            }
            else if (!r.result) {
                mismatched.push(permission.toJSON());
            }
            return !!r.result;
        };
        for (const permission of permissionsList) {
            let passed = false;
            try {
                if (timeout) {
                    const timeoutLeft = timeout - startTimer.click();
                    passed = await promiseTimeout(handlePermission(permission), timeoutLeft, `timeout - ${permission.title}`);
                }
                else {
                    passed = await handlePermission(permission);
                }
            }
            catch (err) {
                const errCode = err.code || -1;
                const errMsg = err.message;
                const isTimeoutError = err.name === 'LiluTimeoutError';
                const isCriticalError = !isTimeoutError && errCode === -1;
                if (isTimeoutError)
                    isTimeout = true;
                tChild
                    .w(isTimeoutError ? '⏰ (Permission)' : '❌❌❌ (Permission)')
                    .w('• title = %s', permission.title)
                    .w('• err_code = %d', errCode)
                    .w('• err_msg = %s', errMsg)
                    .w('• context = %s', JSON.stringify(wholeContext, null, 2).replace(/\n/g, '\n  '));
                if (isCriticalError) {
                    throw new LiluGrantedError(errCode, errMsg, trace, tRoot.collect(), err);
                }
                errors.push({ errCode, errMsg });
            }
            if (passed) {
                return complete(permission);
            }
        }
        return complete();
    }
}

exports.Lilu = Lilu;
//# sourceMappingURL=lilu.cjs.js.map
