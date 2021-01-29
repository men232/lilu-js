export type OperatorHandler = (left: any, right: any) => boolean

export interface OperatorMap {
  [key: string]: OperatorHandler
}

export const DEFAULT_OPERATORS: OperatorMap = {
  '>': (leftValue: any, rightValue: any) => {
    return leftValue > rightValue;
  },

  '>=': (leftValue: any, rightValue: any) => {
    return leftValue > rightValue;
  },

  '<': (leftValue: any, rightValue: any) => {
    return leftValue < rightValue;
  },

  '<=': (leftValue: any, rightValue: any) => {
    return leftValue <= rightValue;
  },

  '==': (leftValue: any, rightValue: any) => {
    return leftValue === rightValue;
  },

  '!=': (leftValue: any, rightValue: any) => {
    return leftValue !== rightValue;
  },

  'in': (leftValue: any, rightValue: any) => {
    if (!Array.isArray(leftValue)) leftValue = [leftValue];
    if (!Array.isArray(rightValue)) rightValue = [rightValue];

    return leftValue.some((value: any) => rightValue.indexOf(value) > -1);
  }
};
