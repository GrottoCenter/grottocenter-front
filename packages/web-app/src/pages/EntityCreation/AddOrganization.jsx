import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import OrganizationForm from '../../components/appli/EntitiesForm/Organization';
import { EntityIcon } from './entityConfig';

const AddOrganization = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  return (
    <Layout
      icon={<EntityIcon iconType="organization" />}
      title={formatMessage({ id: 'Add an organization' })}
      content={<OrganizationForm onCancel={() => navigate(-1)} />}
    />
  );
};

export default AddOrganization;
