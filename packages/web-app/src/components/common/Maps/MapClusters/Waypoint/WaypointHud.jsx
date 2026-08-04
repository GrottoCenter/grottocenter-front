import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { Box, Card, Typography, useTheme } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';
import { normalizeDeg, shortestAngleDelta } from '@/utils/compass';
import { initialBearing, bearingToCardinal, formatDistance } from '@/utils/geo';

const pointShape = PropTypes.shape({
  lat: PropTypes.number.isRequired,
  lng: PropTypes.number.isRequired
});

// Bottom navigation banner, mounted only while navigation is active (a live
// position is available). It listens to the compass event bus so its arrow
// points relative to the device heading when the compass is on, and
// North-relative otherwise.
const WaypointHud = ({ waypoint, userLocation }) => {
  const { formatMessage, locale } = useIntl();
  const theme = useTheme();
  const [heading, setHeading] = useState(null);

  // Keep the banner from bleeding taps/scroll through to the map underneath.
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      L.DomEvent.disableClickPropagation(ref.current);
      L.DomEvent.disableScrollPropagation(ref.current);
    }
  }, []);

  useMapEvents({
    compassheading(e) {
      setHeading(e.heading);
    },
    compassfollowchange(e) {
      if (!e.following) setHeading(null);
    }
  });

  const { distance, bearing } = useMemo(
    () => ({
      distance: L.latLng(userLocation.lat, userLocation.lng).distanceTo(
        L.latLng(waypoint.lat, waypoint.lng)
      ),
      bearing: initialBearing(userLocation, waypoint)
    }),
    [userLocation, waypoint]
  );

  // Arrow direction: relative to the device heading when the compass is active,
  // otherwise North-relative (the map is then North-up, so it matches the on-map
  // line). Accumulate via the shortest path so it never spins the long way.
  const targetAngle = normalizeDeg(
    heading === null ? bearing : bearing - heading
  );
  const [arrowAngle, setArrowAngle] = useState(0);
  const arrowAngleRef = useRef(0);
  useEffect(() => {
    const next =
      arrowAngleRef.current +
      shortestAngleDelta(arrowAngleRef.current, targetAngle);
    arrowAngleRef.current = next;
    setArrowAngle(next);
  }, [targetAngle]);

  const hint =
    heading === null
      ? formatMessage({ id: 'Enable the compass for heading guidance' })
      : null;

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
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1,
          borderRadius: 2
        }}>
        <NavigationIcon
          aria-hidden="true"
          sx={{
            fontSize: 34,
            color: 'primary.main',
            transform: `rotate(${arrowAngle}deg)`,
            transition: 'transform 0.15s linear'
          }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {formatDistance(distance, locale)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            {`${Math.round(bearing)}° ${bearingToCardinal(bearing)}`}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          )}
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
