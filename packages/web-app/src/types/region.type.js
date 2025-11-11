import { string, shape } from 'prop-types';

const regionType = shape({
  id: string.isRequired,
  name: string
});

export default regionType;