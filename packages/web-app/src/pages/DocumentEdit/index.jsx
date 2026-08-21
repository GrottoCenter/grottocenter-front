import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import DocumentSubmission from '../../components/appli/EntitiesForm/Document';
import { useDocument } from '../../hooks';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';

const DocumentEdit = ({
  onSuccessfulUpdate,
  onCancel,
  id,
  requireUpdate = false
}) => {
  const { documentId: documentIdFromRoute } = useParams();
  const documentId = documentIdFromRoute || id;
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const {
    data: details,
    isPending,
    error
  } = useDocument(documentId, { requireUpdate });

  // Either the parent (DocumentValidation modal) handles the success — closing
  // the modal — or we navigate to the freshly saved document. DocumentSubmission
  // fires this once when useUpdateDocument reports isSuccess.
  const handleSuccess = () => {
    if (onSuccessfulUpdate) onSuccessfulUpdate();
    else navigate(`/ui/documents/${documentId}`);
  };

  return isPending || error || !details?.id ? (
    <CircularProgress />
  ) : (
    <Layout
      title={formatMessage({ id: 'BBS document submission form' })}
      content={
        <DocumentSubmission
          initialValues={details}
          onCancel={onCancel}
          onSuccess={handleSuccess}
        />
      }
    />
  );
};

DocumentEdit.propTypes = {
  onSuccessfulUpdate: PropTypes.func,
  onCancel: PropTypes.func,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  requireUpdate: PropTypes.bool
};

export default DocumentEdit;
