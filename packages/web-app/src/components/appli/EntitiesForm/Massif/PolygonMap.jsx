import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { MapContainer, FeatureGroup, ScaleControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { useIntl } from 'react-intl';
import { Alert, Snackbar, Box } from '@mui/material';
import { fetchProjections } from '../../../../actions/Projections';
import useGeolocation from '../../../../hooks/useGeolocation';
import LayersControl from '../../../common/Maps/common/LayersControl';
import LocateControl from '../../../common/Maps/common/LocateControl';
import GeocodingControl from '../../../common/Maps/common/GeocodingControl';
import ShapefileImport from './ShapefileImport';
import PolygonLayersList from './PolygonLayersList';
import { isNeedlePolygon } from '../../../../helpers/polygonUtils';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { defaultZoom, focusZoom } from '../../../../conf/config';

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

const calculateBoundsArea = bounds => {
  return (
    (bounds.getEast() - bounds.getWest()) *
    (bounds.getNorth() - bounds.getSouth())
  );
};

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

const PolygonMap = ({ onChange, data }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const projectionsLoaded = useSelector(
    state => !!state.projections.projections
  );
  const isMounted = useRef(true);
  const displayValue = useRef(false);
  const isEditingRef = useRef(false);
  const { location: geoLocation, hasLocation } = useGeolocation();

  // Ensure proj4 definitions are registered for CRS transformations
  useEffect(() => {
    if (!projectionsLoaded) {
      dispatch(fetchProjections());
    }
  }, [dispatch, projectionsLoaded]);
  const [map, setMap] = useState();
  const [importError, setImportError] = useState('');
  const [featureGroupRef, setFeatureGroupRef] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

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
        id: 'Clear all layers'
      });
      L.drawLocal.edit.toolbar.actions.clearAll.text = formatMessage({
        id: 'Clear all layers'
      });
      L.drawLocal.edit.toolbar.buttons.edit = formatMessage({
        id: 'Edit layers'
      });
      L.drawLocal.edit.toolbar.buttons.editDisabled = formatMessage({
        id: 'No layers to edit'
      });
      L.drawLocal.edit.toolbar.buttons.remove = formatMessage({
        id: 'Delete layers'
      });
      L.drawLocal.edit.toolbar.buttons.removeDisabled = formatMessage({
        id: 'No layers to delete'
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
  const hasCoordinates = data?.coordinates?.length > 0;
  const initialCenter = hasCoordinates
    ? getMultiPolygonCentroid(
        data.type === 'Polygon'
          ? data.coordinates[0]
          : data.coordinates[0][0]
      )
    : geoLocation;
  const ZOOM_LEVEL = hasCoordinates || hasLocation ? focusZoom : defaultZoom;

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
        const newLayer = {
          id: leafletId,
          latlngs: layer.getLatLngs()[0],
          isHole: false,
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

    Object.values(_layers).map(layer => {
      const { _leaflet_id: leafletId } = layer;
      if (isMounted.current) {
        return setMapLayers(layers =>
          layers.map(l =>
            l.id === leafletId ? { ...l, latlngs: layer.getLatLngs()[0] } : l
          )
        );
      }
      return null;
    });
  };

  const onDeleted = e => {
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).map(layer => {
      const { _leaflet_id: leafletId } = layer;
      if (isMounted.current) {
        return setMapLayers(layers => layers.filter(l => l.id !== leafletId));
      }
      return null;
    });
  };

  const handleShapefileImport = multiPolygon => {
    if (!featureGroupRef) return;

    // Add imported polygons to existing layers
    const newLayers = [];
    multiPolygon.coordinates.forEach(polygon => {
      const rawRing = polygon[0].map(coord => [coord[1], coord[0]]);

      // Strip closing vertex first so every downstream check works on
      // unique vertices only (mapToGeoJson re-closes it later).
      const isClosed =
        rawRing.length >= 2 &&
        rawRing[0][0] === rawRing[rawRing.length - 1][0] &&
        rawRing[0][1] === rawRing[rawRing.length - 1][1];
      const openRing = isClosed ? rawRing.slice(0, -1) : rawRing;

      // Skip degenerate or needle polygons
      if (openRing.length <= 2 || isNeedlePolygon(openRing)) return;

      const leafletPolygon = L.polygon(openRing, { color: 'green' });

      // Add to FeatureGroup for rendering
      featureGroupRef.addLayer(leafletPolygon);

      // Add to state for form handling
      newLayers.push({
        id: leafletPolygon._leaflet_id,
        latlngs: openRing.map(coord => ({ lat: coord[0], lng: coord[1] })),
        isHole: false,
        bounds: leafletPolygon.getBounds()
      });
    });

    // Detect holes automatically
    const layersWithHoles = detectHoles(newLayers);

    setMapLayers(layers => [
      ...layers,
      ...layersWithHoles.map(({ bounds, ...rest }) => rest)
    ]);

    // Fit map to imported geometry
    if (map) {
      const bounds = L.geoJSON(multiPolygon).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
      }
    }

    setImportSuccess(true);
  };

  const handleImportError = error => {
    setImportError(error);
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
      layers.map(l => (l.id === layerId ? { ...l, isHole: !l.isHole } : l))
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

      // eslint-disable-next-line no-restricted-syntax
      for (const polygon of polygons) {
        // Add outer ring (first ring of each polygon)
        const outerRing = polygon[0].map(coords => [coords[1], coords[0]]);
        const leafletPolygon = L.polygon(outerRing, { color: 'green' });
        editableFG.addLayer(leafletPolygon);
        allPolygons.push({
          id: leafletPolygon._leaflet_id,
          latlngs: leafletPolygon.getLatLngs()[0],
          isHole: false
        });

        // Add holes (second ring onwards of THIS polygon)
        for (let i = 1; i < polygon.length; i++) {
          const hole = polygon[i].map(coords => [coords[1], coords[0]]);
          const leafletHole = L.polygon(hole, { color: 'green' });
          editableFG.addLayer(leafletHole);
          allPolygons.push({
            id: leafletHole._leaflet_id,
            latlngs: leafletHole.getLatLngs()[0],
            isHole: true
          });
        }
      }

      setMapLayers(allPolygons);

      displayValue.current = true;
    }
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <ShapefileImport
          onImport={handleShapefileImport}
          onError={handleImportError}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <MapContainer
          center={initialCenter}
          zoom={ZOOM_LEVEL}
          ref={ref => {
            if (ref) setMap(ref);
          }}
          position="topLeft"
          style={{
            height: '70vh',
            flex: 1
          }}
        >
          <FeatureGroup
            ref={reactFGref => {
              if (reactFGref) {
                setFeatureGroupRef(reactFGref);
                if (data) {
                  onFeatureGroupReady(reactFGref);
                }
              }
            }}
          >
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
          <LocateControl />
          <ScaleControl position="bottomright" />
          <LayersControl />
        </MapContainer>

        {mapLayers.length > 0 && (
          <PolygonLayersList
            layers={mapLayers}
            hoveredLayerId={hoveredLayerId}
            onLayerClick={handleLayerClick}
            onLayerHover={handleLayerHover}
            onLayerUnhover={handleLayerUnhover}
            onLayerDelete={handleDeleteLayer}
            onLayerHoleToggle={handleLayerHoleToggle}
          />
        )}
      </Box>

      <Snackbar
        open={!!importError}
        autoHideDuration={6000}
        onClose={() => setImportError('')}
      >
        <Alert severity="error" onClose={() => setImportError('')}>
          {importError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={importSuccess}
        autoHideDuration={3000}
        onClose={() => setImportSuccess(false)}
      >
        <Alert severity="success" onClose={() => setImportSuccess(false)}>
          {formatMessage({ id: 'Shapefile imported successfully!' })}
        </Alert>
      </Snackbar>
    </>
  );
};

PolygonMap.propTypes = {
  onChange: PropTypes.func,
  data: PropTypes.shape({
    coordinates: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)))
    )
  })
};

export default PolygonMap;
