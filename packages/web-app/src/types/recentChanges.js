import PropTypes from 'prop-types';

export const RecentChangesFiltersPropTypes = PropTypes.shape({
  countryId: PropTypes.string,
  regionId: PropTypes.string,
  massifId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  organizationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
});
