import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import CoordinateDisplay from '@/components/common/CoordinateDisplay';
import CustomIcon from '@/components/common/CustomIcon';
import { useCoordinatePreference, getCRSLabel } from '@/hooks';
import Property from './Property';

const CoordinatesProperty = ({
  latitude,
  longitude,
  precision,
  loading = false,
  entityType = null,
  entityId = null
}) => {
  const { formatMessage } = useIntl();
  const [preferredCRS] = useCoordinatePreference();

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return (
    <Property
      loading={loading}
      label={`${formatMessage({ id: 'Coordinates' })} (${getCRSLabel(preferredCRS)})`}
      value={
        <CoordinateDisplay
          latitude={latitude}
          longitude={longitude}
          precision={precision}
          showMapLinks
          entityType={entityType}
          entityId={entityId}
        />
      }
      icon={<CustomIcon type="coordinates" />}
    />
  );
};

CoordinatesProperty.propTypes = {
  latitude: PropTypes.number,
  longitude: PropTypes.number,
  precision: PropTypes.number,
  loading: PropTypes.bool,
  entityType: PropTypes.string,
  entityId: PropTypes.number
};

export default CoordinatesProperty;
