import React, { useContext, Suspense } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Skeleton,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { DocumentFormContext } from './Provider';

import DocumentTypeSelect from './formElements/DocumentTypeSelect';
import LanguageSelect from '../../../common/LanguageSelect';
import DocumentAutoComplete from './formElements/DocumentAutoComplete';
import MultipleISORegionsSelect from './formElements/MultipleISORegionsSelect';
import MultipleSubjectsSelect from './formElements/MultipleSubjectsSelect';
import OrganizationAutoComplete from './formElements/OrganizationAutoComplete';
import PagesEditor from './formElements/PagesEditor';
import IdentifierEditor from './formElements/IdentifierEditor';

import { FormActionRow, FormContainer, FormRow } from '../utils/FormContainers';
import AddFileForm from './formElements/AddFileForm';
import StringInput from '../../../common/Form/StringInput';
import Translate from '../../../common/Translate';
import InternationalizedLink from '../../../common/InternationalizedLink';
import { wikiBBSLinks } from '../../../../conf/externalLinks';
import {
  useDocumentTypes,
  DOCUMENT_TYPE_ACCEPT
} from '../../../../hooks/useDocumentTypes';

const PublicationDatePicker = React.lazy(
  () => import('./formElements/PublicationDatePicker')
);

const FormContent = () => {
  const {
    document,
    isFormValid,
    isNewDocument,
    updateAttribute,
    linkedEntrance
  } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const {
    isCollection,
    isArticle,
    isAuthorizationToPublish,
    isEvent,
    isIssue,
    isSimpleMedia,
    isUnknown
  } = useDocumentTypes();

  const locale = useSelector(state => state.intl.locale);
  const { languages } = useSelector(state => state.language);
  const isSubmitting = useSelector(state => state.createDocument.isLoading);
  const userLanguageId = languages.find(l => l.part1 === locale)?.id ?? '000';

  const docType = document.type;
  const simple = isSimpleMedia(docType);
  const acceptConfig = DOCUMENT_TYPE_ACCEPT[docType] ?? null;

  const addFileFormProps = {
    acceptConfig,
    files: document.files,
    setFiles: newFiles => updateAttribute('files', newFiles),
    option: document.selectOptionAuthorizationDocument,
    setOption: newOption =>
      updateAttribute('selectOptionAuthorizationDocument', newOption),
    setLicense: newLicense => updateAttribute('license', newLicense),
    setAuthorizationDocument: newDoc =>
      updateAttribute('authorizationDocument', newDoc)
  };

  const filesIntro = (
    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
      {formatMessage({
        id: 'You can create a document that contains one or several files at once.'
      })}
    </Typography>
  );

  const actionRow = (
    <FormActionRow
      isNew={isNewDocument}
      isSubmitting={isSubmitting}
      disabled={!isFormValid}
      onCancel={() => navigate(-1)}
    />
  );

  return (
    <FormContainer>
      {linkedEntrance && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {formatMessage(
            { id: 'This document will be linked to entrance: {name}' },
            { name: <strong>{linkedEntrance.name}</strong> }
          )}
        </Alert>
      )}

      <DocumentTypeSelect />

      {!isUnknown(docType) && simple && (
        /* Simplified layout for Image / Topographic Drawing — no sections */
        <Box sx={{ mt: 2 }}>
          <FormRow>
            <StringInput
              onValueChange={value => updateAttribute('title', value)}
              value={document.title}
              valueName={formatMessage({ id: 'Title' })}
              required
            />
            <LanguageSelect
              value={
                document.mainLanguage === '000'
                  ? userLanguageId
                  : document.mainLanguage
              }
              onChange={id => updateAttribute('mainLanguage', id)}
              label={formatMessage({ id: 'Document main language' })}
            />
          </FormRow>

          <StringInput
            multiline
            minRows={4}
            onValueChange={value => updateAttribute('description', value)}
            value={document.description}
            valueName={formatMessage({ id: 'Description' })}
          />

          {filesIntro}
          <AddFileForm {...addFileFormProps} />
        </Box>
      )}

      {!isUnknown(docType) && isEvent(docType) && (
        /* Event layout: Title, Description (optional), Event date, ISO location */
        <Box sx={{ mt: 2 }}>
          <StringInput
            onValueChange={value => updateAttribute('title', value)}
            value={document.title}
            valueName={formatMessage({ id: 'Title' })}
            required
          />
          <StringInput
            multiline
            minRows={4}
            onValueChange={value => updateAttribute('description', value)}
            value={document.description}
            valueName={formatMessage({ id: 'Description' })}
          />
          <Suspense
            fallback={
              <>
                <Skeleton width={125} />
                <Skeleton width={75} />
              </>
            }>
            <PublicationDatePicker
              required
              label={formatMessage({ id: 'Event date' })}
            />
          </Suspense>
          <MultipleISORegionsSelect
            computeHasError={() => false}
            contextValueName="iso3166"
            helperText={formatMessage({
              id: 'If the document relates to one or more countries or regions.'
            })}
            labelName="ISO countries or regions"
            required={false}
          />
        </Box>
      )}

      {!isUnknown(docType) && isAuthorizationToPublish(docType) && (
        /* Authorization To Publish layout: Title, Language, Description (optional), Date, Files (no license) */
        <Box sx={{ mt: 2 }}>
          <FormRow>
            <StringInput
              onValueChange={value => updateAttribute('title', value)}
              value={document.title}
              valueName={formatMessage({ id: 'Title' })}
              required
            />
            <LanguageSelect
              value={
                document.mainLanguage === '000'
                  ? userLanguageId
                  : document.mainLanguage
              }
              onChange={id => updateAttribute('mainLanguage', id)}
              label={formatMessage({ id: 'Document main language' })}
            />
          </FormRow>

          <StringInput
            multiline
            minRows={4}
            onValueChange={value => updateAttribute('description', value)}
            value={document.description}
            valueName={formatMessage({ id: 'Description' })}
          />

          <Suspense
            fallback={
              <>
                <Skeleton width={125} />
                <Skeleton width={75} />
              </>
            }>
            <PublicationDatePicker
              label={formatMessage({ id: 'Authorization date' })}
            />
          </Suspense>

          {filesIntro}
          <AddFileForm {...addFileFormProps} showAuthorization={false} />
        </Box>
      )}

      {!isUnknown(docType) &&
        !simple &&
        !isEvent(docType) &&
        !isAuthorizationToPublish(docType) && (
          <Box sx={{ mt: 2 }}>
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
              <LanguageSelect
                value={
                  document.mainLanguage === '000'
                    ? userLanguageId
                    : document.mainLanguage
                }
                onChange={id => updateAttribute('mainLanguage', id)}
                label={formatMessage({ id: 'Document main language' })}
              />
            </FormRow>

            <StringInput
              helperText={formatMessage({
                id: 'Make a precise sentence that is pleasant to read and uses keywords.'
              })}
              multiline
              minRows={4}
              onValueChange={value => updateAttribute('description', value)}
              required
              value={document.description}
              valueName={formatMessage({ id: 'Summary of document content' })}
            />

            {(isArticle(docType) || isIssue(docType)) && (
              <DocumentAutoComplete
                contextValueName="parent"
                helperContent={
                  <Translate>
                    The parent document is the document that contains the
                    document you are submitting (an article has a periodical
                    issue as its parent document, a periodical issue has a
                    periodical as its parent document).
                  </Translate>
                }
                labelText={formatMessage({ id: 'Parent document' })}
                required
                searchLabelText={formatMessage({
                  id: 'Search for a document...'
                })}
              />
            )}

            {isArticle(docType) && <PagesEditor />}

            {filesIntro}
            <AddFileForm {...addFileFormProps} />
          </Box>
        )}

      {!isUnknown(docType) &&
        !isEvent(docType) &&
        !isAuthorizationToPublish(docType) && (
          <Accordion
            disableGutters
            elevation={0}
            sx={{
              mt: 3,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              '&:before': { display: 'none' }
            }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" color="text.secondary">
                {formatMessage({ id: 'Advanced metadata' })}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              {!isCollection(docType) && (
                <Suspense
                  fallback={
                    <>
                      <Skeleton width={125} />
                      <Skeleton width={75} />
                      <Skeleton width={100} />
                    </>
                  }>
                  <PublicationDatePicker />
                </Suspense>
              )}

              <IdentifierEditor />

              <FormRow>
                <OrganizationAutoComplete
                  contextValueName="editor"
                  helperContent={
                    <Translate>
                      The editor is the organization that ensures the
                      publication of the document. Choose one or more
                      organizations from those already registered. If the
                      organization you are looking for does not exist in
                      Grottocenter, you can add it by using the + button on the
                      right.
                    </Translate>
                  }
                  helperContentIfValueIsForced={
                    <Translate>
                      The editor has been deduced from the parent document.
                    </Translate>
                  }
                  labelText={formatMessage({ id: 'Editor' })}
                  searchLabelText={formatMessage({
                    id: 'Search for an editor...'
                  })}
                />

                {(isIssue(docType) || isArticle(docType)) && (
                  <OrganizationAutoComplete
                    contextValueName="library"
                    helperContent={
                      <Translate>
                        The library is the place where the document can be
                        consulted. Choose an organization from those already
                        registered at Grottocenter. If the organization you are
                        looking for does not exist in Grottocenter, you can add
                        it by using the + button on the right.
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
                          registered at Grottocenter. If the organization you
                          are looking for does not exist in Grottocenter, you
                          can add it by using the + button on the right.
                        </Translate>
                      </>
                    }
                    labelText={formatMessage({ id: 'Library' })}
                    required={false}
                    searchLabelText={formatMessage({
                      id: 'Search for a library...'
                    })}
                  />
                )}
              </FormRow>

              {isIssue(docType) && (
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

              <MultipleISORegionsSelect
                computeHasError={() => false}
                contextValueName="iso3166"
                helperText={formatMessage({
                  id: 'If the document relates to one or more countries or regions.'
                })}
                labelName="ISO countries or regions"
                required={false}
              />

              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mt: 1, mb: 0.5 }}>
                <Translate>
                  The BBS is now directly integrated in Grottocenter and
                  provides a summary of any document published on paper or
                  online.
                </Translate>{' '}
                <InternationalizedLink links={wikiBBSLinks}>
                  <Translate>
                    You can find more info about the BBS on the dedicated
                    Grottocenter-wiki page.
                  </Translate>
                </InternationalizedLink>
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                sx={{ mb: 0.5 }}>
                {formatMessage({
                  id: 'Choose one or more subjects from those defined by the BBS. The list of subjects and their description is available here'
                })}{' '}
                <a
                  href="https://www.ssslib.ch/bbs/wp-content/uploads/2017/03/chapter_and_geo_1_2008.pdf"
                  target="_blank"
                  rel="noopener noreferrer">
                  chapter_and_geo_1_2008.pdf
                </a>
              </Typography>
              <MultipleSubjectsSelect
                computeHasError={() => false}
                contextValueName="subjects"
                labelName="BBS subjects"
              />

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
            </AccordionDetails>
          </Accordion>
        )}

      {actionRow}
    </FormContainer>
  );
};

export default FormContent;
