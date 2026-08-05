import { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import * as L from 'leaflet';
import { Box, Card, Typography, useTheme } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';
import {
  initialBearing,
  bearingToCardinal,
  formatDistance,
  relativeBearing
} from '@/utils/geo';
import {
  useDeviceHeading,
  useRequestHeading
} from '@/components/common/Maps/common/MapLocationContext';
import useContinuousAngle from '@/hooks/useContinuousAngle';
import { WAYPOINT_COLOR } from './waypointIcon';

const pointShape = PropTypes.shape({
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired
});

// Bottom banner showing the straight-line distance and bearing to the waypoint.
// Mounted only while navigation is active (a live position is available). When
// the device heading is known, a large arrow points to the waypoint relative to
// where the user faces ("turn this way"); otherwise it falls back to the text
// absolute bearing only.
const WaypointHud = ({ waypoint, userLocation }) => {
  const { locale } = useIntl();
  const theme = useTheme();
  // The relative arrow needs a compass heading, so the HUD asks for one — it
  // works whether or not the user also turned the location control on.
  //
  // Gate on the sensor actually being usable: on a device with no compass
  // (isSupported=false, or the first probe already returned 'unavailable'),
  // an unconditional request would keep restarting the orientation subscription
  // forever, each attempt failing the same way.
  const {
    heading,
    isSupported: compassSupported,
    error: compassError
  } = useDeviceHeading();
  useRequestHeading(compassSupported && compassError !== 'unavailable');

  // Keep the banner from bleeding taps/scroll through to the map underneath.
  // Attach through a ref callback so the effect runs exactly once per DOM node,
  // even under StrictMode's mount → cleanup → mount cycle (an empty-deps effect
  // would re-attach and duplicate the L.DomEvent listeners).
  const setRef = useCallback(node => {
    if (!node) return;
    L.DomEvent.disableClickPropagation(node);
    L.DomEvent.disableScrollPropagation(node);
  }, []);

  // userLocation changes reference on every fix, so memoising this trivial
  // computation would recompute every render anyway — cheaper to compute inline.
  const distance = L.latLng(userLocation.lat, userLocation.lng).distanceTo(
    L.latLng(waypoint.lat, waypoint.lng)
  );
  const bearing = initialBearing(userLocation, waypoint);

  // Direction to the waypoint relative to where the user currently faces (0 =
  // straight ahead). Null when the device has no usable compass heading.
  const relative = heading == null ? null : relativeBearing(bearing, heading);
  // relativeBearing wraps to [0, 360), and its discontinuity sits exactly on
  // 0 — i.e. on alignment, the one angle the user aims for. The animated
  // transform below would read 359° → 2° as "turn 357° the other way" and spin
  // the arrow right around at the very moment it should settle.
  //
  // First real reading after `heading` was null: useContinuousAngle passes the
  // input through unchanged, so the arrow lands directly on the new angle
  // rather than sweeping there from the accumulator's previous position.
  const arrowAngle = useContinuousAngle(relative);

  return (
    <Box
      ref={setRef}
      sx={{
        position: 'absolute',
        bottom: theme.spacing(2),
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: theme.zIndex.tooltip,
        pointerEvents: 'auto',
        maxWidth: `calc(100% - ${theme.spacing(4)})`
      }}>
      <Card
        elevation={4}
        sx={{
          px: 2,
          py: 1,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
        {arrowAngle != null && (
          <NavigationIcon
            aria-hidden="true"
            sx={{
              fontSize: 40,
              color: WAYPOINT_COLOR,
              transform: `rotate(${arrowAngle}deg)`,
              transition: 'transform 0.1s linear'
            }}
          />
        )}
        <Box sx={{ textAlign: arrowAngle != null ? 'left' : 'center' }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {formatDistance(distance, locale)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.2 }}>
            {`${Math.round(bearing)}° ${bearingToCardinal(bearing)}`}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

WaypointHud.propTypes = {
  waypoint: pointShape.isRequired,
  userLocation: pointShape.isRequired
};

export default WaypointHud;
