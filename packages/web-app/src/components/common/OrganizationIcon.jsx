import PropTypes from 'prop-types';
import { getOrganizationIconType } from '@/utils/organizationIcons';
import CustomIcon from './CustomIcon';

// Names/labels next to the pictogram already identify the organization or type.
// Keep this decoration out of option/button accessible names.
const OrganizationIcon = ({ organizationType = null, size = 35 }) => (
  <CustomIcon
    type={getOrganizationIconType(organizationType)}
    size={size}
    alt=""
  />
);

OrganizationIcon.propTypes = {
  organizationType: PropTypes.string,
  size: PropTypes.number
};

export default OrganizationIcon;
