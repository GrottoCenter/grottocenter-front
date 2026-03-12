import { Icon } from '@mui/material';
import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { entranceMarkerIcon } from '../../../../../../assets/icons';

const EntranceIconMap = () => (
  <Icon
    color="inherit"
    style={{ textAlign: 'center', height: '100%', width: '100%' }}>
    <img
      alt="entranceIcon"
      style={{ height: '100%' }}
      src={entranceMarkerIcon}
    />
  </Icon>
);

export const EntranceMarker = L.divIcon({
  html: renderToString(<EntranceIconMap />),
  iconSize: new L.Point(12.5, 25),
  iconAnchor: [6.25, 25],
  className: ''
});

export default EntranceMarker;
