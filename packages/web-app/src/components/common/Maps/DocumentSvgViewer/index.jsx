import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { MapContainer, useMap, useMapEvent } from 'react-leaflet';
import { CRS } from 'leaflet';
import { styled } from '@mui/material/styles';
import {
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography
} from '@mui/material';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import PlaceIcon from '@mui/icons-material/Place';

import { useNotification } from '@/hooks';
import FullscreenControl from '../common/FullscreenControl';
import CustomControl from '../common/CustomControl';
import SvgTileLayer from '../SvgTileLayer';
import PointMarker from './PointMarker';
import PointFormDialog from './PointFormDialog';
import useSvgData from './useSvgData';
import useMockPoints from './useMockPoints';
import useFullscreenContainer from './useFullscreenContainer';
import { MAP_CONTROL_BUTTON_SIZE } from './mapControls';
import { makeFrameToSvg, makeSvgToFrame } from './georef';

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

// Inverse of makeSvgToLatLng: Leaflet latLng -> SVG [x, y].
const makeLatLngToSvg =
  viewBox =>
  ({ lat, lng }) => [lng + viewBox.x, viewBox.y + viewBox.h - lat];

// Right-click on the drawing -> context menu -> ask the viewer to open the
// create-point dialog at the clicked position. Only rendered when the SVG has
// usable control points, so `latLngToFrame` always yields frame coordinates.
const PointCreationHandler = ({
  latLngToFrame,
  onRequestCreate,
  menuContainer
}) => {
  const { formatMessage } = useIntl();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [pendingCoords, setPendingCoords] = useState(null);

  useMapEvent('contextmenu', e => {
    e.originalEvent.preventDefault();
    setPendingCoords(latLngToFrame(e.latlng));
    setMenuAnchor({
      top: e.originalEvent.clientY,
      left: e.originalEvent.clientX
    });
  });

  const handleCreate = () => {
    setMenuAnchor(null);
    onRequestCreate(pendingCoords);
  };

  return (
    <Menu
      open={Boolean(menuAnchor)}
      onClose={() => setMenuAnchor(null)}
      anchorReference="anchorPosition"
      anchorPosition={menuAnchor}
      container={menuContainer}
    >
      <MenuItem onClick={handleCreate}>
        <ListItemIcon>
          <PlaceIcon sx={{ color: 'primary.main' }} />
        </ListItemIcon>
        <ListItemText>
          {formatMessage({ id: 'Create a point here' })}
        </ListItemText>
      </MenuItem>
    </Menu>
  );
};

PointCreationHandler.propTypes = {
  latLngToFrame: PropTypes.func.isRequired,
  onRequestCreate: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  menuContainer: PropTypes.object
};

// While a point is in "move" mode, a click on the map (not on the marker)
// cancels it (the point is moved by dragging its marker).
const MoveModeHandler = ({ onCancel }) => {
  useMapEvent('click', onCancel);
  return null;
};

