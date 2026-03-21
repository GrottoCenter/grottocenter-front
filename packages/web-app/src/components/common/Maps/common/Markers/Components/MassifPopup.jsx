import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import CustomIcon from '../../../../CustomIcon';
import { Information } from './utils';

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

export const MassifPopup = ({ massif }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <Information
        isTitle
        value={massif.name}
        url={`/ui/massifs/${massif.id}`}
      />
      <Information
        value={`${massif.entranceCount} ${capitalize(formatMessage({ id: 'entrances' }))}`}
        icon={<CustomIcon size={25} type="entrance" />}
      />
      <Information
        value={`${massif.networkCount} ${capitalize(formatMessage({ id: 'networks' }))}`}
        icon={<CustomIcon size={25} type="network" />}
      />
    </>
  );
};

MassifPopup.propTypes = {
  massif: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    entranceCount: PropTypes.number,
    networkCount: PropTypes.number
  }).isRequired
};

export default MassifPopup;
