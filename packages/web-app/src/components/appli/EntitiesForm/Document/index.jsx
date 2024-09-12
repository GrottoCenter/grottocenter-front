import React, { useContext, useState, useEffect } from 'react';
import { useHistory, Prompt } from 'react-router-dom';
import { Button, Fade, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import ReplayIcon from '@mui/icons-material/Replay';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { styled } from '@mui/material/styles';

import { usePermissions, useDocumentTypes } from '../../../../hooks';
import { resetDocumentApiErrors } from '../../../../actions/Document/ResetApiErrors';
import { postDocument } from '../../../../actions/Document/CreateDocument';
import { updateDocument } from '../../../../actions/Document/UpdateDocument';
import { displayLoginDialog } from '../../../../actions/Login';

import DocumentFormProvider, { DocumentFormContext } from './Provider';
import { defaultDocumentValuesTypes } from './types';
import FromContent from './FormContent';
import CreatingDocumentDialog from './CreatingDocumentDialog';
import Translate from '../../../common/Translate';
import ErrorMessage from '../../../common/StatusMessage/ErrorMessage';

import InternationalizedLink from '../../../common/InternationalizedLink';
import { wikiBBSLinks } from '../../../../conf/externalLinks';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
    margin: ${theme.spacing(1)};
`}
`;

const CenteredBlock = styled('div')`
  text-align: center;
`;

const BbsHeader = styled('div')`
  display: flex;
  align-items: center;
`;

const Spacer = styled('div')`
  height: 20px;
`;

const BbsIcon = styled('img')`
  height: 60px;
  width: 60px;
`;

const BbsInfoText = styled(Typography)`
  flex: 1;
  font-style: italic;
  margin-bottom: 0;
  margin-left: ${({ theme }) => theme.spacing(3)};
`;

const DONT_LEAVE_MESSAGE =
  'If you leave now, some data would be lost. Are you sure you want to leave this page?';

const DocumentSubmission = () => {
  const history = useHistory();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const { isArticle } = useDocumentTypes();
  const { document, isNewDocument, resetContext, updateAttribute } =
    useContext(DocumentFormContext);

  const [isDocSubmittedWithSuccess, setDocSubmittedWithSuccess] =
    useState(false);
  const [isDocSubmitted, setDocSubmitted] = useState(false);

  const documentState = useSelector(state => state.createDocument);

  const onFormSubmit = event => {
    event.preventDefault();

    if (isNewDocument) dispatch(postDocument(document));
    else dispatch(updateDocument(document));
    setDocSubmitted(true);
  };

  const onSubmitAnotherDocument = () => {
    dispatch(resetDocumentApiErrors());
    resetContext();
  };

  const onSubmitAnotherArticle = () => {
    dispatch(resetDocumentApiErrors());
    resetContext();
    // Keep some values to resubmit an article
    updateAttribute('language', document.language);
    updateAttribute('type', document.type);
    updateAttribute('editor', document.editor);
    updateAttribute('library', document.library);
    updateAttribute('parent', document.parent);
    updateAttribute('datePublication', document.datePublication);
  };

  useEffect(() => {
    // Handle Doc Submission
    if (documentState.latestHttpCode === 200 && isDocSubmitted) {
      setDocSubmittedWithSuccess(true);
    } else {
      setDocSubmittedWithSuccess(false);
    }
  }, [isDocSubmittedWithSuccess, documentState.latestHttpCode, isDocSubmitted]);

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
                variant="contained">
                <Translate>Submit another document</Translate>
              </SpacedButton>
              <SpacedButton
                onClick={() => history.push('')}
                variant="contained">
                <Translate>Go to home page</Translate>
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
          <SpacedButton onClick={() => history.push('')} variant="contained">
            <Translate>Go to home page</Translate>
          </SpacedButton>
        </CenteredBlock>
      )}
      {permissions.isAuth && !isDocSubmittedWithSuccess && (
        <>
          <CreatingDocumentDialog isLoading={documentState.isLoading} />
          <Prompt
            when={documentState.isLoading}
            message={formatMessage({ id: DONT_LEAVE_MESSAGE })}
          />

          <hr />
          <form
            onSubmit={onFormSubmit}
            style={documentState.isLoading ? { opacity: '0.6' } : {}}>
            <FromContent />
          </form>

          {document.type === -1 && (
            <BbsHeader>
              <BbsIcon src="/images/bbs_logo.png" alt="BBS logo" />
              <BbsInfoText variant="body1" paragraph>
                <Translate>
                  The BBS is now directly integrated in Grottocenter and
                  provides a summary of any document published on paper or
                  online.
                </Translate>
                <br />
                <InternationalizedLink links={wikiBBSLinks}>
                  <Translate>
                    You can find more info about the BBS on the dedicated
                    Grottocenter-wiki page.
                  </Translate>
                </InternationalizedLink>
              </BbsInfoText>
            </BbsHeader>
          )}

          {documentState.errorMessages.length > 0 && (
            <CenteredBlock>
              {documentState.errorMessages.map(error => (
                <Fade in={documentState.errorMessages.length > 0} key={error}>
                  <ErrorMessage message={formatMessage({ id: error })} />
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
