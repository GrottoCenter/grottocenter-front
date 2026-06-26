import React, { useCallback, useEffect } from 'react';
import useOpenLink from '../../../../hooks/useOpenLink';
import PropTypes from 'prop-types';
import * as L from 'leaflet';
import { GlobalStyles } from '@mui/material';
import useMarkers from '../common/Markers/useMarkers';
import { entranceIcon, networkIcon } from '../../../../assets/icons';

export const ExploredGlobalCss = (
  <GlobalStyles
    styles={`
      .explored-badge {
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
        overflow: visible !important;
      }
    `}
  />
);

export const EXPLORED_PIN_PATH =
  'M10 0C5.6 0 2 3.6 2 8c0 6 8 20 8 20s8-14 8-20c0-4.4-3.6-8-8-8z';

// Module-level: stable reference prevents recreating the icon on every render.
const exploredBadgeIcon = L.divIcon({
  className: 'explored-badge',
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 28" width="20" height="28">
    <path d="${EXPLORED_PIN_PATH}" fill="#2e7d32" stroke="#fff" stroke-width="1.5"/>
    <text x="10" y="11.5" text-anchor="middle" fill="#fff" font-size="9" font-weight="bold" font-family="sans-serif">✓</text>
  </svg>`,
  iconSize: [20, 28],
  // iconAnchor Y > icon height shifts the whole pin upward.
  // Tip hovers just above the circle marker, leaving it fully clickable.
  iconAnchor: [10, 38],
  // Tooltip at the right of the pin body, vertically centered.
  tooltipAnchor: [12, -24]
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
const ExploredOverlay = ({ points = [], shouldFitMapBound = false }) => {
  const openLink = useOpenLink();

  const tooltipContent = useCallback(
    m =>
      `<span style="display:flex;align-items:center;gap:6px"><img src="${m.isNetwork ? networkIcon : entranceIcon}" width="16" height="16">${m.name ?? '—'}</span>`,
    []
  );

  const onMarkerClick = useCallback(m => openLink(m.url), [openLink]);

  const update = useMarkers({
    icon: exploredBadgeIcon,
    tooltipContent,
    onMarkerClick,
    shouldFitMapBound,
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
      url: PropTypes.string,
      isNetwork: PropTypes.bool
    })
  ),
  shouldFitMapBound: PropTypes.bool
};

export default ExploredOverlay;
