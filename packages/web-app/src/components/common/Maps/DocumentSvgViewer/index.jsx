import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
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
import DescriptionIcon from '@mui/icons-material/Description';

import FullscreenControl from '../common/FullscreenControl';
import CustomControl from '../common/CustomControl';
import SvgTileLayer from '../SvgTileLayer';
import PointMarker from './PointMarker';
import useSvgData from './useSvgData';
import { makeFrameToSvg } from './georef';

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
  '& .leaflet-container.leaflet-grab': { cursor: 'move' },
  '&:fullscreen .leaflet-container, .leaflet-container:fullscreen': {
    borderRadius: 0
  }
}));

const makeSvgToLatLng =
  viewBox =>
  ([svgX, svgY]) => [viewBox.y + viewBox.h - svgY, svgX - viewBox.x];

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
  const { formatMessage } = useIntl();
  return (
    <CustomControl position="topleft" useLeafletControl>
      <Tooltip title={formatMessage({ id: 'Show all' })} placement="right">
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

const PointsToggleButton = ({ active, onToggle }) => {
  const { formatMessage } = useIntl();
  return (
    <CustomControl position="topleft" useLeafletControl>
      <Tooltip
        title={formatMessage({
          id: active ? 'Hide points' : 'Show points'
        })}
        placement="right"
      >
        <IconButton
          size="small"
          onClick={onToggle}
          sx={{
            width: 30,
            height: 30,
            borderRadius: 0,
            color: active ? 'primary.main' : '#000',
            background: '#fff',
            '&:hover': { background: '#f4f4f4' }
          }}
        >
          <DescriptionIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </CustomControl>
  );
};

PointsToggleButton.propTypes = {
  active: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired
};

const DocumentSvgViewer = ({
  svgUrl,
  points = [],
  height = '80vh',
  minZoom = -4,
  maxZoom = 8,
  onLoadError = null
}) => {
  const { formatMessage } = useIntl();
  const state = useSvgData(svgUrl);
  const [showPoints, setShowPoints] = useState(true);

  useEffect(() => {
    if (state.status === 'error' && onLoadError) onLoadError(state.error);
  }, [state.status, state.error, onLoadError]);

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

  // Points carry frame coordinates (relative to the SVG's 3 control points), not
  // raw SVG coords. Convert frame -> SVG -> Leaflet latLng for placement.
  const placedPoints = useMemo(() => {
    if (state.status !== 'ready' || !derived) return [];
    const { controlPoints } = state.data;
    if (!controlPoints) return [];
    const frameToSvg = makeFrameToSvg(controlPoints);
    return points.map(point => ({
      point,
      position: derived.toLatLng(frameToSvg(point.coordinates))
    }));
  }, [state, derived, points]);

  useEffect(() => {
    if (state.status !== 'ready') return;
    if (points.length > 0 && !state.data.controlPoints) {
      console.warn(
        '[DocumentSvgViewer] points provided but the SVG has no ' +
          '#control-points (#control-1/2/3); points cannot be placed.'
      );
    }
  }, [state, points]);

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
        <Typography color="error">
          {formatMessage({ id: 'Unable to load the SVG file.' })}
        </Typography>
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
        {showPoints &&
          placedPoints.map(({ point, position }) => (
            <PointMarker key={point.id} point={point} position={position} />
          ))}
        <FitBoundsButton bounds={derived.bounds} />
        {placedPoints.length > 0 && (
          <PointsToggleButton
            active={showPoints}
            onToggle={() => setShowPoints(v => !v)}
          />
        )}
        <FullscreenControl position="topleft" forceSeparateButton={true} />
      </MapContainer>
    </Wrapper>
  );
};

DocumentSvgViewer.propTypes = {
  svgUrl: PropTypes.string.isRequired,
  // Points are georeferenced by the SVG's 3 control points. `coordinates` is
  // [u, v] in the control-point frame (see georef.js), not raw SVG coordinates.
  points: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
      label: PropTypes.string,
      documents: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
            .isRequired,
          label: PropTypes.string
        })
      )
    })
  ),
  height: PropTypes.string,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  onLoadError: PropTypes.func
};

export default DocumentSvgViewer;
