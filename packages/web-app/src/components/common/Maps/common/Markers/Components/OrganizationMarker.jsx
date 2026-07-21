import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { amber } from '@mui/material/colors';

// viewBox keeps the original organization.svg coordinate space (100×100) for the
// body so content paths are verbatim. Extended to 100×130 for the pointer below
// y=98. The body spans (2,2)→(98,98) — square — giving a 30×30 rendered body
// + a 9px pointer tail (total iconSize 30×39). iconAnchor sits at the pointer
// tip (50,128 in viewBox → pixel [15,39]) so the pin marks the exact location.
const OrganizationIcon = () => (
  <svg
    viewBox="0 0 100 130"
    width="30"
    height="39"
    xmlns="http://www.w3.org/2000/svg">
    {/* Square amber balloon + prominent downward pointer */}
    <path
      d="M14 2 H86 Q98 2 98 14 V86 Q98 98 86 98 H67 L50 128 L33 98 H14 Q2 98 2 86 V14 Q2 2 14 2 Z"
      fill={amber[500]}
      stroke="#fff"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    {/* Content centered: bounding box of building is ~(6,5)→(88,87), center
        at ~(47,46); balloon center is (50,50) → translate(3 4) corrects it */}
    <g transform="translate(3 4)">
      {/* Exact white building facade from organization.svg */}
      <path
        d="M13.626 85.677l-.44-.506V40.413l1.174-1.03c3.264-2.86 10.605-8.006 24.202-16.963 3.98-2.622 6.04-3.881 6.222-3.805.243.103 3.07 1.977 7.092 4.7.766.518 3.053 2.063 5.082 3.432 8.426 5.686 15.41 10.591 17.5 12.29l1.19.967V62.57c0 22.524 0 22.566-.34 23.09l-.339.523H45.871l-.44-.504-.439-.505-.042-14.424-.042-14.423H24.744l-.042 14.423-.042 14.424-.44.505-.44.504h-9.712l-.44-.506zm57.677-20.78v-8.57H54.417l-.043 8.389c-.023 4.614-.007 8.49.037 8.616.062.179 1.847.217 8.485.18l8.407-.047v-8.569zm-64.78-26.33c-.878-.231-1.657-.884-2.009-1.685-.437-.996-.594-2.54-.356-3.512.398-1.624 3.29-4.273 7.143-6.542a53.371 53.371 0 003.196-2.075c.857-.61 2.296-1.633 3.197-2.272l4.555-3.232A305.638 305.638 0 0125.444 17c.154-.1.76-.51 1.347-.913C36.724 9.264 40.01 7.082 42.473 5.674c1.062-.607 1.293-.67 2.462-.67h1.29l4.232 2.978c2.328 1.638 4.3 2.932 4.383 2.875.083-.056.15-1.047.15-2.201 0-2.032.015-2.115.441-2.605l.44-.506h18.567l.44.504.438.504.043 9.463.042 9.463 1.23.7c4.142 2.357 6.79 4.46 7.95 6.315.6.957.656 1.144.645 2.174-.02 1.906-.969 3.09-2.987 3.724-.604.19-1.177.346-1.272.346-.137 0-4.204-2.473-5.32-3.234-.461-.315-3.03-2.05-5.574-3.769a334.143 334.143 0 01-4.426-3.018 3602.58 3602.58 0 00-6.924-4.758A1440.28 1440.28 0 0146.845 15.7c-1.831-1.29-2.211-1.493-2.489-1.33-.18.107-1.752 1.178-3.494 2.381a912.513 912.513 0 01-4.15 2.855c-.542.367-1.87 1.28-2.952 2.03-8.014 5.556-20.498 13.909-23.767 15.903-1.986 1.212-2.35 1.32-3.47 1.026z"
        fill="#fff"
      />
      {/* Window detail: amber fill (cutout through white building) */}
      <path d="M49.617 64.83v-8.503h21.586v17.005H49.617z" fill={amber[500]} />
    </g>
  </svg>
);

export const OrganizationMarker = L.divIcon({
  html: renderToString(<OrganizationIcon />),
  iconSize: [30, 39],
  iconAnchor: [15, 39],
  className: ''
});

export default OrganizationMarker;
