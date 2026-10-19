import PropTypes from 'prop-types';

// Read payloads may contain a future API type or omit it on a deleted reference.
// Only the forms restrict writes to the currently supported vocabulary.
export const organizationTypePropType = PropTypes.string;

export const OrganizationSimplePropTypes = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  name: PropTypes.string,
  language: PropTypes.string,
  type: organizationTypePropType,
  isDeleted: PropTypes.bool,
  redirectTo: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
});
