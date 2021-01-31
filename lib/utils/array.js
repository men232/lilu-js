export function uniq(arr) {
  return [...new Set(arr)];
}

export function pull(items, valuesToRemove) {
  return items.filter(item => !valuesToRemove.includes(item));
}

export function flat(arr, depth) {
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
