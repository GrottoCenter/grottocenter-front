import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, useMap } from 'react-leaflet';
import { CRS } from 'leaflet';
import { styled } from '@mui/material/styles';
import {
  CircularProgress,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import FitScreenIcon from '@mui/icons-material/FitScreen';

import FullscreenControl from '../common/FullscreenControl';
import CustomControl from '../common/CustomControl';
import SvgTileLayer from '../SvgTileLayer';
import DocumentPin from './DocumentPin';
import useSvgData from './useSvgData';

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

const makeSvgToLatLng = viewBox => ([svgX, svgY]) => [
  viewBox.y + viewBox.h - svgY,
  svgX - viewBox.x
];

const groupByAnchor = attachments => {
  const map = {};
  for (const a of attachments) {
    if (!map[a.anchorId]) map[a.anchorId] = [];
    map[a.anchorId].push(a);
  }
  return map;
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

TilesLayer.propTypes = {
  svgData: PropTypes.object.isRequired,
  bounds: PropTypes.array.isRequired
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

FitBoundsButton.propTypes = {
  bounds: PropTypes.array.isRequired
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

  const groupedAttachments = useMemo(
    () => groupByAnchor(attachments),
    [attachments]
  );

  useEffect(() => {
    if (state.status !== 'ready') return;
    const missing = Object.keys(groupedAttachments).filter(
      anchorId => !state.data.anchors[anchorId]
    );
    if (missing.length > 0) {
      console.warn(
        '[DocumentSvgViewer] anchors not found in SVG:',
        missing.join(', ')
      );
    }
  }, [state, groupedAttachments]);

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
        {Object.entries(groupedAttachments).map(([anchorId, group]) => {
          const svgPos = state.data.anchors[anchorId];
          if (!svgPos) return null;
          return (
            <DocumentPin
              key={anchorId}
              attachments={group}
              position={derived.toLatLng(svgPos)}
            />
          );
        })}
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
      anchorId: PropTypes.string.isRequired,
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
