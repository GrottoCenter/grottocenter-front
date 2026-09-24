import React, { useEffect } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import L, { CRS } from 'leaflet';
import { styled } from '@mui/material/styles';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import FitScreenIcon from '@mui/icons-material/FitScreen';

import FullscreenControl from '../../components/common/Maps/common/FullscreenControl';
import CustomControl from '../../components/common/Maps/common/CustomControl';

const TOPO_URL = '/la-grande-topo.svg';
const TOPO_WIDTH = 2820;
const TOPO_HEIGHT = 4140;
const BOUNDS = [
  [0, 0],
  [TOPO_HEIGHT, TOPO_WIDTH]
];
const PAN_MARGIN = 0.5;
const PAN_BOUNDS = [
  [-TOPO_HEIGHT * PAN_MARGIN, -TOPO_WIDTH * PAN_MARGIN],
  [TOPO_HEIGHT * (1 + PAN_MARGIN), TOPO_WIDTH * (1 + PAN_MARGIN)]
];

const ViewerWrapper = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 2),
  '& .leaflet-container': {
    height: '80vh',
    width: '100%',
    background: '#fff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3]
  },
  '&:fullscreen .leaflet-container, .leaflet-container:fullscreen': {
    height: '100vh',
    borderRadius: 0
  }
}));

const SvgLayer = ({ url, bounds }) => {
  const map = useMap();

  useEffect(() => {
    let layer;
    let cancelled = false;
    fetch(url)
      .then(response => response.text())
      .then(svgText => {
        if (cancelled) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(svgText, 'image/svg+xml');
        layer = L.svgOverlay(doc.documentElement, bounds, {
          interactive: true
        }).addTo(map);
      });
    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [map, url, bounds]);

  return null;
};

const FitBoundsButton = ({ bounds }) => {
  const map = useMap();
  return (
    <CustomControl position="topleft" useLeafletControl>
      <Tooltip title="Afficher tout" placement="right">
        <IconButton
          size="small"
          onClick={() => map.fitBounds(bounds)}
          sx={{
            width: 30,
            height: 30,
            borderRadius: 0,
            color: '#000',
            background: '#fff',
            '&:hover': { background: '#f4f4f4' }
          }}
        >
          <FitScreenIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </CustomControl>
  );
};

const TopoViewer = () => (
  <ViewerWrapper component="section">
    <Typography variant="h4" component="h2" align="center" gutterBottom>
      La Grande Topo
    </Typography>
    <MapContainer
      crs={CRS.Simple}
      bounds={BOUNDS}
      maxBounds={PAN_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={-4}
      maxZoom={8}
      zoomSnap={0.25}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={80}
      attributionControl={false}
    >
      <SvgLayer url={TOPO_URL} bounds={BOUNDS} />
      <FitBoundsButton bounds={BOUNDS} />
      <FullscreenControl position="topleft" forceSeparateButton="true" />
    </MapContainer>
  </ViewerWrapper>
);

export default TopoViewer;
