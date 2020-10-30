import { LiluTimeoutError } from '../error';

export default function promiseTimeout(promise, timeoutMillis, message) {
  let error = new LiluTimeoutError(message || 'Timeout error');
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
