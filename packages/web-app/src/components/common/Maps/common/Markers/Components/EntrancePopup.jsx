import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import CustomIcon from '../../../../CustomIcon';
import DataQualityBadge from '../../../../DataQualityBadge';
import {
  getDataQualityValue,
  getDataQualityLabelKey
} from '../../../../../../utils/dataQuality';
import { Information } from './utils';

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
      {(entrance.city || entrance.region) && (
        <Information
          value={[entrance.city, entrance.region].filter(Boolean).join(', ')}
          icon={<CustomIcon size={25} type="location" />}
        />
      )}
      {entrance.depth > 0 && (
        <Information
          value={`${entrance.depth} m`}
          icon={<CustomIcon size={25} type="depth" />}
        />
      )}
      {entrance.length > 0 && (
        <Information
          value={`${entrance.length} m`}
          icon={<CustomIcon size={25} type="length" />}
        />
      )}
      {dataQualityValue != null && (
        <Information
          icon={<DataQualityBadge value={dataQualityValue} size={25} />}
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
