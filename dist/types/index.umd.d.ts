import { Lilu, LiluOptions } from './lilu';
declare function liluFactory(options: Partial<LiluOptions>): Lilu;
declare namespace liluFactory {
    var Lilu: typeof import("./lilu").Lilu;
}
export default liluFactory;
