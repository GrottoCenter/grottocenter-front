import React, { useRef, useMemo } from 'react';
import { Grid } from '@material-ui/core';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';

const paddingVertical = '20px';

const DraggableMarker = ({ position, onChangePosition }) => {
  const markerRef = useRef(null);
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          onChangePosition(marker.getLatLng());
        }
      }
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};

const MapComponent = ({ position, updatePosition }) => {
  return (
    <MapContainer
      zoom={13}
      style={{ height: '300px', width: '300px' }}
      center={position}
      scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://beta.grottocenter.org/">GrottoCenter</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {isNil(updatePosition) ? (
        <Marker position={position} />
      ) : (
        <DraggableMarker
          position={position}
          onChangePosition={updatePosition}
        />
      )}
    </MapContainer>
  );
};

const MapLine = ({
  position1,
  position2,
  positionState,
  updatePositionState
}) => {
  return (
    <Grid
      container
      direction="row"
      style={{ paddingBottom: paddingVertical, paddingTop: paddingVertical }}>
      <Grid container item xs={4} justify="flex-start">
        <MapComponent position={position1} />
      </Grid>
      <Grid container item xs={4} justify="center">
        <MapComponent
          position={positionState}
          updatePosition={updatePositionState}
        />
      </Grid>
      <Grid container item xs={4} justify="flex-end">
        <MapComponent position={position2} />
      </Grid>
    </Grid>
  );
};

export default MapLine;

MapLine.propTypes = {
  position1: PropTypes.arrayOf(PropTypes.number).isRequired,
  position2: PropTypes.arrayOf(PropTypes.number).isRequired,
  positionState: PropTypes.arrayOf(PropTypes.number).isRequired,
  updatePositionState: PropTypes.func.isRequired
};

MapComponent.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  updatePosition: PropTypes.func
};

DraggableMarker.propTypes = {
  position: PropTypes.arrayOf(PropTypes.number).isRequired,
  onChangePosition: PropTypes.func.isRequired
};
