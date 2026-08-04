import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { Box } from '@mui/material';
import NavigationIcon from '@mui/icons-material/Navigation';
import {
  WAYPOINT_COLOR,
  WAYPOINT_ICON_SIZE,
  WAYPOINT_ICON_ANCHOR
} from './waypointIcon';

// Inset (px) from the container border so the round badge isn't clipped.
const EDGE_MARGIN = 26;

// When the waypoint is outside the current viewport, show a red arrow badge
// pinned to the map border in its direction (the standard off-screen-target
// indicator). Tapping it pans the map back to the waypoint. Works whatever the
// map bearing: latLngToContainerPoint already accounts for leaflet-rotate.
const WaypointOffscreenIndicator = ({ waypoint }) => {
  const map = useMap();
  const { formatMessage } = useIntl();
  // { x, y, angle } in container pixels, or null when the pin is on screen.
  const [indicator, setIndicator] = useState(null);

  const recompute = useCallback(() => {
    const { x: width, y: height } = map.getSize();
    const p = map.latLngToContainerPoint([waypoint.lat, waypoint.lng]);
    // Hide the indicator as long as *any* part of the pin's bounding box is on
    // screen — not just its anchor. The pin extends up-and-around its anchor
    // (iconSize / iconAnchor), so we reconstruct that box and test intersection.
    const [iconW, iconH] = WAYPOINT_ICON_SIZE;
    const [anchorX, anchorY] = WAYPOINT_ICON_ANCHOR;
    const pinVisible =
      p.x + (iconW - anchorX) >= 0 &&
      p.x - anchorX <= width &&
      p.y + (iconH - anchorY) >= 0 &&
      p.y - anchorY <= height;
    if (pinVisible) {
      setIndicator(null);
      return;
    }
    const cx = width / 2;
    const cy = height / 2;
    const dx = p.x - cx;
    const dy = p.y - cy;
    // Scale the center→waypoint vector down onto the inset border rectangle.
    const hx = Math.max(cx - EDGE_MARGIN, 1);
    const hy = Math.max(cy - EDGE_MARGIN, 1);
    const scale = Math.min(
      hx / Math.max(Math.abs(dx), 1e-6),
      hy / Math.max(Math.abs(dy), 1e-6)
    );
    // NavigationIcon points up at 0°; clockwise angle from up to (dx, dy).
    const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    setIndicator({ x: cx + dx * scale, y: cy + dy * scale, angle });
  }, [map, waypoint]);

  useEffect(() => {
    recompute();
  }, [recompute]);

  useMapEvents({
    move: recompute,
    zoom: recompute,
    rotate: recompute,
    resize: recompute,
    viewreset: recompute
  });

  // Stop taps from reaching the map underneath the badge.
  const setRef = useCallback(node => {
    if (node) {
      L.DomEvent.disableClickPropagation(node);
      L.DomEvent.disableScrollPropagation(node);
    }
  }, []);

  if (!indicator) return null;

  const label = formatMessage({ id: 'Recenter on waypoint' });

  return (
    <Box
      ref={setRef}
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onClick={() => map.panTo([waypoint.lat, waypoint.lng])}
      sx={{
        position: 'absolute',
        left: indicator.x,
        top: indicator.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        width: 40,
        height: 40,
        borderRadius: '50%',
        bgcolor: WAYPOINT_COLOR,
        color: 'common.white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 3,
        cursor: 'pointer',
        pointerEvents: 'auto',
        border: '2px solid #ffffff'
      }}>
      <NavigationIcon
        aria-hidden="true"
        sx={{ fontSize: 22, transform: `rotate(${indicator.angle}deg)` }}
      />
    </Box>
  );
};

WaypointOffscreenIndicator.propTypes = {
  waypoint: PropTypes.shape({
    lat: PropTypes.number.isRequired,
    lng: PropTypes.number.isRequired
  }).isRequired
};

export default WaypointOffscreenIndicator;
