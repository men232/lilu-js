import { Lilu } from './index';

function liluFactory(...args) {
  return new Lilu(...args);
}

liluFactory.Instance = Lilu;

export default liluFactory;
