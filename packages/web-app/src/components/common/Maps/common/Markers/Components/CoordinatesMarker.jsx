import * as L from 'leaflet';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { Icon } from '@mui/material';
import markers from '../../../../../../conf/MapMarkersConfig';

const CoordinatesIcon = () => (
  <Icon
    color="inherit"
    style={{ textAlign: 'center', height: '100%', width: '100%' }}>
    <img
      alt="networkIcon"
      style={{ height: '100%' }}
      src={markers.find(m => m.name === 'Coordinates').url}
    />
  </Icon>
);

export const CoordinatesMarker = L.divIcon({
  html: renderToString(<CoordinatesIcon />),
  iconSize: new L.Point(25, 41),
  iconAnchor: [12.5, 41],
  className: 'fade-in-markers'
});

export default CoordinatesMarker;
