import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { useIntl } from 'react-intl';

import CustomIcon from '../../common/CustomIcon';
import AppLink from '../../common/AppLink';

// Compact subject line: which entrance the operation is about, as a link back to
// its page. The page title already carries the action verb, so no extra label.
const Header = ({ entrance }) => {
  const { formatMessage } = useIntl();
  return (
    <AppLink
      to={`/ui/entrances/${entrance.id}`}
      title={formatMessage(
        { id: 'Move entrance: {name}' },
        { name: entrance.name }
      )}>
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        <CustomIcon type="entrance" size={18} />
        <Typography variant="body1">{entrance.name}</Typography>
      </Box>
    </AppLink>
  );
};

Header.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired
};

export default Header;
