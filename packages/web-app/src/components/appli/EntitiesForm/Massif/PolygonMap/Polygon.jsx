import React, { useState } from 'react';

import { MapContainer, TileLayer, FeatureGroup } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import osm from './providers';
import { useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const PolygonMap = () => {
  const [center, setCenter] = useState({ lat: 24.4539, lng: 54.3773 });
  const [mapLayers, setMapLayers] = useState([]);

  const ZOOM_LEVEL = 12;
  const mapRef = useRef();

  const _onCreate = e => {
    console.log(e);

    const { layerType, layer } = e;
    if (layerType === 'polygon') {
      const { _leaflet_id } = layer;

      setMapLayers(layers => [
        ...layers,
        { id: _leaflet_id, latlngs: layer.getLatLngs()[0] }
      ]);
    }
  };

  const _onEdited = e => {
    console.log(e);
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).map(({ _leaflet_id, editing }) => {
      setMapLayers(layers =>
        layers.map(l =>
          l.id === _leaflet_id
            ? { ...l, latlngs: { ...editing.latlngs[0] } }
            : l
        )
      );
    });
  };

  const _onDeleted = e => {
    console.log(e);
    const {
      layers: { _layers }
    } = e;

    Object.values(_layers).map(({ _leaflet_id }) => {
      setMapLayers(layers => layers.filter(l => l.id !== _leaflet_id));
    });
  };

  const mapTOGeoJson = mapLayers => {
    const geoJson = {};
    geoJson.type = 'MultiPolygon';
    geoJson.coordinates = [[[]]];
    let i = 0;

    for (const polygon of mapLayers) {
      for (const coord of polygon.latlngs) {
        geoJson.coordinates[0][i].push([coord.lng, coord.lat]);
      }
      geoJson.coordinates[0][i].push(geoJson.coordinates[0][i][0]);
      i += 1;
      geoJson.coordinates[0].push([]);
    }
    geoJson.coordinates[0].pop();
    return geoJson;
  };

  return (
    <>
      <div className="row">
        <div className="col text-center">
          <h2>React-leaflet - Create, edit and delete polygon on map</h2>

          <div className="col">
            <MapContainer
              center={center}
              zoom={ZOOM_LEVEL}
              ref={mapRef}
              style={{ height: '100vh' }}>
              <FeatureGroup>
                <EditControl
                  position="topright"
                  onCreated={_onCreate}
                  onEdited={_onEdited}
                  onDeleted={_onDeleted}
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

            <pre className="text-left">
              {JSON.stringify(mapTOGeoJson(mapLayers), 0, 2)}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
};

export default PolygonMap;
