import React from 'react';
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

  const entranceValues =
    lat && lng
      ? { latitude: parseFloat(lat), longitude: parseFloat(lng) }
      : null;

  return (
    <Layout
      icon={<EntityIcon iconType="entrance" />}
      title={formatMessage({ id: 'Add an entrance' })}
      content={<EntranceForm entranceValues={entranceValues} onCancel={() => navigate(-1)} />}
    />
  );
};

export default AddEntrance;
