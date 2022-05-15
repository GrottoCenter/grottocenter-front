import React from 'react';
import { GeoJSON } from 'react-leaflet';
import PropTypes from 'prop-types';

import CustomMapContainer from '../../common/Maps/common/MapContainer';

const MapMassif = ({ massif }) => {
  let geoJson;
  if (massif.geogPolygon) {
    geoJson = JSON.parse(massif.geogPolygon);
  }
  // calcul du centre du premier polygone
  const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const latitudes = geoJson.coordinates[0][0].map(coord => {
    return coord[1];
  });
  const longitudes = geoJson.coordinates[0][0].map(coord => {
    return coord[0];
  });

  const center = [average(latitudes), average(longitudes)];

  return (
    <>
      {massif?.geogPolygon && (
        <CustomMapContainer
          wholePage={false}
          dragging
          viewport={null}
          scrollWheelZoom={false}
          zoom={14}
          center={center}>
          <GeoJSON data={geoJson} />
        </CustomMapContainer>
      )}
    </>
  );
};

MapMassif.propTypes = {
  massif: PropTypes.shape({
    name: PropTypes.string,
    geogPolygon: PropTypes.string
  }).isRequired
};

export default MapMassif;
