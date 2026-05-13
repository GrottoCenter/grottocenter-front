import React, { useContext, useState, useEffect, useRef } from 'react';
// eslint-disable-next-line camelcase
import { useNavigate, unstable_usePrompt, useSearchParams } from 'react-router-dom';
import { Button, Fade, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import ReplayIcon from '@mui/icons-material/Replay';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

import { usePermissions } from '../../../../hooks';
import { documentTypeHelpers } from '../../../../hooks/documentTypeHelpers';
import { resetDocumentApiErrors } from '../../../../actions/Document/ResetApiErrors';
import { postDocument } from '../../../../actions/Document/CreateDocument';
import { updateDocument } from '../../../../actions/Document/UpdateDocument';
import { displayLoginDialog } from '../../../../actions/Login';
import { linkDocumentToEntrance } from '../../../../actions/LinkDocumentToEntrance';
import { fetchEntrance } from '../../../../actions/Entrance/GetEntrance';

import DocumentFormProvider, {
  DocumentFormContext
} from './Provider';
import { defaultDocumentValuesTypes } from './types';
import FromContent from './FormContent';
import CreatingDocumentDialog from './CreatingDocumentDialog';
import Translate from '../../../common/Translate';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
    margin: ${theme.spacing(1)};
`}
`;

const CenteredBlock = styled('div')`
  text-align: center;
`;

const Spacer = styled('div')`
  height: 20px;
`;


const DONT_LEAVE_MESSAGE =
  'If you leave now, some data would be lost. Are you sure you want to leave this page?';

const DocumentSubmission = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const { isArticle } = documentTypeHelpers;
  const [searchParams] = useSearchParams();
  const {
    document,
    isNewDocument,
    resetContext,
    setLinkedEntrance,
    linkedEntrance
  } = useContext(DocumentFormContext);

  const [isDocSubmittedWithSuccess, setDocSubmittedWithSuccess] =
    useState(false);
  const [isDocSubmitted, setDocSubmitted] = useState(false);
  const hasLinked = useRef(false);

  const documentState = useSelector(state => state.createDocument);
  const entranceState = useSelector(state => state.entrance);

  const entranceIdParam = searchParams.get('entranceId')
    ? parseInt(searchParams.get('entranceId'), 10)
    : null;

  useEffect(() => {
    if (!entranceIdParam) return;
    if (entranceState.data?.id !== entranceIdParam) {
      dispatch(fetchEntrance(entranceIdParam));
    }
    // entranceIdParam is derived from stable URL params; entranceState.data is intentionally
    // read only at mount to avoid re-triggering the fetch when data arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entranceIdParam]);

  useEffect(() => {
    if (entranceIdParam && entranceState.data?.id === entranceIdParam && !linkedEntrance) {
      setLinkedEntrance({ id: entranceIdParam, name: entranceState.data.name });
    }
  }, [entranceState.data, entranceIdParam, linkedEntrance, setLinkedEntrance]);

  const onFormSubmit = event => {
    event.preventDefault();

    if (isNewDocument) dispatch(postDocument(document));
    else dispatch(updateDocument(document));
    setDocSubmitted(true);
  };

  const resetSubmissionState = () => {
    dispatch(resetDocumentApiErrors());
    setDocSubmittedWithSuccess(false);
    setDocSubmitted(false);
    hasLinked.current = false;
  };

  const onSubmitAnotherDocument = () => {
    resetSubmissionState();
    resetContext();
  };

  const onSubmitAnotherArticle = () => {
    resetSubmissionState();
    resetContext({
      type: document.type,
      editor: document.editor,
      library: document.library,
      parent: document.parent,
      datePublication: document.datePublication
    });
  };

  useEffect(() => {
    if (!isDocSubmitted) return;
    if (documentState.latestHttpCode === 200) {
      setDocSubmittedWithSuccess(true);
      if (isNewDocument && linkedEntrance && documentState.createdDocument && !hasLinked.current) {
        hasLinked.current = true;
        dispatch(
          linkDocumentToEntrance({
            entranceId: linkedEntrance.id,
            document: documentState.createdDocument
          })
        );
      }
    }
  }, [
    isDocSubmitted,
    documentState.latestHttpCode,
    documentState.createdDocument,
    isNewDocument,
    linkedEntrance,
    dispatch
  ]);

  // eslint-disable-next-line camelcase
  unstable_usePrompt({
    message: formatMessage({ id: DONT_LEAVE_MESSAGE }),
    when: ({ currentLocation, nextLocation }) =>
      permissions.isAuth &&
      !isDocSubmittedWithSuccess &&
      documentState.isLoading &&
      currentLocation.pathname !== nextLocation.pathname
  });

  return (
    <div>
      {isDocSubmittedWithSuccess && (
        <CenteredBlock>
          <Alert severity="success" variant="outlined">
            {isNewDocument
              ? `${formatMessage({
                  id: 'Your document has been successfully submitted, thank you!'
                })} ${formatMessage({
                  id: 'It will be verified by one of ours moderators.'
                })}`
              : `${formatMessage({
                  id: 'Document successfully updated.'
                })}`}
          </Alert>
          <Spacer />
          {isArticle(document.type) && (
            <>
              <SpacedButton
                color="primary"
                onClick={onSubmitAnotherArticle}
                startIcon={<ReplayIcon />}
                variant="contained">
                <Translate>Submit another article</Translate>
              </SpacedButton>
              <Typography variant="body1">
                {formatMessage({
                  id: 'By clicking this button, you will be able to submit another article without re-typing some values (publication date, parent document etc.).'
                })}
              </Typography>
              <br />
            </>
          )}
          {isNewDocument && (
            <>
              <SpacedButton
                onClick={onSubmitAnotherDocument}
                variant="outlined">
                <Translate>Submit another document</Translate>
              </SpacedButton>
              <SpacedButton onClick={() => navigate(-1)} variant="contained">
                <Translate>Go back</Translate>
              </SpacedButton>
            </>
          )}
        </CenteredBlock>
      )}
      {!permissions.isAuth && (
        <CenteredBlock>
          <Alert severity="error" variant="outlined">
            {formatMessage({
              id: 'You must be authenticated and an user to submit a document to Grottocenter.'
            })}
          </Alert>

          <Spacer />
          <SpacedButton
            onClick={() => dispatch(displayLoginDialog())}
            variant="contained">
            <Translate>Log in</Translate>
          </SpacedButton>
          <SpacedButton onClick={() => navigate('/')} variant="contained">
            <Translate>Go to home page</Translate>
          </SpacedButton>
        </CenteredBlock>
      )}
      {permissions.isAuth && !isDocSubmittedWithSuccess && (
        <>
          <CreatingDocumentDialog isLoading={documentState.isLoading} />
          <form
            onSubmit={onFormSubmit}
            style={{ marginTop: '16px', ...(documentState.isLoading ? { opacity: '0.6' } : {}) }}>
            <FromContent />
          </form>


          {documentState.errorMessages.length > 0 && (
            <CenteredBlock>
              {documentState.errorMessages.map(error => (
                <Fade in={documentState.errorMessages.length > 0} key={error}>
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {formatMessage({ id: error })}
                  </Alert>
                </Fade>
              ))}
            </CenteredBlock>
          )}
        </>
      )}
    </div>
  );
};

// Used from:
// - The Application to add a new document (no initialValues)
// - DocumentEdit to edit a existing document (with initialValues)
const HydratedDocumentSubmission = ({ initialValues }) => (
  <DocumentFormProvider initialValues={initialValues}>
    <DocumentSubmission />
  </DocumentFormProvider>
);

HydratedDocumentSubmission.propTypes = {
  initialValues: defaultDocumentValuesTypes
};

export default HydratedDocumentSubmission;
