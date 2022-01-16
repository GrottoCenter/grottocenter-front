import { isNil } from 'ramda';

const shouldLineRender = (isCollection, value1, value2) => {
  if (isCollection) {
    const checkValue = val => !isNil(val) && val.length !== 0;
    return checkValue(value1) || checkValue(value2);
  }
  return !(isNil(value1) && isNil(value2));
};

export default shouldLineRender;
