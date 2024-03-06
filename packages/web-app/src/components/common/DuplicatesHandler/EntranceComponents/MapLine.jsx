import React, { useRef, useMemo } from 'react';
import { Grid, Fab } from '@mui/material';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useIntl } from 'react-intl';

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

const MapComponent = ({ position, updatePosition }) => (
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
      <DraggableMarker position={position} onChangePosition={updatePosition} />
    )}
  </MapContainer>
);

const MapLine = ({
  position1,
  position2,
  positionState,
  updatePositionState
}) => {
  const { formatMessage } = useIntl();
  const disableAddButton = value =>
    value[0] === positionState[0] && value[1] === positionState[1];

  const onAddButtonClick = value => {
    const position = {
      lat: value[0],
      lng: value[1]
    };
    updatePositionState(position);
  };

  return (
    <Grid
      container
      direction="row"
      style={{ paddingBottom: paddingVertical, paddingTop: paddingVertical }}>
      <Grid
        container
        item
        xs={4}
        justifyContent="flex-start"
        alignItems="center">
        <MapComponent position={position1} />
        <Fab
          onClick={() => onAddButtonClick(position1)}
          color="primary"
          size="small"
          disabled={disableAddButton(position1)}>
          <ArrowForwardIosIcon />
        </Fab>
      </Grid>
      <Grid container item xs={4} justifyContent="center" alignItems="center">
        <MapComponent
          position={positionState}
          updatePosition={updatePositionState}
        />
      </Grid>
      <Grid container item xs={4} justifyContent="flex-end" alignItems="center">
        <Fab
          onClick={() => onAddButtonClick(position2)}
          color="primary"
          size="small"
          disabled={disableAddButton(position2)}>
          <ArrowBackIosIcon />
        </Fab>
        <MapComponent position={position2} />
      </Grid>
      <Grid container item xs={12} justifyContent="center" alignItems="center">
        {formatMessage({ id: 'You can move this marker' })}
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
