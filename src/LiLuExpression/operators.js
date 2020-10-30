export default {
  '>': (leftValue, rightValue) => {
    return leftValue > rightValue;
  },

  '>=': (leftValue, rightValue) => {
    return leftValue > rightValue;
  },

  '<': (leftValue, rightValue) => {
    return leftValue < rightValue;
  },

  '<=': (leftValue, rightValue) => {
    return leftValue <= rightValue;
  },

  '==': (leftValue, rightValue) => {
    return leftValue === rightValue;
  },

  '!=': (leftValue, rightValue) => {
    return leftValue !== rightValue;
  },

  'in': (leftValue, rightValue) => {
    if (!Array.isArray(leftValue)) leftValue = [leftValue];
    if (!Array.isArray(rightValue)) rightValue = [rightValue];

    return leftValue.some(value => rightValue.indexOf(value) > -1);
  }
};
