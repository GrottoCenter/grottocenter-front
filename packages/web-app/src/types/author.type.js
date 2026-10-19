import { number, string, shape } from 'prop-types';

const authorType = shape({
  id: number.isRequired,
  nickname: string.isRequired,
  name: string,
  surname: string,
  type: string
});

export default authorType;
