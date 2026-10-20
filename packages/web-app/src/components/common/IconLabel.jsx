import PropTypes from 'prop-types';
import { Box } from '@mui/material';

const IconLabel = ({ icon = null, children, alignToFirstLine = false }) => (
  <Box
    component="span"
    sx={{
      display: 'inline-flex',
      alignItems: alignToFirstLine ? 'flex-start' : 'center',
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
          alignItems: 'center',
          flexShrink: 0,
          // Match one text line so the icon stays centered on that line.
          height: alignToFirstLine ? '1lh' : undefined,
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
  children: PropTypes.node.isRequired,
  alignToFirstLine: PropTypes.bool
};

export default IconLabel;
