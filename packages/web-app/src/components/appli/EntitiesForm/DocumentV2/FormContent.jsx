import React, { useContext, Suspense } from 'react';
import { styled } from '@mui/material/styles';
import { FormControl, Button, Skeleton } from '@mui/material';

import { useIntl } from 'react-intl';

import { DocumentFormContext } from './Provider';

import DocumentTypeSelect from './formElements/DocumentTypeSelect';
import LanguageAutoComplete from './formElements/LanguageAutoComplete';
import DocumentAutoComplete from './formElements/DocumentAutoComplete';
import MultipleISORegionsSelect from './formElements/MultipleISORegionsSelect';
import MultipleCaversSelect from './formElements/MultipleCaversSelect';
import MultipleSubjectsSelect from './formElements/MultipleSubjectsSelect';
import OrganizationAutoComplete from './formElements/OrganizationAutoComplete';
import PagesEditor from './formElements/PagesEditor';
import IdentifierEditor from './formElements/IdentifierEditor';

import { FormContainer, FormRow } from '../utils/FormContainers';
import AddFileForm from '../../../common/AddFileForm';
import StringInput from '../../../common/Form/StringInput';
import Translate from '../../../common/Translate';
import { useDocumentTypes } from '../../../../hooks';

const PublicationDatePicker = React.lazy(
  () => import('./formElements/PublicationDatePicker')
);

const SubmitButton = styled(Button)`
  display: block;
  margin: auto;
`;

const FormContent = () => {
  const { document, isFormValid, isNewDocument, updateAttribute } =
    useContext(DocumentFormContext);
  const { formatMessage } = useIntl();

  const { isCollection, isArticle, isImage, isIssue, isUnknown } =
    useDocumentTypes();

  return (
    <FormContainer>

      {!isUnknown(document.type) && (
        <>

        <>
        
        </>

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

          <FormControl>
            <SubmitButton
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={!isFormValid}>
              {isNewDocument ? (
                <Translate>Submit</Translate>
              ) : (
                <Translate>Update</Translate>
              )}
            </SubmitButton>
          </FormControl>
        </>
      )}
    </FormContainer>
  );
};

export default FormContent;
