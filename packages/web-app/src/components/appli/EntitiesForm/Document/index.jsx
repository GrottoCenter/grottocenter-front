import { useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  useNavigate,
  // eslint-disable-next-line camelcase -- react-router still ships it unstable-prefixed
  unstable_usePrompt as usePrompt,
  useSearchParams
} from 'react-router-dom';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fade,
  Typography
} from '@mui/material';
import Alert from '@mui/material/Alert';
import ReplayIcon from '@mui/icons-material/Replay';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

import { usePermissions } from '../../../../hooks';
import { documentTypeHelpers } from '../../../../utils/documentTypeHelpers';
import { resetDocumentApiErrors } from '../../../../actions/Document/ResetApiErrors';
import { postDocument } from '../../../../actions/Document/CreateDocument';
import { updateDocument } from '../../../../actions/Document/UpdateDocument';
import { displayLoginDialog } from '../../../../actions/Login';
import { linkDocumentToEntrance } from '../../../../actions/LinkDocumentToEntrance';
import { fetchEntrance } from '../../../../actions/Entrance/GetEntrance';

import DocumentFormProvider, { DocumentFormContext } from './Provider';
import { defaultDocumentValuesTypes } from './types';
import FromContent from './FormContent';
import DocumentSubmissionDialog from './DocumentSubmissionDialog';
import { IS_DELETED } from './formElements/AddFileForm/FileHelpers';
import Translate from '../../../common/Translate';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
    margin: ${theme.spacing(0.5)};
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

const DocumentSubmission = ({ onCancel }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const { isArticle, isFileExpected } = documentTypeHelpers;
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
  const [isMissingFileDialogOpen, setMissingFileDialogOpen] = useState(false);
  const hasLinked = useRef(false);

  const createDocumentState = useSelector(state => state.createDocument);
  const updateDocumentState = useSelector(state => state.updateDocument);
  const documentState = isNewDocument
    ? createDocumentState
    : updateDocumentState;
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
    if (
      entranceIdParam &&
      entranceState.data?.id === entranceIdParam &&
      !linkedEntrance
    ) {
      setLinkedEntrance({ id: entranceIdParam, name: entranceState.data.name });
    }
  }, [entranceState.data, entranceIdParam, linkedEntrance, setLinkedEntrance]);

  const submitDocument = () => {
    if (isNewDocument) dispatch(postDocument(document));
    else dispatch(updateDocument(document));
    setDocSubmitted(true);
  };

  const onFormSubmit = event => {
    event.preventDefault();

    // A file is expected for this type but none is attached: ask for
    // confirmation so the user does not forget (they cannot add a file after
    // submission until a moderator validates the document). Files flagged as
    // deleted still remain in the array, so they must be excluded from the count.
    const hasFile = document.files.some(f => f.state !== IS_DELETED);
    if (isFileExpected(document.type) && !hasFile) {
      setMissingFileDialogOpen(true);
      return;
    }
    submitDocument();
  };

  const onConfirmMissingFile = () => {
    setMissingFileDialogOpen(false);
    submitDocument();
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
      if (
        isNewDocument &&
        linkedEntrance &&
        documentState.createdDocument &&
        !hasLinked.current
      ) {
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
  usePrompt({
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
          <DocumentSubmissionDialog
            isLoading={documentState.isLoading}
            isNewDocument={isNewDocument}
          />
          <form
            onSubmit={onFormSubmit}
            style={documentState.isLoading ? { opacity: '0.6' } : undefined}>
            <FromContent onCancel={onCancel} />
          </form>

          <Dialog
            aria-describedby="missing-file-warning"
            open={isMissingFileDialogOpen}
            onClose={() => setMissingFileDialogOpen(false)}>
            <DialogTitle>
              {formatMessage({ id: 'Submit without a file?' })}
            </DialogTitle>
            <DialogContent>
              <Alert id="missing-file-warning" severity="warning">
                {formatMessage({
                  id: 'No file attached — please check that it is not an oversight.'
                })}
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={onConfirmMissingFile} variant="outlined">
                {formatMessage({ id: 'Submit anyway' })}
              </Button>
              <Button
                onClick={() => setMissingFileDialogOpen(false)}
                variant="contained">
                {formatMessage({ id: 'Cancel' })}
              </Button>
            </DialogActions>
          </Dialog>

          {documentState.errorMessages.length > 0 && (
            <CenteredBlock>
              {documentState.errorMessages.map(error => (
                <Fade in={documentState.errorMessages.length > 0} key={error}>
                  <Alert severity="error" sx={{ mt: 0.5 }}>
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

DocumentSubmission.propTypes = {
  onCancel: PropTypes.func
};

// Used from:
// - The Application to add a new document (no initialValues)
// - DocumentEdit to edit a existing document (with initialValues)
const HydratedDocumentSubmission = ({ initialValues, onCancel }) => (
  <DocumentFormProvider initialValues={initialValues}>
    <DocumentSubmission onCancel={onCancel} />
  </DocumentFormProvider>
);

HydratedDocumentSubmission.propTypes = {
  initialValues: defaultDocumentValuesTypes,
  onCancel: PropTypes.func
};

export default HydratedDocumentSubmission;
