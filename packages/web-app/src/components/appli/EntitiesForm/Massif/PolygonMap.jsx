import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  LayersControl
} from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { useGeolocation } from 'rooks';
import L from 'leaflet';
import TileLayers from '../../../common/Maps/common/mapLayers';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

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
  const isMounted = useRef(true);
  const displayValue = useRef(false);
  const [map, setMap] = useState();
  const [mapLayers, setMapLayers] = useState([]);
  const geolocation = useGeolocation();
  const latitude = geolocation?.lat;
  const longitude = geolocation?.lng;
  const [center] = useState(
    data
      ? getMultiPolygonCentroid(data.coordinates[0][0])
      : {
          lat: latitude || 43.6,
          lng: longitude || 3.86
        }
  );
  const ZOOM_LEVEL = 10;

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

  useEffect(() => {
    isMounted.current = true;
    if (geolocation && geolocation.lat && geolocation.lng && !data) {
      map.setView([geolocation.lat, geolocation.lng]);
    }
    return () => {
      isMounted.current = false;
    };
  }, [data, geolocation, map]);

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
      whenCreated={setMap}
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

      <LayersControl position="bottomleft">
        {TileLayers.map(layer => (
          <LayersControl.BaseLayer
            key={layer.name}
            checked={layer.name === 'OpenStreetMap Basic'}
            name={layer.name}>
            <TileLayer url={layer.url} attribution={layer.attribution} />
          </LayersControl.BaseLayer>
        ))}
      </LayersControl>
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
