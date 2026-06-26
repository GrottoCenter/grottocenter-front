import React, { useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import * as L from 'leaflet';
import { GlobalStyles } from '@mui/material';
import { useIntl } from 'react-intl';
import useMarkers from '../common/Markers/useMarkers';

export const ExploredGlobalCss = (
  <GlobalStyles
    styles={`
      .explored-badge {
        background: #2e7d32;
        color: #fff;
        border-radius: 50%;
        border: 1.5px solid #fff;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        display: flex !important;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        line-height: 1;
        font-weight: bold;
      }
    `}
  />
);

// Module-level: stable reference prevents recreating the icon on every render.
const exploredBadgeIcon = L.divIcon({
  className: 'explored-badge',
  html: '✓',
  iconSize: [14, 14],
  // Negative anchor shifts the badge to the top-right of the underlying point.
  iconAnchor: [-3, 17]
});

// Module-level: stable reference so useMarkers's useCallback deps don't change.
const BADGE_MARKER_OPTIONS = { zIndexOffset: 1000, keyboard: false };

/**
 * Renders a ✓ badge for each explored cave on the Leaflet map.
 * Visible at all zoom levels (independent of viewport fetching).
 *
 * Reusable: accepts any array of resolved points — works on the main map
 * (via HydratedMap) and on profile-page maps.
 */
const ExploredOverlay = ({ points = [] }) => {
  const { formatMessage } = useIntl();

  const tooltipContent = useCallback(
    m =>
      `${m.name ?? '—'} — ${formatMessage({
        id: m.isNetwork ? 'Explored network' : 'Explored entrance'
      })}`,
    [formatMessage]
  );

  const update = useMarkers({
    icon: exploredBadgeIcon,
    tooltipContent,
    markerOptions: BADGE_MARKER_OPTIONS
  });

  useEffect(() => {
    update(points.length > 0 ? points : null);
  }, [points, update]);

  return ExploredGlobalCss;
};

ExploredOverlay.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      latitude: PropTypes.number.isRequired,
      longitude: PropTypes.number.isRequired,
      name: PropTypes.string,
      isNetwork: PropTypes.bool
    })
  )
};

export default ExploredOverlay;
