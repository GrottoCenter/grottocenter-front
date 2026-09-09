import React, { useEffect, useMemo } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { CRS, divIcon } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import DescriptionIcon from '@mui/icons-material/Description';

import FullscreenControl from '../../components/common/Maps/common/FullscreenControl';
import CustomControl from '../../components/common/Maps/common/CustomControl';
import SvgTileLayer from '../../components/common/Maps/SvgTileLayer';

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

const DOCUMENT_ATTACHMENTS = [
  {
    id: 'doc-234115',
    position: [1970, 1330],
    documentId: 234115,
    label: 'Siphon du "Boue"'
  }
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

const DocumentPin = ({ attachment }) => {
  const navigate = useNavigate();
  const icon = useMemo(
    () =>
      divIcon({
        className: 'topo-doc-pin',
        html:
          '<div style="width:28px;height:28px;border-radius:50%;background:#f57c00;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;font-size:16px;">📄</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      }),
    []
  );
  return (
    <Marker position={attachment.position} icon={icon}>
      <Popup>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 160 }}>
          <Typography variant="body2">{attachment.label}</Typography>
          <Button
            size="small"
            variant="contained"
            startIcon={<DescriptionIcon fontSize="small" />}
            onClick={() => navigate(`/ui/documents/${attachment.documentId}`)}
          >
            Ouvrir
          </Button>
        </Box>
      </Popup>
    </Marker>
  );
};

const TilesLayer = ({ url, bounds }) => {
  const map = useMap();

  useEffect(() => {
    const layer = new SvgTileLayer(url, { bounds });
    layer.addTo(map);
    return () => {
      layer.remove();
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
      <TilesLayer url={TOPO_URL} bounds={BOUNDS} />
      {DOCUMENT_ATTACHMENTS.map(a => (
        <DocumentPin key={a.id} attachment={a} />
      ))}
      <FitBoundsButton bounds={BOUNDS} />
      <FullscreenControl position="topleft" forceSeparateButton="true" />
    </MapContainer>
  </ViewerWrapper>
);

export default TopoViewer;
