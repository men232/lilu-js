export declare type OperatorHandler = (left: any, right: any) => boolean;
export interface OperatorMap {
    [key: string]: OperatorHandler;
}
export declare const DEFAULT_OPERATORS: OperatorMap;
