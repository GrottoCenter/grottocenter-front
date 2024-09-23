import { string, shape } from 'prop-types';

const countryType = shape({
  id: string.isRequired,
  name: string.isRequired
});

export default countryType;
