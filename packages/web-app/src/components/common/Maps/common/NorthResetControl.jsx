import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { IconButton, Tooltip, useTheme } from '@mui/material';
import CustomControl from './CustomControl';
import CompassNeedle from './CompassNeedle';
import useMapOverlayContainer from './useMapOverlayContainer';

// Floating north button, rendered by LocationControl (the sole source of map
// rotation). Shown whenever the map is left rotated: either actively, while
// heading-up compass follow rotates it (tap exits compass), or frozen after a
// drag detached tracking from compass mode (tap just straightens the map).
//
// Round and in the top-right corner rather than square in the bottom-right
// stack: it reports the map's orientation instead of acting on the location,
// and the navigation-app convention for that is a floating compass badge.
// `containerClassName` drops Leaflet's `leaflet-bar` frame, which would draw a
// square border around the circle.
const NorthResetControl = ({ bearing, onClick }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const overlayContainer = useMapOverlayContainer();
  const label = formatMessage({ id: 'Reset to north' });

  return (
    <CustomControl
      position="topright"
      containerClassName="leaflet-control"
      useLeafletControl>
      <Tooltip
        title={label}
        placement="left"
        arrow
        slotProps={{ popper: { container: overlayContainer } }}>
        <IconButton
          onClick={onClick}
          aria-label={label}
          sx={{
            bgcolor: 'background.paper',
            borderRadius: '50%',
            boxShadow: 2,
            height: 44,
            width: 44,
            '&:hover': { bgcolor: '#f4f4f4' },
            // Leaflet's touch stylesheet gives .leaflet-bar and
            // .leaflet-control-layers a 2px border, so every other control in
            // this column is 48px wide against this one's 44px. They are all
            // right-floated, hence share a right edge, and that difference
            // pushes the circle 2px out of the column. Dropping the bar frame
            // above is deliberate (it would square off the circle) — so give
            // back just the width it used to occupy, where Leaflet adds it.
            '.leaflet-touch &': { mr: 0.25 }
          }}>
          <CompassNeedle
            bearing={bearing}
            northColor={theme.palette.error.main}
            southColor={theme.palette.grey[500]}
          />
        </IconButton>
      </Tooltip>
    </CustomControl>
  );
};

NorthResetControl.propTypes = {
  bearing: PropTypes.number.isRequired,
  onClick: PropTypes.func.isRequired
};

export default NorthResetControl;
