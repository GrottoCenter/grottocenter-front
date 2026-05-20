import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import CustomIcon from '../../components/common/CustomIcon';

const EntranceBadgeIcon = ({ badge }) => (
  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
    <CustomIcon type="entrance" size={35} />
    <Box
      sx={{
        position: 'absolute',
        top: -4,
        right: -4,
        fontSize: '14px',
        lineHeight: 1,
        bgcolor: 'background.paper',
        borderRadius: '2px'
      }}>
      {badge}
    </Box>
  </Box>
);

EntranceBadgeIcon.propTypes = {
  badge: PropTypes.node.isRequired
};

export default EntranceBadgeIcon;
