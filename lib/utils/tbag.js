import * as array from './array';
import format from './format';

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

    const splitter = '\n' + prefix + (childs.length ? chr('│') : ' ') + ' ';

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
