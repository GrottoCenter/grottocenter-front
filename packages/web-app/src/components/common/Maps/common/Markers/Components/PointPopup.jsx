import PropTypes from 'prop-types';
import CustomIcon from '@/components/common/CustomIcon';
import { Information, makeCoordinatesValue } from './utils';

export const PointPopup = ({ point }) => (
  <>
    <Information isTitle value={point.label} url={`/ui/points/${point.id}`} />
    {(point.city || point.region || point.country) && (
      <Information
        value={[point.city, point.region, point.country]
          .filter(Boolean)
          .join(', ')}
        icon={<CustomIcon size={25} type="location" />}
      />
    )}
    <Information
      value={makeCoordinatesValue(point.latitude, point.longitude)}
      icon={<CustomIcon size={25} type="location" />}
    />
  </>
);

PointPopup.propTypes = {
  point: PropTypes.shape({
    id: PropTypes.number.isRequired,
    label: PropTypes.string.isRequired,
    latitude: PropTypes.number.isRequired,
    longitude: PropTypes.number.isRequired,
    city: PropTypes.string,
    region: PropTypes.string,
    country: PropTypes.string
  }).isRequired
};
