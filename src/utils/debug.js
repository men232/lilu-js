import debug from 'debug';
import format from './format';

export default function debugFactory(namespace) {
  const d = debug(namespace);

  return (...args) => {
      d(...args);

      if (typeof args[0] === 'string') {
        args[0] = args[0].replace(/%o|%O/g, '%j');
        return format(...args);
      }

      return null;
  };
}
