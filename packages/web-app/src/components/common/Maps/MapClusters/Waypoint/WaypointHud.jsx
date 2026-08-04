import React, { useEffect, useMemo, useRef } from 'react';
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
import { useDeviceHeading } from '@/components/common/Maps/common/MapLocationContext';
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
  const { heading } = useDeviceHeading();

  // Keep the banner from bleeding taps/scroll through to the map underneath.
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  const { distance, bearing } = useMemo(
    () => ({
      distance: L.latLng(userLocation.lat, userLocation.lng).distanceTo(
        L.latLng(waypoint.lat, waypoint.lng)
      ),
      bearing: initialBearing(userLocation, waypoint)
    }),
    [userLocation, waypoint]
  );

  // Direction to the waypoint relative to where the user currently faces (0 =
  // straight ahead). Null when the device has no usable compass heading.
  const relative = heading == null ? null : relativeBearing(bearing, heading);

  return (
    <Box
      ref={ref}
      sx={{
        position: 'absolute',
        bottom: theme.spacing(2),
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
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
        {relative != null && (
          <NavigationIcon
            aria-hidden="true"
            sx={{
              fontSize: 40,
              color: WAYPOINT_COLOR,
              transform: `rotate(${relative}deg)`,
              transition: 'transform 0.1s linear'
            }}
          />
        )}
        <Box sx={{ textAlign: relative != null ? 'left' : 'center' }}>
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
