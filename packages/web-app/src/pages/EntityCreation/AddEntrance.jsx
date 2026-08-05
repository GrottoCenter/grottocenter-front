import { useNavigate, useSearchParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { EntranceForm } from '../../components/appli/EntitiesForm';
import { EntityIcon } from './entityConfig';

const AddEntrance = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const [searchParams] = useSearchParams();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  const entranceValues =
    Number.isFinite(parsedLat) && Number.isFinite(parsedLng)
      ? { latitude: parsedLat, longitude: parsedLng }
      : null;

  return (
    <Layout
      icon={<EntityIcon iconType="entrance" />}
      title={formatMessage({ id: 'Add an entrance' })}
      content={
        <EntranceForm
          entranceValues={entranceValues}
          onCancel={() => navigate(-1)}
        />
      }
    />
  );
};

export default AddEntrance;
