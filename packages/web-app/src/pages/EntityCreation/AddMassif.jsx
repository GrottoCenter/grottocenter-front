import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { MassifForm } from '../../components/appli/EntitiesForm';
import { EntityIcon } from './entityConfig';

const AddMassif = () => {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  return (
    <Layout
      icon={<EntityIcon iconType="massif" />}
      title={formatMessage({ id: 'Add a massif' })}
      content={<MassifForm onCancel={() => navigate(-1)} />}
    />
  );
};

export default AddMassif;
