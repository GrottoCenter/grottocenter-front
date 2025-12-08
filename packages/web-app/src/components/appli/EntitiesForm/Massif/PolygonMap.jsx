import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, FeatureGroup, ScaleControl } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import L from 'leaflet';
import { useIntl } from 'react-intl';
import useGeolocation from '../../../../hooks/useGeolocation';
import LayersControl from '../../../common/Maps/common/LayersControl';
import LocateControl from '../../../common/Maps/common/LocateControl';
import GeocodingControl from '../../../common/Maps/common/GeocodingControl';

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

const PolygonMap = ({ onChange, data }) => {
  const { formatMessage } = useIntl();
  const isMounted = useRef(true);
  const displayValue = useRef(false);
  const { location: geoLocation, isReady, hasError } = useGeolocation();
  const [map, setMap] = useState();

  // Configure Leaflet Draw text
  useEffect(() => {
    if (L.drawLocal) {
      // Drawing tooltips
      L.drawLocal.draw.handlers.polygon.tooltip.start = formatMessage({ id: 'Click to start drawing shape.' });
      L.drawLocal.draw.handlers.polygon.tooltip.cont = formatMessage({ id: 'Click to continue drawing shape.' });
      L.drawLocal.draw.handlers.polygon.tooltip.end = formatMessage({ id: 'Click first point to close this shape.' });
      
      // Toolbar buttons
      L.drawLocal.draw.toolbar.buttons.polygon = formatMessage({ id: 'Draw a polygon' });
      
      // Edit tooltips
      L.drawLocal.edit.handlers.edit.tooltip.text = formatMessage({ id: 'Drag handles or markers to edit features.' });
      L.drawLocal.edit.handlers.edit.tooltip.subtext = formatMessage({ id: 'Click cancel to undo changes' });
      
      // Edit toolbar
      L.drawLocal.edit.toolbar.actions.save.title = formatMessage({ id: 'Save changes' });
      L.drawLocal.edit.toolbar.actions.save.text = formatMessage({ id: 'Save changes' });
      L.drawLocal.edit.toolbar.actions.cancel.title = formatMessage({ id: 'Cancel editing, discards all changes' });
      L.drawLocal.edit.toolbar.actions.cancel.text = formatMessage({ id: 'Cancel' });
      L.drawLocal.edit.toolbar.actions.clearAll.title = formatMessage({ id: 'Clear all layers' });
      L.drawLocal.edit.toolbar.actions.clearAll.text = formatMessage({ id: 'Clear all layers' });
      L.drawLocal.edit.toolbar.buttons.edit = formatMessage({ id: 'Edit layers' });
      L.drawLocal.edit.toolbar.buttons.editDisabled = formatMessage({ id: 'No layers to edit' });
      L.drawLocal.edit.toolbar.buttons.remove = formatMessage({ id: 'Delete layers' });
      L.drawLocal.edit.toolbar.buttons.removeDisabled = formatMessage({ id: 'No layers to delete' });
      
      // Drawing toolbar
      L.drawLocal.draw.toolbar.actions.title = formatMessage({ id: 'Cancel drawing' });
      L.drawLocal.draw.toolbar.actions.text = formatMessage({ id: 'Cancel' });
      L.drawLocal.draw.toolbar.finish.title = formatMessage({ id: 'Finish drawing' });
      L.drawLocal.draw.toolbar.finish.text = formatMessage({ id: 'Finish' });
      L.drawLocal.draw.toolbar.undo.title = formatMessage({ id: 'Delete last point drawn' });
      L.drawLocal.draw.toolbar.undo.text = formatMessage({ id: 'Delete last point' });
      
      // Remove handler
      L.drawLocal.edit.handlers.remove.tooltip.text = formatMessage({ id: 'Click on a feature to remove.' });
    }
  }, [formatMessage]);

  const [mapLayers, setMapLayers] = useState([]);
  const [center, setCenter] = useState(
    data
      ? getMultiPolygonCentroid(data.coordinates[0][0])
      : geoLocation
  );
  const ZOOM_LEVEL = !data && hasError ? defaultZoom : focusZoom;

  useEffect(() => {
    if (map) {
      if (data && data.coordinates && data.coordinates[0] && data.coordinates[0][0]) {
        map.fitBounds(data.coordinates[0][0].map(e => [e[1], e[0]]));
      } else if (isReady) {
        map.setView(geoLocation, ZOOM_LEVEL);
        setCenter(geoLocation);
      }
    }
  }, [isReady, geoLocation, data, map, ZOOM_LEVEL]);

  const mapTOGeoJson = layers => {
    const geoJson = {};
    geoJson.type = 'MultiPolygon';
    geoJson.coordinates = [[[]]];
    let i = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const polygon of layers) {
      // eslint-disable-next-line no-restricted-syntax
      for (const coord of polygon.latlngs instanceof Array
        ? polygon.latlngs
        : polygon.latlngs[0]) {
        geoJson.coordinates[0][i].push([coord.lng, coord.lat]);
      }
      geoJson.coordinates[0][i].push(geoJson.coordinates[0][i][0]);
      i += 1;
      geoJson.coordinates[0].push([]);
    }
    geoJson.coordinates[0].pop();
    return geoJson;
  };

  useEffect(() => {
    isMounted.current = true;
    if (mapLayers.length > 0) {
      onChange(mapTOGeoJson(mapLayers));
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
        setMapLayers(layers => [
          ...layers,
          { id: leafletId, latlngs: layer.getLatLngs()[0] }
        ]);
      }
    }
  };

  const onEdited = e => {
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).map(layer => {
      const { _leaflet_id: leafletId, editing } = layer;
      if (isMounted.current) {
        return setMapLayers(layers =>
          layers.map(l =>
            l.id === leafletId
              ? { ...l, latlngs: { ...editing.latlngs[0] } }
              : l
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

  const onFeatureGroupReady = ref => {
    if (ref && !displayValue.current) {
      const editableFG = ref;
      // eslint-disable-next-line no-restricted-syntax
      for (const polygon of data.coordinates[0]) {
        const reverseCoords = polygon.map(coords => [coords[1], coords[0]]);
        const leafletPolygon = L.polygon(reverseCoords, { color: 'green' });
        editableFG.addLayer(leafletPolygon);
      }
      editableFG.eachLayer(layer => {
        const myObj = {
          layerType: 'polygon',
          layer
        };
        onCreate(myObj);
      });

      displayValue.current = true;
    }
  };

  return (
    <MapContainer
      center={center}
      zoom={ZOOM_LEVEL}
      ref={ref => {
        if (ref) setMap(ref);
      }}
      position="topLeft"
      style={{
        height: '70vh',
        width: '100%'
      }}>
      <FeatureGroup
        ref={reactFGref => {
          if (data) {
            onFeatureGroupReady(reactFGref);
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
      <LocateControl />
      <ScaleControl position="bottomright" />
      <LayersControl />
    </MapContainer>
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
