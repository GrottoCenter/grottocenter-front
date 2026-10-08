import PropTypes from 'prop-types';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import FetchErrorState from '@/components/common/FetchErrorState';
import { prepareDocumentEdit } from '@/utils/documentModeration';
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
    error,
    isPaused,
    refetch
  } = useDocument(documentId, { requireUpdate });
  const currentQuery = useDocument(documentId);

  // Either the parent (DocumentValidation modal) handles the success — closing
  // the modal — or we navigate to the freshly saved document. DocumentSubmission
  // fires this once when useUpdateDocument reports isSuccess.
  const handleSuccess = () => {
    if (onSuccessfulUpdate) onSuccessfulUpdate();
    else navigate(`/ui/documents/${documentId}`);
  };

  if (
    error ||
    isPaused ||
    (requireUpdate && (currentQuery.error || currentQuery.isPaused))
  ) {
    return (
      <FetchErrorState
        error={error || currentQuery.error}
        isPaused={isPaused || currentQuery.isPaused}
        messageId="Error, the document data you are looking for is not available."
        onRetry={() => {
          refetch();
          currentQuery.refetch();
        }}
      />
    );
  }
  if (isPending || !details?.id || (requireUpdate && currentQuery.isPending)) {
    return <CircularProgress />;
  }
  // PUT replaces the entire pending snapshot and only accepts new files as
  // uploads. Re-saving stored newFiles would silently drop them. Keep this
  // exceptional case read-only rather than introducing download/reupload here.
  if (requireUpdate && details.newFiles?.length) {
    return (
      <Stack spacing={1}>
        <Alert severity="info">
          {formatMessage({ id: 'documentModeration.pendingFilesEdit' })}
        </Alert>
        <Button onClick={onCancel}>{formatMessage({ id: 'Cancel' })}</Button>
      </Stack>
    );
  }

  return (
    <Layout
      title={formatMessage({ id: 'BBS document submission form' })}
      content={
        <DocumentSubmission
          initialValues={
            requireUpdate
              ? prepareDocumentEdit(currentQuery.data, details)
              : details
          }
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
