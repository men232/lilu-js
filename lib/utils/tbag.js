import format from './format';

export default function createTBag() {
  const rootChilds = [];
  const lines = [];

  const collect = ({ lines, childs }, pad = 0) => {
    if (!lines.length && !childs.length) {
      return '';
    }

    const p = ''.padStart(pad, ' ');

    let result = '\n' + p + lines.join('\n' + p);

    for(const item of childs) {
      result += '\n' + ''.padStart(pad) + '  ' + collect(item, pad + 2);
    }

    return result.trim();
  };

  const rootCollect = () => collect({ lines, childs: rootChilds });

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
