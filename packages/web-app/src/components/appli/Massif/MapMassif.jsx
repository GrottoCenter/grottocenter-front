import React from 'react';
import { GeoJSON, Marker, Popup } from 'react-leaflet';
import PropTypes from 'prop-types';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import EntranceMarker from '../../common/Maps/common/Markers/Components/EntranceMarker';
import EntrancePopup from '../../common/Maps/common/Markers/Components/EntrancePopup';

const MapMassif = ({ entrances, geogPolygon }) => {
  const geoJson = JSON.parse(geogPolygon);
  // calcul du centre du premier polygone
  const average = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const latitudes = geoJson.coordinates[0][0].map(coord => coord[1]);
  const longitudes = geoJson.coordinates[0][0].map(coord => coord[0]);

  const center = [average(latitudes), average(longitudes)];

  return (
    <CustomMapContainer
      wholePage={false}
      dragging
      viewport={null}
      scrollWheelZoom={false}
      zoom={14}
      center={center}>
      <GeoJSON data={geoJson} />
      {entrances.map(
        entrance =>
          entrance.latitude &&
          entrance.longitude && (
            <Marker
              key={entrance.id}
              position={[entrance.latitude, entrance.longitude]}
              icon={EntranceMarker}>
              <Popup>
                <EntrancePopup entrance={entrance} />
              </Popup>
            </Marker>
          )
      )}
    </CustomMapContainer>
  );
};

MapMassif.propTypes = {
  geogPolygon: PropTypes.string.isRequired,
  entrances: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      latitude: PropTypes.number,
      longitude: PropTypes.number
    })
  )
};

export default MapMassif;
