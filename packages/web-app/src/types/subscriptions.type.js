import { arrayOf, shape } from 'prop-types';
import countryType from './country.type';
import { MassifSimpleTypes } from './massif.type';
import regionType from './region.type';

const subscriptionsType = shape({
  countries: arrayOf(countryType),
  massifs: arrayOf(MassifSimpleTypes),
  regions: arrayOf(regionType)
});

export default subscriptionsType;
