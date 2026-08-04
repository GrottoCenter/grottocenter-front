import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import DocumentSubmission from '../../components/appli/EntitiesForm/Document';
import { EntityIcon } from './entityConfig';

const AddDocument = () => {
  const { formatMessage } = useIntl();

  return (
    <Layout
      icon={<EntityIcon iconType="bibliography" />}
      title={formatMessage({ id: 'Add a document' })}
      content={<DocumentSubmission />}
    />
  );
};

export default AddDocument;
