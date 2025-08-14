import React, { useContext, useState } from 'react';
import { FormControl, Button, Typography } from '@mui/material';

import { useIntl } from 'react-intl';

import { DocumentFormContext } from './Provider';

import DocumentAutoComplete from './formElements/DocumentAutoComplete';
import AIService from './AIService';
import ParentDocument from './ParentDocument';

import { FormContainer } from '../utils/FormContainers';
import AddFileForm from '../../../common/AddFileForm';
import Translate from '../../../common/Translate';
import { useDocumentTypes } from '../../../../hooks';

const FormWithAIContent = () => {
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();

  const { isArticle, isIssue, isUnknown } = useDocumentTypes();
  const [isProcessing, setIsProcessing] = useState(false);
  const [displayParent, setDisplayParent] = useState(false);

  const handleAIStart = async event => {
    event.preventDefault();
    if (document.files.length > 0) {
      setIsProcessing(true);
    }
  };

  return (
    <FormContainer>
      {!isUnknown(document.type) && (
        <>
          {(isArticle(document.type) || isIssue(document.type)) && (
            <DocumentAutoComplete
              contextValueName="parent"
              helperContent={
                <Translate>
                  The parent document is the document that contains the document
                  you are submitting (an article has a periodical issue as its
                  parent document, a periodical issue has a periodical as its
                  parent document).
                </Translate>
              }
              labelText="Parent document"
              required={isArticle(document.type) || isIssue(document.type)}
              searchLabelText={formatMessage({
                id: 'Search for a document...'
              })}
            />
          )}

          <AddFileForm
            files={document.files}
            setFiles={newFiles => updateAttribute('files', newFiles)}
            option={document.selectOptionAuthorizationDocument}
            setOption={newOption =>
              updateAttribute('selectOptionAuthorizationDocument', newOption)
            }
            setLicense={newLicense => updateAttribute('license', newLicense)}
            setAuthorizationDocument={newAuthorizationDocument =>
              updateAttribute('authorizationDocument', newAuthorizationDocument)
            }
          />

          <FormControl sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={handleAIStart}
              disabled={isProcessing || document.files.length === 0}>
              analyse with AI
            </Button>
          </FormControl>

          <br />
          <AIService
            start={isProcessing}
            files={document.files}
            onDone={() => {
              setDisplayParent(true);
            }}
          />

          {displayParent && (
            <>
              <br />
              <Typography variant="h6">Document information</Typography>
              <ParentDocument />
            </>
          )}
        </>
      )}
    </FormContainer>
  );
};

export default FormWithAIContent;
