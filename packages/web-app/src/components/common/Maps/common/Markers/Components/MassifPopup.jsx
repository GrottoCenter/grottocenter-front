import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import CustomIcon from '../../../../CustomIcon';
import { Information } from './utils';

const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

export const MassifPopup = ({ massif }) => {
  const { formatMessage } = useIntl();
  const entranceLabel = Number.isFinite(massif.entranceCount)
    ? capitalize(
        formatMessage({ id: 'entrance_count' }, { count: massif.entranceCount })
      )
    : null;
  const networkLabel = Number.isFinite(massif.networkCount)
    ? capitalize(
        formatMessage(
          { id: 'network_count_short' },
          { count: massif.networkCount }
        )
      )
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
