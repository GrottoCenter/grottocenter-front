import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import IconLabel from './IconLabel';
import RoleIcon from './RoleIcon';

const RoleLabel = ({ roleName }) => {
  const { formatMessage } = useIntl();

  return (
    <IconLabel icon={<RoleIcon roleName={roleName} />}>
      {formatMessage({ id: roleName, defaultMessage: roleName })}
    </IconLabel>
  );
};

RoleLabel.propTypes = {
  roleName: PropTypes.string.isRequired
};

export default RoleLabel;
