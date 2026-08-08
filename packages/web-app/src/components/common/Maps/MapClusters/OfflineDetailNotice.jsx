import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Alert, Box } from '@mui/material';

/**
 * Explains an empty map at detail zoom while offline.
 *
 * Above MARKERS_LIMIT the map draws real markers fetched per tile. Those tiles
 * are cached by the service worker, but only for areas already visited online —
 * so panning to a new area offline legitimately yields nothing. Without a word,
 * an empty map reads as "there are no caves here", which is the opposite of the
 * truth.
 *
 * Rendered only when there is genuinely nothing to show: as soon as a single
 * marker is on screen, the map speaks for itself and the notice would be noise.
 */
const OfflineDetailNotice = ({ show }) => {
  const { formatMessage } = useIntl();

  if (!show) return null;

  return (
    // Centered overlay rather than a Leaflet corner control: every corner is
    // already taken (zoom/measure, search, layers, scale/compass/locate) and a
    // 320px notice squeezed between them collides with the buttons on narrow
    // screens. The map body is free by definition here — the notice only shows
    // when nothing is drawn — and reads as an empty state.
    // Children of MapContainer are mounted inside the positioned
    // `.leaflet-container`, so absolute coordinates resolve against the map.
    // Anchored low rather than dead-centre; the px floor of the max() keeps it
    // clear of the offline toast (and of the scale / attribution) on short
    // screens, where 15% of the height would not be enough.
    // zIndex 500 keeps it above the tiles but below Leaflet controls (800);
    // pointerEvents none so panning through it still works.
    <Box
      sx={{
        position: 'absolute',
        bottom: 'max(15%, 88px)',
        left: 0,
        right: 0,
        zIndex: 500,
        display: 'flex',
        justifyContent: 'center',
        px: 2,
        pointerEvents: 'none'
      }}>
      <Alert severity="info" sx={{ maxWidth: 360, boxShadow: 2 }}>
        {formatMessage({ id: 'offlineMapDetailUnavailable' })}
      </Alert>
    </Box>
  );
};

OfflineDetailNotice.propTypes = {
  show: PropTypes.bool.isRequired
};

export default OfflineDetailNotice;
