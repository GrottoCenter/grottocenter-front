import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { blue } from '@mui/material/colors';

// Dedicated network marker: a blue hexagon (blue is the network semantic
// everywhere else on the map — heatmap, highlight overlay) with a white outline
// for contrast on any tile layer, carrying the white entrance glyphs + the path
// linking them. The non-circular shape and larger size keep it from being
// mistaken for the round entrance/cave markers.
// The entrance arch glyph and the connecting path are the *exact* tracings from
// the original network.svg icon, kept verbatim (paths + matrices) and only
// recolored white so they read on the blue hexagon. The whole composition is
// scaled/centered inside the hexagon via the wrapping group transform.
const ARCH_PATH =
  'M-614.474 9.599h37.171s38.691-206.028 151.645-208.553C-312.704-201.478-262.17 9.6-262.17 9.6h38.487';

const NetworkIcon = () => (
  <svg
    viewBox="0 0 106.667 106.667"
    width="44"
    height="44"
    xmlns="http://www.w3.org/2000/svg">
    <polygon
      points="53.33,3.33 96.63,28.33 96.63,78.33 53.33,103.33 10.03,78.33 10.03,28.33"
      fill={blue[700]}
      stroke="#fff"
      strokeWidth="4"
      strokeLinejoin="round"
    />
    <g transform="translate(20 21) scale(.66)">
      {/* Connecting path between the entrances (exact tracing, recolored white) */}
      <path
        d="M1501.873 713.928s68.646-41.013 106.847-50.14c54.59-13.043 129.578-22.261 168.185-5.014 38.606 17.246 47.178 37.74 55.402 65.182 7.917 26.42 3.002 95.458-14.84 116.324-23.495 27.478-75.249 28.657-99.934 11.412-37.458-26.166-82.397-37.967-147.397-35.479-18.518.71-49.828 15.44-75.188 31.087-14.607 9.013-33.637 36.1-32.648 40.112.99 4.011-3.147 88.965 9.894 103.289 23.586 25.906 20.742 18.782 60.348 34.095 35.807 13.844 110.804 31.087 110.804 31.087v0"
        fill="none"
        stroke="#fff"
        strokeWidth="23.717"
        strokeDasharray="23.71669195,23.716691950000001"
        transform="matrix(.16044 0 0 .15829 -215.728 -89.83)"
      />
      {/* Three entrance thresholds + arches (exact tracings, recolored white) */}
      <path
        d="M12.663 30.182l26.797-.09"
        fill="none"
        stroke="#fff"
        strokeWidth="4.06"
        strokeLinecap="round"
      />
      <path
        d={ARCH_PATH}
        fill="none"
        stroke="#fff"
        strokeWidth="60"
        strokeLinecap="round"
        transform="matrix(.06744 0 0 .06791 54.322 23.1)"
      />
      <path
        d="M61.998 56.648l26.797-.09"
        fill="none"
        stroke="#fff"
        strokeWidth="4.06"
        strokeLinecap="round"
      />
      <path
        d={ARCH_PATH}
        fill="none"
        stroke="#fff"
        strokeWidth="60"
        strokeLinecap="round"
        transform="matrix(.06744 0 0 .06791 103.658 49.567)"
      />
      <path
        d="M34.221 88.077l26.797-.09"
        fill="none"
        stroke="#fff"
        strokeWidth="4.06"
        strokeLinecap="round"
      />
      <path
        d={ARCH_PATH}
        fill="none"
        stroke="#fff"
        strokeWidth="60"
        strokeLinecap="round"
        transform="matrix(.06744 0 0 .06791 75.88 80.996)"
      />
    </g>
  </svg>
);

export const NetworkMarker = L.divIcon({
  html: renderToString(<NetworkIcon />),
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  className: ''
});

export default NetworkMarker;
