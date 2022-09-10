import PropTypes from 'prop-types';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import countryType from '../../../types/country.type';

const CountryPropTypes = {
  country: countryType,
  error: PropTypes.shape({}),
  isLoading: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(REDUCER_STATUS)),
  onSubscribe: PropTypes.func.isRequired,
  onUnsubscribe: PropTypes.func.isRequired
};

export default CountryPropTypes;
