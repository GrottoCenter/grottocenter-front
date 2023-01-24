import { shape, string, number, bool } from 'prop-types';

const license = shape({
  id: number,
  isCopyrighted: bool,
  name: string,
  text: string,
  url: string
});

export default license;
