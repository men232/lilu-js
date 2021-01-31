import { Lilu, LiluOptions } from './lilu';

function liluFactory(options: Partial<LiluOptions>) {
  return new Lilu(options || {});
}

liluFactory.Lilu = Lilu;

export default liluFactory;
