import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import DocumentSubmission from '../../components/appli/EntitiesForm/Document';
import { resetDocumentApiErrors } from '../../actions/Document/ResetApiErrors';
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
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const {
    data: details,
    isPending,
    error
  } = useDocument(documentId, { requireUpdate });

  const { latestHttpCode, errorMessages } = useSelector(
    state => state.updateDocument
  );

  useEffect(() => {
    if (latestHttpCode === 200 && errorMessages.length === 0) {
      if (onSuccessfulUpdate) {
        onSuccessfulUpdate();
      } else {
        dispatch(resetDocumentApiErrors());
        navigate(`/ui/documents/${documentId}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCode, errorMessages]);

  return isPending || error || !details?.id ? (
    <CircularProgress />
  ) : (
    <Layout
      title={formatMessage({ id: 'BBS document submission form' })}
      content={
        <DocumentSubmission initialValues={details} onCancel={onCancel} />
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
