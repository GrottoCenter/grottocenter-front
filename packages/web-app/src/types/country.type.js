import { string, shape } from 'prop-types';

const countryType = shape({
  id: string.isRequired,
  iso3: string.isRequired,
  nativeName: string.isRequired
});

export default countryType;
