import PropTypes from 'prop-types';
import { Box } from '@mui/material';

const IconLabel = ({ icon = null, children }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.5,
      maxWidth: '100%',
      minWidth: 0,
      // Link decorations do not propagate through flex containers/items.
      textDecoration: 'inherit',
      whiteSpace: 'normal'
    }}>
    {icon && (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          flexShrink: 0,
          // The parent gap owns spacing, including for CustomIcon's own margin.
          '& > :first-child': { mr: 0 }
        }}>
        {icon}
      </Box>
    )}
    <Box component="span" sx={{ minWidth: 0, textDecoration: 'inherit' }}>
      {children}
    </Box>
  </Box>
);

IconLabel.propTypes = {
  icon: PropTypes.node,
  children: PropTypes.node.isRequired
};

export default IconLabel;
