import { number, string, shape } from 'prop-types';

const authorType = shape({
  id: number.isRequired,
  nickname: string.isRequired
});

export default authorType;
