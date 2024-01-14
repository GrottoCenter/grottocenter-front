import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, isNil } from 'ramda';
import { useHistory, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import DocumentSubmission from '../../components/appli/EntitiesForm/Document';
import { fetchDocumentDetails } from '../../actions/DocumentDetails';
import { resetApiMessages } from '../../actions/Document/ResetApiMessages';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';

const DocumentEdit = ({ onSuccessfulUpdate, id, requireUpdate = false }) => {
  const { documentId: documentIdFromRoute } = useParams();
  const documentId = documentIdFromRoute || id;
  const history = useHistory();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { isLoading, details, error } = useSelector(
    state => state.documentDetails
  );

  const { latestHttpCode, errorMessages } = useSelector(
    state => state.updateDocument
  );

  useEffect(() => {
    if (!isNil(documentId)) {
      dispatch(fetchDocumentDetails(documentId, requireUpdate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  useEffect(() => {
    if (latestHttpCode === 200 && isEmpty(errorMessages)) {
      if (onSuccessfulUpdate) {
        onSuccessfulUpdate();
      } else {
        dispatch(resetApiMessages());
        history.push(`/ui/documents/${documentId}`);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCode, errorMessages]);

  return isLoading || !isNil(error) || !details.id ? (
    <CircularProgress />
  ) : (
    <Layout
      title={formatMessage({ id: 'BBS document submission form' })}
      content={<DocumentSubmission initialValues={details} />}
    />
  );
};

DocumentEdit.propTypes = {
  onSuccessfulUpdate: PropTypes.func,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  requireUpdate: PropTypes.bool
};

export default DocumentEdit;
