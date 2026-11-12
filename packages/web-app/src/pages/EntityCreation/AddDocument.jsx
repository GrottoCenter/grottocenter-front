import { useContext, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useLocation, useSearchParams } from 'react-router-dom';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { DocumentSubmission } from '@/components/appli/EntitiesForm/Document';
import DocumentFormProvider, {
  DocumentFormContext
} from '@/components/appli/EntitiesForm/Document/Provider';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import { EntityIcon } from './entityConfig';

const DocumentCreationPage = () => {
  const { formatMessage } = useIntl();
  const { document } = useContext(DocumentFormContext);
  let title = formatMessage({ id: 'Add a document' });
  if (document.parent?.title) {
    if (document.type === DocumentTypes.ARTICLE) {
      title = formatMessage(
        { id: 'Add an article to {title}' },
        { title: document.parent.title }
      );
    } else if (document.type === DocumentTypes.ISSUE) {
      title = formatMessage(
        { id: 'Add an issue to {title}' },
        { title: document.parent.title }
      );
    }
  }

  return (
    <Layout
      icon={<EntityIcon iconType="bibliography" />}
      title={title}
      content={<DocumentSubmission />}
    />
  );
};

const AddDocument = () => {
  const { key } = useLocation();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const parentId = Number(searchParams.get('parentId'));
  const creationContext = useMemo(
    () =>
      [DocumentTypes.ARTICLE, DocumentTypes.ISSUE].includes(type) &&
      Number.isSafeInteger(parentId) &&
      parentId > 0
        ? { type, parent: { id: parentId } }
        : null,
    [type, parentId]
  );

  return (
    <DocumentFormProvider key={key} creationContext={creationContext}>
      <DocumentCreationPage />
    </DocumentFormProvider>
  );
};

export default AddDocument;
