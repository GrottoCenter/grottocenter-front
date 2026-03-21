import React from 'react';
import PropTypes from 'prop-types';
import CustomIcon from '../../../../CustomIcon';
import { Information, makeCoordinatesValue } from './utils';

export const EntrancePopup = ({ entrance }) => (
  <>
    <Information
      isTitle
      value={entrance.name}
      url={`/ui/entrances/${entrance.id}`}
    />
    {entrance.caveName && entrance.caveName !== entrance.name && (
      <Information
        value={`${entrance.caveName}`}
        icon={<CustomIcon size={25} type="network" />}
        url={`/ui/caves/${entrance.caveId}`}
      />
    )}
    <Information
      value={`${entrance.city && entrance.city}, ${
        entrance.region && entrance.region
      }`}
      icon={<CustomIcon size={25} type="location" />}
    />
    <Information
      value={makeCoordinatesValue(entrance.latitude, entrance.longitude)}
      icon={<CustomIcon size={25} type="coordinates" />}
    />
    {entrance.depth && (
      <Information
        value={`${entrance.depth} m`}
        icon={<CustomIcon size={25} type="depth" />}
      />
    )}
    {entrance.length && (
      <Information
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
