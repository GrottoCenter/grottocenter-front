import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  FeatureGroup,
  MapContainer,
  Marker,
  ScaleControl,
  useMap
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { useIntl } from 'react-intl';
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNotification, useProjections } from '../../../../hooks';
import useGeolocation from '../../../../hooks/useGeolocation';
import useGeolocationPermission from '../../../../hooks/useGeolocationPermission';
import LayersControl from '../../../common/Maps/common/LayersControl';
import GeocodingControl from '../../../common/Maps/common/GeocodingControl';
import FullscreenControl from '../../../common/Maps/common/FullscreenControl';
import TileReloader from '../../../common/Maps/common/TileReloader';
import ShapefileImport from './ShapefileImport';
import PolygonLayersList from './PolygonLayersList';
import { isNeedlePolygon } from '../../../../helpers/polygonUtils';
import {
  AREA_LIMIT_KM2,
  checkInterPolygonIntersections,
  computeTotalArea,
  normalizeWinding,
  validatePolygon
} from '../../../../utils/polygonValidation';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { defaultCoord, defaultZoom, focusZoom } from '../../../../conf/config';

// SVG from MUI ErrorOutline icon, rendered as a Leaflet DivIcon
const KINK_ICON_SIZE = 24;
const kinkIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="${KINK_ICON_SIZE}" height="${KINK_ICON_SIZE}" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.6)"/><path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" fill="#d32f2f"/></svg>`,
  iconSize: [KINK_ICON_SIZE, KINK_ICON_SIZE],
  iconAnchor: [KINK_ICON_SIZE / 2, KINK_ICON_SIZE / 2]
});

// Creates the kink markers' pane during render, before they mount — a parent
// effect races (child marker effects run first) and crashes on a missing pane.
const KinkPane = () => {
  const map = useMap();
  if (!map.getPane('kinkPane')) {
    const pane = map.createPane('kinkPane');
    pane.style.zIndex = 650;
    pane.style.pointerEvents = 'none';
  }
  return null;
};

const getMultiPolygonCentroid = function (coordinates) {
  const result = coordinates.reduce(
    (x, y) => [
      x[0] + y[0] / coordinates.length,
      x[1] + y[1] / coordinates.length
    ],
    [0, 0]
  );
  return {
    lat: result[1],
    lng: result[0]
  };
};

const calculateBoundsArea = bounds =>
  (bounds.getEast() - bounds.getWest()) *
  (bounds.getNorth() - bounds.getSouth());

const sortByAreaDescending = (a, b) =>
  calculateBoundsArea(b.bounds) - calculateBoundsArea(a.bounds);

const detectHoles = layers => {
  const layersWithBounds = layers.map(layer => ({
    ...layer,
    bounds: layer.bounds || L.polygon(layer.latlngs).getBounds()
  }));

  layersWithBounds.sort(sortByAreaDescending);

  // Hole detection uses axis-aligned bounding-box containment as an
  // approximation of true polygon containment. This can misclassify adjacent
  // polygons whose bboxes overlap. Users can manually toggle the hole checkbox
  // in the polygon list to correct any false positives.
  for (let i = 0; i < layersWithBounds.length; i++) {
    for (let j = 0; j < i; j++) {
      if (layersWithBounds[j].bounds.contains(layersWithBounds[i].bounds)) {
        layersWithBounds[i].isHole = true;
        break;
      }
    }
  }

  return layersWithBounds;
};

const PolygonMap = ({ onChange, onValidationChange, data }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  useProjections();
  const isMounted = useRef(true);
  const displayValue = useRef(false);
  const isEditingRef = useRef(false);
  // Ref-stabilize onValidationChange so the effect only re-fires when
  // hasBlockingErrors changes, not when the parent passes a new reference.
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;
  // Only when the permission is already granted: opening the polygon editor is
  // not asking to be located, so it must not raise a permission dialog on its
  // own. Reading the state never prompts (see useGeolocationPermission).
  const geolocationPermission = useGeolocationPermission();
  const { location: geoLocation, hasLocation } = useGeolocation({
    enabled: geolocationPermission === 'granted'
  });
  const { onError, onSuccess } = useNotification();
  const [map, setMap] = useState();
  const [featureGroupRef, setFeatureGroupRef] = useState(null);

  // Configure Leaflet Draw text
  useEffect(() => {
    if (L.drawLocal) {
      // Drawing tooltips
      L.drawLocal.draw.handlers.polygon.tooltip.start = formatMessage({
        id: 'Click to start drawing shape.'
      });
      L.drawLocal.draw.handlers.polygon.tooltip.cont = formatMessage({
        id: 'Click to continue drawing shape.'
      });
      L.drawLocal.draw.handlers.polygon.tooltip.end = formatMessage({
        id: 'Click first point to close this shape.'
      });

      // Toolbar buttons
      L.drawLocal.draw.toolbar.buttons.polygon = formatMessage({
        id: 'Draw a polygon'
      });

      // Edit tooltips
      L.drawLocal.edit.handlers.edit.tooltip.text = formatMessage({
        id: 'Drag handles or markers to edit features.'
      });
      L.drawLocal.edit.handlers.edit.tooltip.subtext = formatMessage({
        id: 'Click cancel to undo changes'
      });

      // Edit toolbar
      L.drawLocal.edit.toolbar.actions.save.title = formatMessage({
        id: 'Save changes'
      });
      L.drawLocal.edit.toolbar.actions.save.text = formatMessage({
        id: 'Save changes'
      });
      L.drawLocal.edit.toolbar.actions.cancel.title = formatMessage({
        id: 'Cancel editing, discards all changes'
      });
      L.drawLocal.edit.toolbar.actions.cancel.text = formatMessage({
        id: 'Cancel'
      });
      L.drawLocal.edit.toolbar.actions.clearAll.title = formatMessage({
        id: 'Clear all polygons'
      });
      L.drawLocal.edit.toolbar.actions.clearAll.text = formatMessage({
        id: 'Clear all polygons'
      });
      L.drawLocal.edit.toolbar.buttons.edit = formatMessage({
        id: 'Edit polygons'
      });
      L.drawLocal.edit.toolbar.buttons.editDisabled = formatMessage({
        id: 'No polygons to edit'
      });
      L.drawLocal.edit.toolbar.buttons.remove = formatMessage({
        id: 'Delete polygons'
      });
      L.drawLocal.edit.toolbar.buttons.removeDisabled = formatMessage({
        id: 'No polygons to delete'
      });

      // Drawing toolbar
      L.drawLocal.draw.toolbar.actions.title = formatMessage({
        id: 'Cancel drawing'
      });
      L.drawLocal.draw.toolbar.actions.text = formatMessage({ id: 'Cancel' });
      L.drawLocal.draw.toolbar.finish.title = formatMessage({
        id: 'Finish drawing'
      });
      L.drawLocal.draw.toolbar.finish.text = formatMessage({ id: 'Finish' });
      L.drawLocal.draw.toolbar.undo.title = formatMessage({
        id: 'Delete last point drawn'
      });
      L.drawLocal.draw.toolbar.undo.text = formatMessage({
        id: 'Delete last point'
      });

      // Remove handler
      L.drawLocal.edit.handlers.remove.tooltip.text = formatMessage({
        id: 'Click on a feature to remove.'
      });
    }
  }, [formatMessage]);

  const [mapLayers, setMapLayers] = useState([]);
  const [hoveredLayerId, setHoveredLayerId] = useState(null);
  const [validating, setValidating] = useState(false);

  // Derived validation state
  const totalAreaKm2 = useMemo(() => computeTotalArea(mapLayers), [mapLayers]);
  const areaExceeded = totalAreaKm2 > AREA_LIMIT_KM2;
  const interPolygonKinks = useMemo(
    () => checkInterPolygonIntersections(mapLayers),
    [mapLayers]
  );
  const hasInterPolygonIntersections = interPolygonKinks.length > 0;
  const hasBlockingErrors =
    mapLayers.some(l => l.hasSelfIntersection || l.tooFewPoints) ||
    areaExceeded ||
    hasInterPolygonIntersections ||
    (mapLayers.length > 0 && mapLayers.every(l => l.isHole));

  // Collect all kink points across all layers for rendering on the map
  const allKinkPoints = useMemo(
    () => [...mapLayers.flatMap(l => l.kinkPoints || []), ...interPolygonKinks],
    [mapLayers, interPolygonKinks]
  );

  // Notify parent of validation state changes
  useEffect(() => {
    if (onValidationChangeRef.current) {
      onValidationChangeRef.current(hasBlockingErrors);
    }
  }, [hasBlockingErrors]);

  const hasCoordinates = data?.coordinates?.length > 0;
  const initialCenter = hasCoordinates
    ? getMultiPolygonCentroid(
        data.type === 'Polygon' ? data.coordinates[0] : data.coordinates[0][0]
      )
    : (geoLocation ?? defaultCoord);
  const ZOOM_LEVEL = hasCoordinates || hasLocation ? focusZoom : defaultZoom;

  useEffect(() => {
    if (!map) return undefined;
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => clearTimeout(t);
  }, [map, isMobile]);

  useEffect(() => {
    if (map) {
      if (data?.coordinates) {
        const bounds = L.geoJSON(data).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
      } else if (hasLocation) {
        map.setView(geoLocation, ZOOM_LEVEL);
      }

      // Listen to edit mode events
      map.on('draw:editstart', () => {
        isEditingRef.current = true;
      });
      map.on('draw:editstop', () => {
        isEditingRef.current = false;
      });
      map.on('draw:deletestart', () => {
        isEditingRef.current = true;
      });
      map.on('draw:deletestop', () => {
        isEditingRef.current = false;
      });
    }
  }, [hasLocation, geoLocation, data, map, ZOOM_LEVEL]);

  const mapTOGeoJson = layers => {
    const geoJson = {};
    geoJson.type = 'MultiPolygon';
    geoJson.coordinates = [];

    // Separate holes from outer polygons based on isHole flag
    const outerPolygons = layers.filter(l => !l.isHole);
    const holes = layers.filter(l => l.isHole);

    // Sort outer polygons by area (largest first)
    const sortedOuter = outerPolygons
      .map(layer => ({
        coords:
          layer.latlngs instanceof Array ? layer.latlngs : layer.latlngs[0],
        layer,
        bounds: L.polygon(
          layer.latlngs instanceof Array ? layer.latlngs : layer.latlngs[0]
        ).getBounds()
      }))
      .sort(sortByAreaDescending);

    const usedHoles = new Set();

    // Process each outer polygon and find its holes
    sortedOuter.forEach(outerPoly => {
      const outerCoords = outerPoly.coords.map(coord => [coord.lng, coord.lat]);
      outerCoords.push(outerCoords[0]); // Close polygon

      const polyHoles = [];

      // Find holes that overlap with this outer polygon
      holes.forEach(holeLayer => {
        if (usedHoles.has(holeLayer.id)) return;

        const holeCoords =
          holeLayer.latlngs instanceof Array
            ? holeLayer.latlngs
            : holeLayer.latlngs[0];
        const holeBounds = L.polygon(holeCoords).getBounds();

        // Include hole if it's contained or intersects with the outer polygon
        if (
          outerPoly.bounds.contains(holeBounds) ||
          outerPoly.bounds.intersects(holeBounds)
        ) {
          const holeRing = holeCoords.map(coord => [coord.lng, coord.lat]);
          holeRing.push(holeRing[0]); // Close hole
          polyHoles.push(holeRing);
          usedHoles.add(holeLayer.id);
        }
      });

      geoJson.coordinates.push([outerCoords, ...polyHoles]);
    });

    return geoJson;
  };

  useEffect(() => {
    isMounted.current = true;
    if (mapLayers.length > 0) {
      const geoJson = mapTOGeoJson(mapLayers);
      // If every layer is marked as a hole there are no outer polygons,
      // so the geometry is invalid — treat it the same as "no layers".
      onChange(geoJson.coordinates.length > 0 ? geoJson : '');
    } else {
      onChange('');
    }
    return () => {
      isMounted.current = false;
    };
    // Quick fix infinite loop if onChange is added to the array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLayers]);

  const onCreate = e => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const { _leaflet_id: leafletId } = layer;
      if (isMounted.current) {
        // Convert Leaflet LatLng instances to plain {lat, lng} objects
        const latlngs = layer
          .getLatLngs()[0]
          .map(({ lat, lng }) => ({ lat, lng }));
        const normalizedLatlngs = normalizeWinding(latlngs, false);
        const coords = normalizedLatlngs.map(c => [c.lat, c.lng]);
        const { hasSelfIntersection, tooFewPoints, kinkPoints } =
          validatePolygon(normalizedLatlngs);
        const newLayer = {
          id: leafletId,
          latlngs: normalizedLatlngs,
          isHole: false,
          isNeedle: isNeedlePolygon(coords),
          hasSelfIntersection,
          tooFewPoints,
          kinkPoints,
          bounds: layer.getBounds()
        };

        // Detect if new polygon should be a hole
        const allLayers = [...mapLayers, newLayer];
        const detected = detectHoles(allLayers);
        setMapLayers(detected.map(({ bounds, ...rest }) => rest));
      }
    }
  };

  const onEdited = e => {
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).forEach(layer => {
      const { _leaflet_id: leafletId } = layer;
      if (isMounted.current) {
        // Convert Leaflet LatLng instances to plain {lat, lng} objects
        const latlngs = layer
          .getLatLngs()[0]
          .map(({ lat, lng }) => ({ lat, lng }));
        setMapLayers(layers =>
          layers.map(l => {
            if (l.id !== leafletId) return l;
            const normalizedLatlngs = normalizeWinding(latlngs, l.isHole);
            const coords = normalizedLatlngs.map(c => [c.lat, c.lng]);
            const { hasSelfIntersection, tooFewPoints, kinkPoints } =
              validatePolygon(normalizedLatlngs);
            return {
              ...l,
              latlngs: normalizedLatlngs,
              isNeedle: isNeedlePolygon(coords),
              hasSelfIntersection,
              tooFewPoints,
              kinkPoints
            };
          })
        );
      }
    });
  };

  const onDeleted = e => {
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).forEach(layer => {
      const { _leaflet_id: leafletId } = layer;
      if (isMounted.current) {
        setMapLayers(layers => layers.filter(l => l.id !== leafletId));
      }
    });
  };

  const handleShapefileImport = multiPolygon => {
    if (!featureGroupRef) return;

    setValidating(true);
    // setTimeout(0) yields to the browser so the overlay paints before we
    // block the main thread with the heavy polygon processing.
    setTimeout(() => {
      // Add imported polygons to existing layers.
      // GeoJSON/Shapefile ring structure is authoritative: polygon[0] is the
      // outer ring, polygon[1..n] are holes. No bounding-box heuristic needed.
      const newLayers = [];

      const processRing = (rawRing, isHole) => {
        // Strip closing vertex first so every downstream check works on
        // unique vertices only (mapToGeoJson re-closes it later).
        const isClosed =
          rawRing.length >= 2 &&
          rawRing[0][0] === rawRing[rawRing.length - 1][0] &&
          rawRing[0][1] === rawRing[rawRing.length - 1][1];
        const openRing = isClosed ? rawRing.slice(0, -1) : rawRing;

        if (openRing.length <= 2) return;

        const latlngs = openRing.map(coord => ({
          lat: coord[0],
          lng: coord[1]
        }));
        const normalizedLatlngs = normalizeWinding(latlngs, isHole);
        const coords = normalizedLatlngs.map(c => [c.lat, c.lng]);
        const { hasSelfIntersection, tooFewPoints, kinkPoints } =
          validatePolygon(normalizedLatlngs);

        const leafletPolygon = L.polygon(
          normalizedLatlngs.map(c => [c.lat, c.lng]),
          { color: 'green' }
        );

        // Add to FeatureGroup for rendering
        featureGroupRef.addLayer(leafletPolygon);

        // Add to state for form handling
        newLayers.push({
          id: leafletPolygon._leaflet_id,
          latlngs: normalizedLatlngs,
          isHole,
          isNeedle: isNeedlePolygon(coords),
          hasSelfIntersection,
          tooFewPoints,
          kinkPoints
        });
      };

      multiPolygon.coordinates.forEach(polygon => {
        // Outer ring
        const outerRing = polygon[0].map(coord => [coord[1], coord[0]]);
        processRing(outerRing, false);

        // Inner rings (holes)
        for (let i = 1; i < polygon.length; i++) {
          const holeRing = polygon[i].map(coord => [coord[1], coord[0]]);
          processRing(holeRing, true);
        }
      });

      if (newLayers.length === 0) {
        onError(
          formatMessage({
            id: 'No valid polygon rings found in the imported file.'
          })
        );
        setValidating(false);
        return;
      }

      setMapLayers(layers => [...layers, ...newLayers]);

      // Fit map to imported geometry
      if (map) {
        const bounds = L.geoJSON(multiPolygon).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds);
        }
      }

      setValidating(false);
      onSuccess(formatMessage({ id: 'Shapefile imported successfully!' }));
    }, 0);
  };

  const handleDeleteLayer = layerId => {
    if (!featureGroupRef) return;

    featureGroupRef.eachLayer(layer => {
      if (layer._leaflet_id === layerId) {
        featureGroupRef.removeLayer(layer);
      }
    });

    setMapLayers(layers => layers.filter(l => l.id !== layerId));
  };

  const handleLayerHover = layerId => {
    if (isEditingRef.current) return; // Don't interfere with edit mode

    setHoveredLayerId(layerId);

    if (!featureGroupRef) return;

    featureGroupRef.eachLayer(layer => {
      if (layer._leaflet_id === layerId) {
        layer.setStyle({ color: 'red', weight: 3 });
      } else {
        layer.setStyle({ color: 'green', weight: 2 });
      }
    });
  };

  const handleLayerUnhover = () => {
    if (isEditingRef.current) return; // Don't interfere with edit mode

    setHoveredLayerId(null);

    if (!featureGroupRef) return;

    featureGroupRef.eachLayer(layer => {
      layer.setStyle({ color: 'green', weight: 2 });
    });
  };

  const handleLayerClick = layerId => {
    if (isEditingRef.current) return; // Don't interfere with edit mode

    if (!featureGroupRef || !map) return;

    featureGroupRef.eachLayer(layer => {
      if (layer._leaflet_id === layerId) {
        map.fitBounds(layer.getBounds());
      }
    });
  };

  const handleLayerHoleToggle = layerId => {
    setMapLayers(layers =>
      layers.map(l => {
        if (l.id !== layerId) return l;
        const newIsHole = !l.isHole;
        // Re-normalize winding for the new role (exterior=CCW, hole=CW).
        // Validation is not re-run because self-intersections and point count
        // are winding-independent — only the vertex order changes.
        const normalizedLatlngs = normalizeWinding(l.latlngs, newIsHole);
        return { ...l, isHole: newIsHole, latlngs: normalizedLatlngs };
      })
    );
  };

  const onFeatureGroupReady = ref => {
    if (ref && !displayValue.current) {
      const editableFG = ref;
      const allPolygons = [];

      // Normalize: for Polygon type, wrap coordinates in an extra array
      // so the iteration logic works the same as MultiPolygon.
      const polygons =
        data.type === 'Polygon' ? [data.coordinates] : data.coordinates;

      for (const polygon of polygons) {
        // Add outer ring (first ring of each polygon)
        const outerRing = polygon[0].map(coords => [coords[1], coords[0]]);
        const outerLatlngs = outerRing.map(([lat, lng]) => ({ lat, lng }));
        const normalizedOuter = normalizeWinding(outerLatlngs, false);
        const outerCoords = normalizedOuter.map(c => [c.lat, c.lng]);
        const outerValidation = validatePolygon(normalizedOuter);

        const leafletPolygon = L.polygon(
          normalizedOuter.map(c => [c.lat, c.lng]),
          { color: 'green' }
        );
        editableFG.addLayer(leafletPolygon);
        allPolygons.push({
          id: leafletPolygon._leaflet_id,
          latlngs: normalizedOuter,
          isHole: false,
          isNeedle: isNeedlePolygon(outerCoords),
          hasSelfIntersection: outerValidation.hasSelfIntersection,
          tooFewPoints: outerValidation.tooFewPoints,
          kinkPoints: outerValidation.kinkPoints
        });

        // Add holes (second ring onwards of THIS polygon)
        for (let i = 1; i < polygon.length; i++) {
          const hole = polygon[i].map(coords => [coords[1], coords[0]]);
          const holeLatlngs = hole.map(([lat, lng]) => ({ lat, lng }));
          const normalizedHole = normalizeWinding(holeLatlngs, true);
          const holeCoords = normalizedHole.map(c => [c.lat, c.lng]);
          const holeValidation = validatePolygon(normalizedHole);

          const leafletHole = L.polygon(
            normalizedHole.map(c => [c.lat, c.lng]),
            { color: 'green' }
          );
          editableFG.addLayer(leafletHole);
          allPolygons.push({
            id: leafletHole._leaflet_id,
            latlngs: normalizedHole,
            isHole: true,
            isNeedle: isNeedlePolygon(holeCoords),
            hasSelfIntersection: holeValidation.hasSelfIntersection,
            tooFewPoints: holeValidation.tooFewPoints,
            kinkPoints: holeValidation.kinkPoints
          });
        }
      }

      setMapLayers(allPolygons);

      displayValue.current = true;
    }
  };

  return (
    <>
      <Box sx={{ mb: 1 }}>
        <ShapefileImport onImport={handleShapefileImport} />
      </Box>
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          flexDirection: { xs: 'column', md: 'row' }
        }}>
        <Box
          sx={{
            position: 'relative',
            ...(isMobile ? { width: '100%' } : { flex: 1 })
          }}>
          {/* Spinner is always mounted (hidden via visibility:hidden) so
             its CSS animation keeps running in the background. When
             validating becomes true, switching to display:flex reveals an
             already-animated spinner instantly, avoiding the thin-arc
             appearance caused by the animation starting from frame 0 while
             the main thread is blocked. */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
              zIndex: 1000,
              borderRadius: 1,
              ...(validating ? { display: 'flex' } : { visibility: 'hidden' })
            }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {formatMessage({ id: 'Validating polygons...' })}
            </Typography>
          </Box>
          <MapContainer
            center={initialCenter}
            zoom={ZOOM_LEVEL}
            ref={ref => {
              if (ref) setMap(ref);
            }}
            position="topLeft"
            rotateControl={false}
            style={{
              height: isMobile ? '50dvh' : '70dvh',
              ...(isMobile ? { width: '100%' } : { flex: 1 })
            }}>
            <FeatureGroup
              ref={reactFGref => {
                if (reactFGref) {
                  setFeatureGroupRef(reactFGref);
                  if (data) {
                    onFeatureGroupReady(reactFGref);
                  }
                }
              }}>
              <EditControl
                position="topright"
                onCreated={onCreate}
                onEdited={onEdited}
                onDeleted={onDeleted}
                draw={{
                  rectangle: false,
                  polyline: false,
                  circle: false,
                  circlemarker: false,
                  marker: false
                }}
              />
            </FeatureGroup>

            <GeocodingControl />
            <FullscreenControl forceSeparateButton="true" />
            <ScaleControl position="bottomright" />
            <LayersControl position="topright" />
            <TileReloader />

            <KinkPane />
            {allKinkPoints.map(point => (
              <Marker
                key={`kink-${point.lat}-${point.lng}`}
                position={[point.lat, point.lng]}
                icon={kinkIcon}
                interactive={false}
                pane="kinkPane"
              />
            ))}
          </MapContainer>
        </Box>

        {mapLayers.length > 0 && (
          <PolygonLayersList
            layers={mapLayers}
            totalAreaKm2={totalAreaKm2}
            areaExceeded={areaExceeded}
            hasInterPolygonIntersections={hasInterPolygonIntersections}
            hoveredLayerId={hoveredLayerId}
            onLayerClick={handleLayerClick}
            onLayerHover={handleLayerHover}
            onLayerUnhover={handleLayerUnhover}
            onLayerDelete={handleDeleteLayer}
            onLayerHoleToggle={handleLayerHoleToggle}
          />
        )}
      </Box>
    </>
  );
};

PolygonMap.propTypes = {
  onChange: PropTypes.func,
  onValidationChange: PropTypes.func,
  data: PropTypes.shape({
    type: PropTypes.string,
    coordinates: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)))
    )
  })
};

export default PolygonMap;
