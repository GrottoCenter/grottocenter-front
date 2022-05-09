import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { EditControl } from 'react-leaflet-draw';
import { useGeolocation } from 'rooks';
import L from 'leaflet';
import osm from './providers';
import 'leaflet/dist/leaflet.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'leaflet-draw/dist/leaflet.draw.css';

let displayValue = false;
const PolygonMap = ({ onChange, data }) => {
  const isMounted = useRef(true);
  const [map, setMap] = useState();
  const [mapLayers, setMapLayers] = useState([]);
  const geolocation = useGeolocation();
  const latitude = geolocation?.lat;
  const longitude = geolocation?.lng;
  const [center] = useState({
    lat: latitude || 43.6,
    lng: longitude || 3.86
  });
  const ZOOM_LEVEL = 12;

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
  }, [mapLayers]);

  useEffect(() => {
    isMounted.current = true;
    if (geolocation && geolocation.lat && geolocation.lng) {
      map.setView([geolocation.lat, geolocation.lng]);
    }
    return () => {
      isMounted.current = false;
    };
  }, [geolocation]);

  const onCreate = e => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      // eslint-disable-next-line camelcase
      const { _leaflet_id } = layer;
      if (isMounted.current) {
        setMapLayers(layers => [
          ...layers,
          { id: _leaflet_id, latlngs: layer.getLatLngs()[0] }
        ]);
      }
    }
  };

  const onEdited = e => {
    const {
      layers: { _layers }
    } = e;

    // eslint-disable-next-line camelcase
    Object.values(_layers).map(({ _leaflet_id, editing }) => {
      if (isMounted.current) {
        return setMapLayers(layers => {
          return layers.map(l => {
            // eslint-disable-next-line camelcase
            return l.id === _leaflet_id
              ? { ...l, latlngs: { ...editing.latlngs[0] } }
              : l;
          });
        });
      }
      return null;
    });
  };

  const onDeleted = e => {
    const {
      layers: { _layers }
    } = e;

    // eslint-disable-next-line camelcase
    Object.values(_layers).map(({ _leaflet_id }) => {
      if (isMounted.current) {
        // eslint-disable-next-line camelcase
        return setMapLayers(layers => layers.filter(l => l.id !== _leaflet_id));
      }
      return null;
    });
  };

  const onFeatureGroupReady = ref => {
    if (ref && !displayValue) {
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

      displayValue = true;
    }
  };

  return (
    <>
      <MapContainer
        center={center}
        zoom={ZOOM_LEVEL}
        whenCreated={setMap}
        style={{ height: '60vh', width: '100vh' }}>
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
        <TileLayer
          url={osm.maptiler.url}
          attribution={osm.maptiler.attribution}
        />
      </MapContainer>
    </>
  );
};

PolygonMap.propTypes = {
  onChange: PropTypes.func,
  data: PropTypes.shape({
    coordinates: PropTypes.arrayOf([])
  })
};

export default PolygonMap;
