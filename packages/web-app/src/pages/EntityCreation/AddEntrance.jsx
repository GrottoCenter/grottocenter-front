import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { EntranceForm } from '../../components/appli/EntitiesForm';
import { EntityIcon } from './entityConfig';

const AddEntrance = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  return (
    <Layout
      icon={<EntityIcon iconType="entrance" />}
      title={formatMessage({ id: 'Add an entrance' })}
      content={<EntranceForm onCancel={() => navigate(-1)} />}
    />
  );
};

export default AddEntrance;
