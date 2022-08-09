import { number, string, shape } from 'prop-types';

const idNameType = shape({
  id: number.isRequired,
  name: string.isRequired
});

const idNameTypeExtended = otherProps =>
  shape({
    idNameType,
    ...otherProps
  });

export default idNameType;
export { idNameTypeExtended };
