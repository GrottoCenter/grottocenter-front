import { useContext, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
  useNavigate,
  unstable_usePrompt as usePrompt,
  useSearchParams
} from 'react-router-dom';
import { Button, Fade } from '@mui/material';
import Alert from '@mui/material/Alert';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';

import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { getLicenseName } from '@/components/common/LicenseTag/helpers';
import {
  documentTypeHelpers,
  getDocumentTypeRules
} from '@/utils/documentTypeHelpers';
import {
  useEntrance,
  useLicenses,
  findLicenseByName,
  useLinkDocumentToEntrance,
  usePermissions,
  useCreateDocument,
  useUpdateDocument
} from '../../../../hooks';
import { displayLoginDialog } from '../../../../actions/Login';

import DocumentFormProvider, { DocumentFormContext } from './Provider';
import { defaultDocumentValuesTypes } from './types';
import FormContent from './FormContent';
import DocumentSubmissionDialog from './DocumentSubmissionDialog';
import DocumentSubmissionSuccess from './DocumentSubmissionSuccess';
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

export const DocumentSubmission = ({ onCancel, onSuccess }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const { isArticle } = documentTypeHelpers;
  const [searchParams] = useSearchParams();
  const {
    document,
    isFormValid,
    blockingField,
    flagValidationError,
    grantedPublicationLicense,
    isNewDocument,
    resetContext,
    selectParent,
    storedLicense,
    setLinkedEntrance,
    linkedEntrance
  } = useContext(DocumentFormContext);

  const [isDocSubmittedWithSuccess, setDocSubmittedWithSuccess] =
    useState(false);
  const [isMissingFileDialogOpen, setMissingFileDialogOpen] = useState(false);
  const hasLinked = useRef(false);

  const createMutation = useCreateDocument();
  const updateMutation = useUpdateDocument();
  const activeMutation = isNewDocument ? createMutation : updateMutation;
  const rules = getDocumentTypeRules(document.type);
  const hasFile = document.files.some(file => file.state !== IS_DELETED);
  const preservesStoredLicense =
    !isNewDocument &&
    rules.hasFileSharing &&
    !hasFile &&
    !document.authorizationDocument?.id &&
    !!storedLicense;
  const {
    data: licenses,
    isFetching: isFetchingLicenses,
    refetch: reloadLicenses
  } = useLicenses({ enabled: preservesStoredLicense && !storedLicense?.id });
  const resolvedStoredLicense = storedLicense?.id
    ? storedLicense
    : findLicenseByName(licenses, getLicenseName(storedLicense));
  const isWaitingForStoredLicense =
    preservesStoredLicense && !resolvedStoredLicense;
  const isWaitingForGrant =
    blockingField === 'authorization' && grantedPublicationLicense?.isLoading;
  const isResolvingDocument =
    isWaitingForStoredLicense || isWaitingForGrant || document.isParentPending;
  const canSubmit = isFormValid && !isResolvingDocument;
  const isSubmitting = activeMutation.isPending;
  const errorMessages = activeMutation.error?.errorMessages ?? [];

  const entranceIdParam = searchParams.get('entranceId')
    ? parseInt(searchParams.get('entranceId'), 10)
    : null;
  const { data: linkedEntranceData } = useEntrance(entranceIdParam);
  const linkEntranceMutation = useLinkDocumentToEntrance();

  useEffect(() => {
    if (
      entranceIdParam &&
      linkedEntranceData?.id === entranceIdParam &&
      !linkedEntrance
    ) {
      setLinkedEntrance({
        id: entranceIdParam,
        name: linkedEntranceData.name
      });
    }
  }, [linkedEntranceData, entranceIdParam, linkedEntrance, setLinkedEntrance]);

  const submitDocument = () => {
    if (!canSubmit) return;
    if (isNewDocument) createMutation.mutate(document);
    else
      updateMutation.mutate({
        ...document,
        storedLicense: resolvedStoredLicense
      });
  };

  const onFormSubmit = event => {
    event.preventDefault();
    if (isSubmitting || isResolvingDocument) return;
    if (!isFormValid) {
      flagValidationError();
      return;
    }

    // A file is expected for this type but none is attached: ask for
    // confirmation so the user does not forget (they cannot add a file after
    // submission until a moderator validates the document). Files flagged as
    // deleted still remain in the array, so they must be excluded from the count.
    if (rules.expectFile && !hasFile) {
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
    createMutation.reset();
    updateMutation.reset();
    setDocSubmittedWithSuccess(false);
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
    if (document.parent) selectParent(document.parent);
  };

  const createdDocument = createMutation.data?.document;
  useEffect(() => {
    if (!activeMutation.isSuccess) return;
    setDocSubmittedWithSuccess(true);
    if (
      isNewDocument &&
      linkedEntrance &&
      createdDocument &&
      !hasLinked.current
    ) {
      hasLinked.current = true;
      linkEntranceMutation.mutate({
        entranceId: linkedEntrance.id,
        document: createdDocument
      });
    }
    // In the edit flow the parent (DocumentEdit or DocumentValidation modal)
    // handles success — close the modal or navigate away — so the inline
    // "another document" buttons never render. In the create flow onSuccess
    // is undefined and DocumentSubmission owns the post-success UI itself.
    if (!isNewDocument && onSuccess) onSuccess();
  }, [
    activeMutation.isSuccess,
    createdDocument,
    isNewDocument,
    linkedEntrance,
    linkEntranceMutation,
    onSuccess
  ]);

  usePrompt({
    message: formatMessage({ id: DONT_LEAVE_MESSAGE }),
    when: ({ currentLocation, nextLocation }) =>
      permissions.isAuth &&
      !isDocSubmittedWithSuccess &&
      isSubmitting &&
      currentLocation.pathname !== nextLocation.pathname
  });

  return (
    <div>
      {isDocSubmittedWithSuccess && (
        <DocumentSubmissionSuccess
          isArticle={isArticle(document.type)}
          isNewDocument={isNewDocument}
          failedFiles={createMutation.data?.failedFiles}
          onSubmitAnotherArticle={onSubmitAnotherArticle}
          onSubmitAnotherDocument={onSubmitAnotherDocument}
          onFinish={() => navigate(-1)}
        />
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
            isLoading={isSubmitting}
            isNewDocument={isNewDocument}
          />
          <form
            noValidate
            onSubmit={onFormSubmit}
            style={isSubmitting ? { opacity: '0.6' } : undefined}>
            <FormContent
              onCancel={onCancel}
              isSubmitting={isSubmitting}
              isSubmissionBlocked={isResolvingDocument}
              submissionNotice={
                isWaitingForStoredLicense && (
                  <Alert
                    severity={isFetchingLicenses ? 'info' : 'error'}
                    sx={{ mt: 2 }}
                    action={
                      !isFetchingLicenses && (
                        <Button type="button" onClick={() => reloadLicenses()}>
                          {formatMessage({ id: 'Retry' })}
                        </Button>
                      )
                    }>
                    {formatMessage({
                      id: isFetchingLicenses
                        ? 'Loading ...'
                        : 'Error, the document data you are looking for is not available.'
                    })}
                  </Alert>
                )
              }
              fileError={activeMutation.error?.fileError}
            />
          </form>

          <ConfirmationDialog
            open={isMissingFileDialogOpen}
            onClose={() => setMissingFileDialogOpen(false)}
            title={formatMessage({ id: 'Submit without a file?' })}
            onConfirm={onConfirmMissingFile}
            confirmLabel={formatMessage({ id: 'Submit anyway' })}
            color="warning">
            <Alert severity="warning">
              {formatMessage({
                id: 'No file attached — please check that it is not an oversight.'
              })}
            </Alert>
          </ConfirmationDialog>

          {errorMessages.length > 0 && (
            <CenteredBlock>
              {errorMessages.map(error => (
                <Fade in={errorMessages.length > 0} key={error}>
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
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func
};

// Used from:
// - The Application to add a new document (no initialValues)
// - DocumentEdit to edit a existing document (with initialValues)
const HydratedDocumentSubmission = ({
  initialValues,
  persistedDocument,
  onCancel,
  onSuccess,
  allowEntityCreation = true
}) => (
  <DocumentFormProvider
    initialValues={initialValues}
    persistedDocument={persistedDocument}
    allowEntityCreation={allowEntityCreation}>
    <DocumentSubmission onCancel={onCancel} onSuccess={onSuccess} />
  </DocumentFormProvider>
);

HydratedDocumentSubmission.propTypes = {
  allowEntityCreation: PropTypes.bool,
  initialValues: defaultDocumentValuesTypes,
  persistedDocument: defaultDocumentValuesTypes,
  onCancel: PropTypes.func,
  onSuccess: PropTypes.func
};

export default HydratedDocumentSubmission;
