import React, { useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import * as L from 'leaflet';
import { Box, Card, Typography, useTheme } from '@mui/material';
import { initialBearing, bearingToCardinal, formatDistance } from '@/utils/geo';

const pointShape = PropTypes.shape({
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired
});

// Bottom banner showing the straight-line distance and bearing to the waypoint.
// Mounted only while navigation is active (a live position is available). The
// directional guidance is carried by the red line on the (compass-rotated) map
// and the off-screen indicator, so the banner stays text-only.
const WaypointHud = ({ waypoint, userLocation }) => {
  const { locale } = useIntl();
  const theme = useTheme();

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
        sx={{ px: 2, py: 1, borderRadius: 2, textAlign: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
          {formatDistance(distance, locale)}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
          {`${Math.round(bearing)}° ${bearingToCardinal(bearing)}`}
        </Typography>
      </Card>
    </Box>
  );
};

WaypointHud.propTypes = {
  waypoint: pointShape.isRequired,
  userLocation: pointShape.isRequired
};

export default WaypointHud;