MoveModeHandler.propTypes = {
  onCancel: PropTypes.func.isRequired
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
  const { formatMessage } = useIntl();
  return (
    <CustomControl position="topleft" useLeafletControl>
      <Tooltip title={formatMessage({ id: 'Show all' })} placement="right">
        <IconButton
          size="small"
          onClick={() => map.fitBounds(bounds)}
          sx={{
            width: MAP_CONTROL_BUTTON_SIZE,
            height: MAP_CONTROL_BUTTON_SIZE,
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
            width: MAP_CONTROL_BUTTON_SIZE,
            height: MAP_CONTROL_BUTTON_SIZE,
            borderRadius: 0,
            color: active ? 'primary.main' : '#000',
            background: '#fff',
            '&:hover': { background: '#f4f4f4' }
          }}
        >
          <PlaceIcon fontSize="small" />
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
  const { onSuccess } = useNotification();
  const state = useSvgData(svgUrl);
  const [showPoints, setShowPoints] = useState(true);
  const { points: mockPoints, addPoint, updatePoint } = useMockPoints(svgUrl);
  // null | { mode: 'create', coordinates } | { mode: 'edit', point }
  const [dialog, setDialog] = useState(null);
  const [movingPointId, setMovingPointId] = useState(null);
  const wrapperRef = useRef(null);
  // Container so menus/dialogs stay visible in fullscreen (see hook).
  const modalContainer = useFullscreenContainer(wrapperRef);

  useEffect(() => {
    if (state.status === 'error' && onLoadError) onLoadError(state.error);
  }, [state.status, state.error, onLoadError]);

  // Points from the caller plus locally-created (mocked) ones. Only mock points
  // are editable (they can be persisted).
  const allPoints = useMemo(
    () => [...points, ...mockPoints],
    [points, mockPoints]
  );
  const mockIds = useMemo(
    () => new Set(mockPoints.map(p => p.id)),
    [mockPoints]
  );

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

  // Leaflet latLng -> frame [u, v], for placing a point from a right-click.
  // null when the SVG has no usable (non-degenerate) control points.
  const latLngToFrame = useMemo(() => {
    if (state.status !== 'ready') return null;
    const { controlPoints, viewBox } = state.data;
    if (!controlPoints) return null;
    const svgToFrame = makeSvgToFrame(controlPoints);
    if (!svgToFrame) return null;
    const latLngToSvg = makeLatLngToSvg(viewBox);
    return latlng => svgToFrame(latLngToSvg(latlng));
  }, [state]);

  // Points carry frame coordinates (relative to the SVG's 3 control points), not
  // raw SVG coords. Convert frame -> SVG -> Leaflet latLng for placement.
  const placedPoints = useMemo(() => {
    if (state.status !== 'ready' || !derived) return [];
    const { controlPoints } = state.data;
    if (!controlPoints) return [];
    const frameToSvg = makeFrameToSvg(controlPoints);
    return allPoints.map(point => ({
      point,
      position: derived.toLatLng(frameToSvg(point.coordinates))
    }));
  }, [state, derived, allPoints]);

  const handleRequestCreate = useCallback(
    coordinates => setDialog({ mode: 'create', coordinates }),
    []
  );
  const handleRequestEdit = useCallback(
    point => setDialog({ mode: 'edit', point }),
    []
  );

  const handleSubmitPoint = useCallback(
    ({ label, documents }) => {
      if (!dialog) return;
      const docs = documents.map(({ documentId, label: docLabel }) => ({
        id: `doc-${documentId}`,
        documentId,
        label: docLabel
      }));
      if (dialog.mode === 'create') {
        if (dialog.coordinates) {
          addPoint({ label, coordinates: dialog.coordinates, documents: docs });
          onSuccess(formatMessage({ id: 'Point created' }));
        }
      } else {
        updatePoint(dialog.point.id, { label, documents: docs });
        onSuccess(formatMessage({ id: 'Point updated' }));
      }
      setDialog(null);
    },
    [dialog, addPoint, updatePoint, onSuccess, formatMessage]
  );

  const handleStartMove = useCallback(id => setMovingPointId(id), []);

  const handleMoved = useCallback(
    (id, latlng) => {
      const coordinates = latLngToFrame?.(latlng);
      if (coordinates) {
        updatePoint(id, { coordinates });
        onSuccess(formatMessage({ id: 'Point moved' }));
      }
      setMovingPointId(null);
    },
    [latLngToFrame, updatePoint, onSuccess, formatMessage]
  );

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
    <Wrapper style={wrapperStyle} ref={wrapperRef}>
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
          placedPoints.map(({ point, position }) => {
            const editable = mockIds.has(point.id);
            return (
              <PointMarker
                key={point.id}
                point={point}
                position={position}
                onEdit={editable ? () => handleRequestEdit(point) : undefined}
                onStartMove={
                  editable ? () => handleStartMove(point.id) : undefined
                }
                onMoved={
                  editable ? latlng => handleMoved(point.id, latlng) : undefined
                }
                isMoving={movingPointId === point.id}
              />
            );
          })}
        <FitBoundsButton bounds={derived.bounds} />
        {placedPoints.length > 0 && (
          <PointsToggleButton
            active={showPoints}
            onToggle={() => setShowPoints(v => !v)}
          />
        )}
        {latLngToFrame && (
          <PointCreationHandler
            latLngToFrame={latLngToFrame}
            onRequestCreate={handleRequestCreate}
            menuContainer={modalContainer}
          />
        )}
        {movingPointId && (
          <MoveModeHandler onCancel={() => setMovingPointId(null)} />
        )}
        <FullscreenControl position="topleft" forceSeparateButton={true} />
      </MapContainer>
      <PointFormDialog
        open={Boolean(dialog)}
        point={dialog?.mode === 'edit' ? dialog.point : null}
        container={modalContainer}
        onClose={() => setDialog(null)}
        onSubmit={handleSubmitPoint}
      />
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
