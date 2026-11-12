import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { capitalize } from '@/utils/strings';
import CustomIcon from '../../../../CustomIcon';
import { Information } from './utils';

export const MassifPopup = ({ massif }) => {
  const { formatMessage, locale } = useIntl();
  const formatCountLabel = (id, count) => {
    const label = formatMessage({ id }, { count });
    // Romanian count labels can start with the preposition "de".
    return locale.split('-')[0] === 'ro' ? label : capitalize(label);
  };
  const entranceLabel = Number.isFinite(massif.entranceCount)
    ? formatCountLabel('entrance_count', massif.entranceCount)
    : null;
  const networkLabel = Number.isFinite(massif.networkCount)
    ? formatCountLabel('network_count_short', massif.networkCount)
    : null;
  return (
    <>
      <Information
        isTitle
        value={massif.name}
        url={`/ui/massifs/${massif.id}`}
      />
      {Number.isFinite(massif.entranceCount) && (
        <Information
          value={`${massif.entranceCount} ${entranceLabel}`}
          icon={<CustomIcon size={25} type="entrance" />}
        />
      )}
      {Number.isFinite(massif.networkCount) && (
        <Information
          value={`${massif.networkCount} ${networkLabel}`}
          icon={<CustomIcon size={25} type="network" />}
        />
      )}
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
