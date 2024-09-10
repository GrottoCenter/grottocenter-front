import { arrayOf, shape } from 'prop-types';
import countryType from './country.type';
import { MassifSimpleTypes } from './massif.type';

const subscriptionsType = shape({
  countries: arrayOf(countryType),
  massifs: arrayOf(MassifSimpleTypes)
});

export default subscriptionsType;
