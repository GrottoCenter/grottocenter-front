import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import CustomIcon from '../../../../CustomIcon';
import DataQualityBadge from '../../../../DataQualityBadge';
import {
  getDataQualityValue,
  getDataQualityLabelKey
} from '../../../../../../utils/dataQuality';
import { Information, makeCoordinatesValue } from './utils';

export const EntrancePopup = ({ entrance }) => {
  const { formatMessage } = useIntl();
  const dataQualityValue = getDataQualityValue(entrance.dataQuality);

  return (
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
      {dataQualityValue != null && (
        <Information
          icon={<DataQualityBadge value={dataQualityValue} size={36} />}
          value={formatMessage({ id: getDataQualityLabelKey(dataQualityValue) })}
        />
      )}
    </>
  );
};

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
    length: PropTypes.number,
    dataQuality: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.shape({ total: PropTypes.number })
    ])
  }).isRequired
};

export default EntrancePopup;
