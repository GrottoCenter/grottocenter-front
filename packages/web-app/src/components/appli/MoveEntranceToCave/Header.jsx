import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

import CustomIcon from '../../common/CustomIcon';
import GCLink from '../../common/GCLink';

// Compact subject line: which entrance the operation is about, as a link back to
// its page. The page title already carries the action verb, so no extra label.
const Header = ({ entrance }) => (
  <GCLink href={`/ui/entrances/${entrance.id}`} internal>
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
      <CustomIcon type="entrance" size={18} />
      <Typography variant="body1">{entrance.name}</Typography>
    </Box>
  </GCLink>
);

Header.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired
};

export default Header;
