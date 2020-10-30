import cloneDeep from 'clone-deep';

export { cloneDeep as clone };

export function isEmptyObject(obj) {
  return Object.keys(obj).length === 0;
}

export function set(obj, path, value) {
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

export function get(obj, path, defaultValue = undefined) {
  const travel = regexp =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);

  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);

  return result === undefined || result === obj ? defaultValue : result;
}

export function pick(obj, list) {
  const result = {};

  for(const key of list) {
    result[key] = get(obj, key);
  }

  return result;
}

export function defineGetter(obj, key, getterFn) {
  delete obj[key];

  Object.defineProperty(obj, key, {
    get: getterFn,
    enumerable: true,
    configurable: true
  });
}
