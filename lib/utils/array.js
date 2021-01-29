export function uniq(arr) {
  return [...new Set(arr)];
}

export function pull(items, valuesToRemove) {
  return items.filter(item => !valuesToRemove.includes(item));
}
