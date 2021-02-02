import * as array from './array';
import format from './format';
import textTable from './text-table';

const chr = function(s) {
  return s;
};

export default function createTBag() {
  const rootChilds = [];
  const lines = [];

  const collect = ({ lines, childs }, prefix = '') => {
    if (!lines || !lines.length && childs && childs.length) {
      lines = array.flat(childs.map(v => v.lines));
      childs = array.flat(childs.map(v => v.childs));

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
