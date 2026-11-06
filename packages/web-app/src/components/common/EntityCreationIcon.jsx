import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CustomIcon from './CustomIcon';

const EntityCreationIcon = ({
  iconType,
  size = 35,
  BadgeIcon = AddCircleIcon
}) => (
  <Box
    sx={{
      position: 'relative',
      display: 'inline-flex',
      flexShrink: 0,
      width: size,
      height: size,
      // The frame owns the badge position; CustomIcon's trailing margin must
      // not widen it and push the badge away from the card's corner.
      '& > span': { m: 0 }
    }}>
    <CustomIcon type={iconType} size={size} />
    <BadgeIcon
      sx={theme => ({
        position: 'absolute',
        top: theme.spacing(-0.5),
        right: theme.spacing(-0.5),
        fontSize: 16,
        color: 'secondary.main',
        bgcolor: 'background.paper',
        borderRadius: '50%',
        // The badge pins its own colour, so MUI's disabled text colour never
        // reaches it either. Sibling of CustomIcon's own rule, not a parent of
        // it, so the two can't compound into a double-faded icon.
        //
        // Dimmed by COLOUR only — never `opacity`. The badge sits on top of the
        // entity icon and relies on its own opaque disc to mask it; fading that
        // disc lets the icon show straight through the badge, which is exactly
        // what it exists to prevent. The glyph colour alone carries "disabled".
        '.Mui-disabled &': {
          color: theme.palette.action.disabled
        }
      })}
    />
  </Box>
);

EntityCreationIcon.propTypes = {
  BadgeIcon: PropTypes.elementType,
  iconType: PropTypes.string.isRequired,
  size: PropTypes.number
};

export default EntityCreationIcon;
