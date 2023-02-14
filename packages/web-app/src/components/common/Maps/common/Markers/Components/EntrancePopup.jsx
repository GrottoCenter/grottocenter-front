import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { GpsFixed, Public } from '@material-ui/icons';
import { Property } from '../../../../Properties';
import CustomIcon from '../../../../CustomIcon';
import Title from './Title';
import { makeCoordinatesValue } from './utils';

export const EntrancePopup = ({ entrance }) => (
  <>
    <Title
      title={entrance.name && entrance.name.toUpperCase()}
      link={`/ui/entrances/${entrance.id}`}
    />
    {entrance.caveName && entrance.caveName !== entrance.name && (
      <Title title={entrance.caveName} link={`/ui/caves/${entrance.caveId}`} />
    )}
    <Property
      secondary
      value={`${!isNil(entrance.city) && entrance.city}, ${
        !isNil(entrance.region) && entrance.region
      }`}
      icon={<Public color="primary" />}
    />
    <Property
      secondary
      value={makeCoordinatesValue(entrance.latitude, entrance.longitude)}
      icon={<GpsFixed color="primary" />}
    />
    {entrance.depth && (
      <Property
        secondary
        value={`${entrance.depth} m`}
        icon={<CustomIcon size={25} type="depth" />}
      />
    )}
    {entrance.length && (
      <Property
        secondary
        value={`${entrance.length} m`}
        icon={<CustomIcon size={25} type="length" />}
      />
    )}
  </>
);

EntrancePopup.propTypes = {
  entrance: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    region: PropTypes.string,
    city: PropTypes.string,
    longitude: PropTypes.number,
    latitude: PropTypes.number,
    caveName: PropTypes.string,
    caveId: PropTypes.number,
    depth: PropTypes.number,
    length: PropTypes.number
  }).isRequired
};

export default EntrancePopup;
