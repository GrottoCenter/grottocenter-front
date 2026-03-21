import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Information } from './utils';

export const MassifPopup = ({ massif }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <Information
        isTitle
        value={massif.name && massif.name.toUpperCase()}
        url={`/ui/massifs/${massif.id}`}
      />
      <Information
        value={`${massif.entranceCount} ${formatMessage({ id: 'entrances' })}`}
      />
      <Information
        value={`${massif.networkCount} ${formatMessage({ id: 'networks' })}`}
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
