import React, { useContext, Suspense } from 'react';
import styled from 'styled-components';
import { FormControl, Button } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import { useIntl } from 'react-intl';

import { DocumentFormContext } from './Provider';

import DocumentTypeSelect from './formElements/DocumentTypeSelect';
import LanguageSelect from './formElements/LanguageSelect';
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

const PublicationDatePicker = React.lazy(() =>
  import('./formElements/PublicationDatePicker')
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
      <DocumentTypeSelect helperText="Choose from the types of documents available." />

      {!isUnknown(document.type) && (
        <>
          <FormRow>
            <StringInput
              helperText={formatMessage({
                id: 'Copy the title of the text as it is. In its absence, put a fictitious title between [].'
              })}
              onValueChange={value => updateAttribute('title', value)}
              value={document.title}
              valueName={formatMessage({ id: 'Title' })}
              required
            />
            {!isUnknown(document.type) && !isImage(document.type) && (
              <LanguageSelect
                contextValueName="mainLanguage"
                labelText="Document main language"
                // required={!isOther(document.type)}
              />
            )}
          </FormRow>

          <StringInput
            helperText={formatMessage({
              id: 'Make a precise sentence that is pleasant to read and uses keywords.'
            })}
            multiline
            onValueChange={value => updateAttribute('description', value)}
            required
            value={document.description}
            valueName={formatMessage({
              id: 'Summary of document content'
            })}
          />

          {isIssue(document.type) && (
            <StringInput
              helperText={formatMessage({
                id: 'Use the same wording that is used on the document: Vol.12, Number 15, No.158...'
              })}
              multiline={false}
              onValueChange={newValue => updateAttribute('issue', newValue)}
              value={document.issue ?? ''}
              valueName={formatMessage({ id: 'Periodical issue' })}
            />
          )}

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

          <MultipleCaversSelect
            computeHasError={() => false}
            contextValueName="authors"
            helperText="Choose one or more authors among those already registered. If the author you are looking for does not exist in Grottocenter, it is possible to add him/her using the “+” button on the right."
            labelName="Authors"
            // required={isOther(document.type) || isArticle(document.type)}
          />

          <FormRow>
            <OrganizationAutoComplete
              contextValueName="editor"
              helperContent={
                <Translate>
                  The editor is the organization that ensures the publication of
                  the document. Choose one or more organizations from those
                  already registered. If the organization you are looking for
                  does not exist in Grottocenter, you can add it by using the
                  “+” button on the right.
                </Translate>
              }
              helperContentIfValueIsForced={
                <Translate>
                  The editor has been deduced from the parent document.
                </Translate>
              }
              labelText="Editor"
              searchLabelText={formatMessage({
                id: 'Search for an editor...'
              })}
            />

            {(isIssue(document.type) || isArticle(document.type)) && (
              <OrganizationAutoComplete
                contextValueName="library"
                helperContent={
                  <Translate>
                    The library is the place where the document can be
                    consulted. Choose an organization from those already
                    registered at Grottocenter. If the organization you are
                    looking for does not exist in Grottocenter, you can add it
                    by using the “+” button on the right.
                  </Translate>
                }
                helperContentIfValueIsForced={
                  <>
                    <Translate>
                      The library has been deduced from the parent document.
                    </Translate>
                    <br />
                    <Translate>
                      The library is the place where the document can be
                      consulted. Choose an organization from those already
                      registered at Grottocenter. If the organization you are
                      looking for does not exist in Grottocenter, you can add it
                      by using the “+” button on the right.
                    </Translate>
                  </>
                }
                labelText="Library"
                required={false}
                searchLabelText={formatMessage({
                  id: 'Search for a library...'
                })}
              />
            )}
          </FormRow>

          <MultipleISORegionsSelect
            computeHasError={() => false}
            contextValueName="iso3166"
            helperText="If the document relates to one or more countries or regions."
            labelName="ISO countries or regions"
            required={false}
          />

          <MultipleSubjectsSelect
            computeHasError={() => false}
            contextValueName="subjects"
            helperText="Choose one or more subjects from those defined by the BBS. The list of subjects and their description is available here => https://www.ssslib.ch/bbs/wp-content/uploads/2017/03/chapter_and_geo_1_2008.pdf."
            labelName="BBS subjects"
            // required={isArticle(document.type)}
          />

          {/* {(isArticle(document.type) || isOther(document.type)) && (
            <MassifAutoComplete // TODO Move to massif page (Main entity that can be linked to a document, should manage the link on their page)
              contextValueName="massif"
              helperContent={
                <Translate>
                  If the document relates to a massif, choose from those already
                  registered in Grottocenter.
                </Translate>
              }
              labelText="Massif"
              required={false}
              searchLabelText={formatMessage({
                id: 'Search for a massif...'
              })}
            />
        )} */}

          {isArticle(document.type) && <PagesEditor />}

          {!isCollection(document.type) && (
            <Suspense
              fallback={
                <>
                  <Skeleton width={125} />
                  <Skeleton width={75} />
                  <Skeleton width={100} />
                </>
              }>
              {/* Async as it load the full date-fns library */}
              <PublicationDatePicker />
            </Suspense>
          )}

          <IdentifierEditor />

          <StringInput
            hasError={false}
            helperText={formatMessage({
              id: 'Additional information about the document.'
            })}
            onValueChange={newValue =>
              updateAttribute('creatorComment', newValue)
            }
            value={document.creatorComment ?? ''}
            valueName={formatMessage({ id: 'Comment' })}
          />

          <AddFileForm
            files={document.files}
            setFiles={newFiles => updateAttribute('files', newFiles)}
            option={document.option}
            setOption={newOption => updateAttribute('option', newOption)}
            license={document.license}
            setLicense={newLicense => updateAttribute('license', newLicense)}
            authorizationDocument={document.authorizationDocument}
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
