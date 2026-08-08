import PropTypes from 'prop-types';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import countryType from '../../../types/country.type';

const CountryPropTypes = {
  canSubscribe: PropTypes.bool,
  country: countryType,
  error: PropTypes.shape({}),
  status: PropTypes.oneOf(Object.values(REDUCER_STATUS)),
  onRetry: PropTypes.func,
  onSubscribe: PropTypes.func.isRequired,
  onUnsubscribe: PropTypes.func.isRequired,
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string
    })
  ),
  regionsStatus: PropTypes.oneOf(Object.values(REDUCER_STATUS))
};

export default CountryPropTypes;
