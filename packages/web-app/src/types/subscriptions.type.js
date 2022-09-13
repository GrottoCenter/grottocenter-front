import { arrayOf, shape } from 'prop-types';
import countryType from './country.type';
import massifType from './massif.type';

const subscriptionsType = shape({
  countries: arrayOf(countryType),
  massifs: arrayOf(massifType)
});

export default subscriptionsType;
