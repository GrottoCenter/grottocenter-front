import React, { useEffect } from 'react';
import { GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import EntranceMarker from '../../common/Maps/common/Markers/Components/EntranceMarker';
import EntrancePopup from '../../common/Maps/common/Markers/Components/EntrancePopup';

// Needed because useMap is only accessible from inside <MapContainer>
const MapBind = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(positions.map(e => [e[1], e[0]]));
  }, [map, positions]);

  return null;
};
MapBind.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired
};

const MapMassif = ({ entrances, geogPolygon }) => {
  const geoJson = JSON.parse(geogPolygon);

  return (
    <CustomMapContainer
      wholePage={false}
      dragging
      viewport={null}
      scrollWheelZoom={false}>
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
      <MapBind positions={geoJson.coordinates[0][0]} />
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
