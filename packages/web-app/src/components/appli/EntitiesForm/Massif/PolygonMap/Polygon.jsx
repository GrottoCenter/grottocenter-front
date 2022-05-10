/* eslint-disable prettier/prettier */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { formatMessage } from '@formatjs/intl';
import osm from './providers';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useGeolocation } from 'rooks';

const PolygonMap = ({ onChange }) => {
  const geolocation = useGeolocation();
  const latitude = geolocation?.lat;
  const longitude = geolocation?.lng;
  console.log(geolocation);
  const [center, setCenter] = useState({
    lat: latitude || 43.6,
    lng: longitude || 3.86
  });

  const [mapLayers, setMapLayers] = useState([]);

  const ZOOM_LEVEL = 12;
  const mapRef = useRef();

  const showMyLocation = () => {
    if (geolocation.loaded && !geolocation.error) {
      mapRef.current.leafletElement.flyTo(
        [geolocation.coordinates.lat, geolocation.coordinates.lng],
        ZOOM_LEVEL,
        { animate: true }
      );
    } else {
      alert(location.error.message);
    }
  };

  const mapTOGeoJson = layers => {
    const geoJson = {};
    geoJson.type = 'MultiPolygon';
    geoJson.coordinates = [[[]]];
    let i = 0;

    for (const polygon of layers) {
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
    onChange(JSON.stringify(mapTOGeoJson(mapLayers), 0, 2));
  }, [mapLayers]);

  useEffect(() => {
    if (geolocation && geolocation.lat && geolocation.lng) {
      console.log('get geo data');
      showMyLocation();
    }
  }, [geolocation]);

  const onCreate = e => {
    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const { _leafletId } = layer;

      setMapLayers(layers => [
        ...layers,
        { id: _leafletId, latlngs: layer.getLatLngs()[0] }
      ]);
    }
  };

  const onEdited = e => {
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).map(({ _leafletId, editing }) => {
      setMapLayers(layers =>
        layers.map(l =>
          l.id === _leafletId ? { ...l, latlngs: { ...editing.latlngs[0] } } : l
        )
      );
    });
  };

  const onDeleted = e => {
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).map(({ _leafletId }) => {
      setMapLayers(layers => layers.filter(l => l.id !== _leafletId));
    });
  };

  return (
    <>
      <div className="row">
        <div className="col text-center">
          <h2>Create, edit and delete massif polygon the map</h2>

          <div className="col">
            <MapContainer
              center={center}
              zoom={ZOOM_LEVEL}
              ref={mapRef}
              style={{ height: '40vh' }}>
              <FeatureGroup>
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
          </div>
        </div>
      </div>
    </>
  );
};

export default PolygonMap;
