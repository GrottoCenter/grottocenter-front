import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { CRS, divIcon } from 'leaflet';
import { styled, useTheme } from '@mui/material/styles';
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

import useOpenLink from '../../../../hooks/useOpenLink';
import FullscreenControl from '../common/FullscreenControl';
import CustomControl from '../common/CustomControl';
import SvgTileLayer, { loadSvg } from '../SvgTileLayer';

const PAN_MARGIN = 0.5;

const Wrapper = styled('div')(({ theme }) => ({
  width: '100%',
  height: 'var(--viewer-h, 80vh)',
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

const useSvgData = url => {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadSvg(url)
      .then(data => {
        if (!cancelled) setState({ status: 'ready', data });
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

const PIN_SVG_PATH =
  'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z';

const makeDocPinIcon = color =>
  divIcon({
    className: 'topo-doc-pin',
    html:
      `<div style="width:28px;height:28px;border-radius:50%;background:${color};` +
      'color:#fff;display:flex;align-items:center;justify-content:center;' +
      'box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff;">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" ' +
      'aria-hidden="true" focusable="false">' +
      `<path d="${PIN_SVG_PATH}"/>` +
      '</svg></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

const DocumentPin = ({ attachment, position }) => {
  const openLink = useOpenLink();
  const theme = useTheme();
  const icon = useMemo(
    () => makeDocPinIcon(theme.palette.primary.main),
    [theme.palette.primary.main]
  );
  const href = `/ui/documents/${attachment.documentId}`;
  return (
    <Marker position={position} icon={icon}>
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
            onClick={() => openLink(href)}
          >
            Ouvrir
          </Button>
        </Box>
      </Popup>
    </Marker>
  );
};

const TilesLayer = ({ svgData, bounds }) => {
  const map = useMap();
  useEffect(() => {
    const layer = new SvgTileLayer({ ...svgData, bounds });
    layer.addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, svgData, bounds]);
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

const DocumentSvgViewer = ({
  svgUrl,
  attachments = [],
  height = '80vh',
  minZoom = -4,
  maxZoom = 8
}) => {
  const state = useSvgData(svgUrl);

  const derived = useMemo(() => {
    if (state.status !== 'ready') return null;
    const { viewBox } = state.data;
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

  const wrapperStyle = { '--viewer-h': height };

  if (state.status === 'loading') {
    return (
      <Wrapper className="-centered" style={wrapperStyle}>
        <CircularProgress />
      </Wrapper>
    );
  }

  if (state.status === 'error') {
    return (
      <Wrapper className="-centered" style={wrapperStyle}>
        <Typography color="error">Impossible de charger la topo.</Typography>
      </Wrapper>
    );
  }

  return (
    <Wrapper style={wrapperStyle}>
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
        <TilesLayer svgData={state.data} bounds={derived.bounds} />
        {attachments.map(a => (
          <DocumentPin
            key={a.id}
            attachment={a}
            position={derived.toLatLng(a.position)}
          />
        ))}
        <FitBoundsButton bounds={derived.bounds} />
        <FullscreenControl position="topleft" forceSeparateButton={true} />
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
  height: PropTypes.string,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number
};

export default DocumentSvgViewer;
