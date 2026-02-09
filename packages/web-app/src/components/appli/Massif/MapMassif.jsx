import React, { useEffect, useMemo } from 'react';
import { GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import EntranceMarker from '../../common/Maps/common/Markers/Components/EntranceMarker';
import EntrancePopup from '../../common/Maps/common/Markers/Components/EntrancePopup';

// Needed because useMap is only accessible from inside <MapContainer>
const MapBind = ({ geoJson }) => {
  const map = useMap();
  useEffect(() => {
    const bounds = L.geoJSON(geoJson).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    }
  }, [map, geoJson]);

  return null;
};
MapBind.propTypes = {
  geoJson: PropTypes.shape({
    coordinates: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)))
    )
  }).isRequired
};

const MapMassif = ({ entrances, geogPolygon }) => {
  const geoJson = JSON.parse(geogPolygon);
  
  // Convert MultiPolygon to FeatureCollection for proper union display
  const displayGeoJson = useMemo(() => {
    if (geoJson.coordinates.length === 1) {
      return geoJson; // Single polygon, no conversion needed
    }
    
    // Create FeatureCollection with individual polygons
    // Leaflet will render them as separate features, showing union behavior
    return {
      type: 'FeatureCollection',
      features: geoJson.coordinates.map(coords => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: coords
        },
        properties: {}
      }))
    };
  }, [geoJson]);

  return (
    <CustomMapContainer
      wholePage={false}
      dragging
      viewport={null}
      scrollWheelZoom={false}>
      <GeoJSON data={displayGeoJson} />
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
      <MapBind geoJson={geoJson} />
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
