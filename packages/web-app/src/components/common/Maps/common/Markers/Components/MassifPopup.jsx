import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import CustomIcon from '../../../../CustomIcon';
import { Information } from './utils';

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

export const MassifPopup = ({ massif }) => {
  const { formatMessage } = useIntl();
  const entranceLabel = capitalize(
    formatMessage({ id: massif.entranceCount === 1 ? 'entrance' : 'entrances' })
  );
  const networkLabel = capitalize(
    formatMessage({ id: massif.networkCount === 1 ? 'network' : 'networks' })
  );
  return (
    <>
      <Information
        isTitle
        value={massif.name}
        url={`/ui/massifs/${massif.id}`}
      />
      <Information
        value={`${massif.entranceCount} ${entranceLabel}`}
        icon={<CustomIcon size={25} type="entrance" />}
      />
      <Information
        value={`${massif.networkCount} ${networkLabel}`}
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
