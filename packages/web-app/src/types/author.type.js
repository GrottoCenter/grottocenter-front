import { number, string, shape } from 'prop-types';

const authorType = shape({
  id: number.isRequired,
  nickname: string.isRequired,
  name: string,
  surname: string
});

export default authorType;
