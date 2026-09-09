import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { CRS, divIcon } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import DescriptionIcon from '@mui/icons-material/Description';

import FullscreenControl from '../common/FullscreenControl';
import CustomControl from '../common/CustomControl';
import SvgTileLayer, { fetchSvg } from '../SvgTileLayer';

const PAN_MARGIN = 0.5;

const Wrapper = styled('div')(({ theme }) => ({
  width: '100%',
  height: '80vh',
  '&.-centered': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  '& .leaflet-container': {
    width: '100%',
    height: '100%',
    background: '#fff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3]
  },
  '&:fullscreen .leaflet-container, .leaflet-container:fullscreen': {
    borderRadius: 0
  }
}));

const useSvg = url => {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchSvg(url)
      .then(result => {
        if (!cancelled) setState({ status: 'ready', ...result });
      })
      .catch(error => {
        if (!cancelled) setState({ status: 'error', error });
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return state;
};

const makeSvgToLatLng = viewBox => ([svgX, svgY]) => [
  viewBox.y + viewBox.h - svgY,
  svgX - viewBox.x
];

const documentPinIcon = divIcon({
  className: 'topo-doc-pin',
  html:
    '<div style="width:28px;height:28px;border-radius:50%;background:#f57c00;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;font-size:16px;">📄</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const DocumentPin = ({ attachment, position }) => {
  const navigate = useNavigate();
  return (
    <Marker position={position} icon={documentPinIcon}>
      <Popup>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minWidth: 160
          }}
        >
          {attachment.label && (
            <Typography variant="body2">{attachment.label}</Typography>
          )}
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

const TilesLayer = ({ svgUrl, svgText, viewBox, bounds }) => {
  const map = useMap();
  useEffect(() => {
    const layer = new SvgTileLayer(svgUrl, { svgText, viewBox, bounds });
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, svgUrl, svgText, viewBox, bounds]);
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

const DocumentSvgViewer = ({ svgUrl, attachments, minZoom, maxZoom }) => {
  const state = useSvg(svgUrl);

  const derived = useMemo(() => {
    if (state.status !== 'ready') return null;
    const { viewBox } = state;
    const bounds = [
      [0, 0],
      [viewBox.h, viewBox.w]
    ];
    const panBounds = [
      [-viewBox.h * PAN_MARGIN, -viewBox.w * PAN_MARGIN],
      [viewBox.h * (1 + PAN_MARGIN), viewBox.w * (1 + PAN_MARGIN)]
    ];
    return { bounds, panBounds, toLatLng: makeSvgToLatLng(viewBox) };
  }, [state]);

  if (state.status === 'loading') {
    return (
      <Wrapper className="-centered">
        <CircularProgress />
      </Wrapper>
    );
  }

  if (state.status === 'error') {
    return (
      <Wrapper className="-centered">
        <Typography color="error">Impossible de charger la topo.</Typography>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <MapContainer
        crs={CRS.Simple}
        bounds={derived.bounds}
        maxBounds={derived.panBounds}
        maxBoundsViscosity={1.0}
        minZoom={minZoom}
        maxZoom={maxZoom}
        zoomSnap={0.25}
        zoomDelta={0.5}
        wheelPxPerZoomLevel={80}
        attributionControl={false}
      >
        <TilesLayer
          svgUrl={svgUrl}
          svgText={state.svgText}
          viewBox={state.viewBox}
          bounds={derived.bounds}
        />
        {attachments.map(a => (
          <DocumentPin
            key={a.id}
            attachment={a}
            position={derived.toLatLng(a.position)}
          />
        ))}
        <FitBoundsButton bounds={derived.bounds} />
        <FullscreenControl position="topleft" forceSeparateButton="true" />
      </MapContainer>
    </Wrapper>
  );
};

DocumentSvgViewer.propTypes = {
  svgUrl: PropTypes.string.isRequired,
  attachments: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      position: PropTypes.arrayOf(PropTypes.number).isRequired,
      documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string
    })
  ),
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number
};

DocumentSvgViewer.defaultProps = {
  attachments: [],
  minZoom: -4,
  maxZoom: 8
};

export default DocumentSvgViewer;
