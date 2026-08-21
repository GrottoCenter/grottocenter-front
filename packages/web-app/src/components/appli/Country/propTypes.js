import PropTypes from 'prop-types';
import countryType from '../../../types/country.type';

const CountryPropTypes = {
  canSubscribe: PropTypes.bool,
  country: countryType,
  error: PropTypes.shape({}),
  isPaused: PropTypes.bool,
  isFetching: PropTypes.bool,
  onRetry: PropTypes.func,
  onSubscribe: PropTypes.func.isRequired,
  onUnsubscribe: PropTypes.func.isRequired,
  regions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string
    })
  )
};

export default CountryPropTypes;
