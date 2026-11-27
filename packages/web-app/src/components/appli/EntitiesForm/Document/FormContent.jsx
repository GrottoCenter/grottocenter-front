import {
  lazy,
  Suspense,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef
} from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, Skeleton, Stack, useMediaQuery } from '@mui/material';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import LanguageSelect from '@/components/common/LanguageSelect';
import StringInput from '@/components/common/Form/StringInput';
import { useLanguages } from '@/hooks';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import {
  DocumentTypes,
  getDocumentTypeRules
} from '@/utils/documentTypeHelpers';
import { DocumentFileErrorPropTypes } from '@/types/document.type';
import { FormActionRow, FormContainer } from '../utils/FormContainers';
import AdvancedDocumentMetadata from './AdvancedDocumentMetadata';
import { DocumentFormContext, getIncompatibleFiles } from './Provider';
import AddFileForm from './formElements/AddFileForm';
import AuthorAndSharing from './formElements/AuthorAndSharing';
import DocumentRegions from './formElements/DocumentRegions';
import DocumentTypeSelect from './formElements/DocumentTypeSelect';
import GrantedLicenseField from './formElements/GrantedLicenseField';
import PagesEditor from './formElements/PagesEditor';
import ParentDocumentSelect from './formElements/ParentDocumentSelect';

const PublicationDatePicker = lazy(
  () => import('./formElements/PublicationDatePicker')
);

const typeLabels = {
  [DocumentTypes.IMAGE]: {
    description: 'documentForm.imageDescription',
    date: 'documentForm.photoDate'
  },
  [DocumentTypes.TOPOGRAPHIC_DRAWING]: {
    description: 'documentForm.drawingDescription'
  },
  [DocumentTypes.TOPOGRAPHIC_DATA]: {
    description: 'documentForm.surveyDescription'
  },
  [DocumentTypes.EVENT]: {
    title: 'documentForm.eventName',
    date: 'Event date'
  },
  [DocumentTypes.AUTHORIZATION_TO_PUBLISH]: { date: 'Authorization date' }
};

const FormContent = ({
  onCancel,
  isSubmitting = false,
  isSubmissionBlocked = false,
  fileError
}) => {
  const {
    document,
    isFormValid,
    lengthErrors,
    isNewDocument,
    updateAttribute,
    linkedEntrance,
    hasStoredAuthorization,
    initialType
  } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const firstFieldRef = useRef(null);
  const shouldRevealFirstField = useRef(false);
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)'
  );
  const locale = useSelector(state => state.intl.locale);
  const { data: languages = [] } = useLanguages();
  const userLanguageId =
    languages.find(language => language.part1 === locale)?.id ?? '000';
  const rules = getDocumentTypeRules(document.type);
  const labels = typeLabels[document.type] ?? {};
  const incompatibleFiles = getIncompatibleFiles(document);
  const blockedByStoredRights =
    hasStoredAuthorization &&
    document.type !== initialType &&
    !rules.hasFileSharing &&
    !rules.hasCollectionSharing;

  const changeType = (type, event) => {
    shouldRevealFirstField.current = event.detail > 0;
    updateAttribute('type', type);
  };

  useLayoutEffect(() => {
    if (!shouldRevealFirstField.current) return;
    shouldRevealFirstField.current = false;
    firstFieldRef.current?.scrollIntoView?.({
      block: 'nearest',
      inline: 'nearest',
      behavior: prefersReducedMotion ? 'instant' : 'smooth'
    });
  }, [document.type, prefersReducedMotion]);

  useEffect(() => {
    if (
      isNewDocument &&
      document.mainLanguage === '000' &&
      userLanguageId !== '000'
    ) {
      updateAttribute('mainLanguage', userLanguageId);
    }
  }, [document.mainLanguage, isNewDocument, userLanguageId, updateAttribute]);

  return (
    <FormContainer>
      {linkedEntrance && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {formatMessage(
            { id: 'This document will be linked to entrance: {name}' },
            { name: <strong>{linkedEntrance.name}</strong> }
          )}
        </Alert>
      )}
      <DocumentTypeSelect onTypeChange={changeType} />
      {lengthErrors.length > 0 && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {lengthErrors.map(({ field, label, limit, count }) => (
            <Box key={field}>
              {formatMessage({ id: label })}{' '}
              {formatMessage({ id: 'form.maxLength' }, { limit, count })}
            </Box>
          ))}
        </Alert>
      )}
      {rules.hasType && (
        <>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {incompatibleFiles.length > 0 && (
              <Alert severity="warning">
                {formatMessage(
                  { id: 'documentForm.incompatibleFiles' },
                  {
                    files: incompatibleFiles
                      .map(file => file.fileName)
                      .join(', ')
                  }
                )}
              </Alert>
            )}
            {(rules.allowsFiles || incompatibleFiles.length > 0) && (
              <Box ref={rules.allowsFiles ? firstFieldRef : undefined}>
                <AddFileForm
                  files={document.files}
                  setFiles={files => updateAttribute('files', files)}
                  acceptConfig={rules.accept}
                  allowFileAdd={rules.allowsFiles}
                  allowAiAnalysis={rules.allowAiAnalysis}
                  disabled={isSubmitting}
                  fileError={fileError}
                />
              </Box>
            )}
            <Box
              ref={rules.allowsFiles ? undefined : firstFieldRef}
              sx={{
                display: 'grid',
                gap: 1.5,
                gridTemplateColumns: {
                  xs: 'minmax(0, 1fr)',
                  sm: 'minmax(0, 2fr) minmax(0, 1fr)'
                }
              }}>
              <StringInput
                valueName={formatMessage({ id: labels.title ?? 'Title' })}
                data-testid="document-title"
                value={document.title}
                maxLength={TEXT_LENGTH_LIMITS.TITLE}
                onValueChange={value => updateAttribute('title', value)}
                required
              />
              <LanguageSelect
                value={document.mainLanguage}
                onChange={value => updateAttribute('mainLanguage', value)}
                label={formatMessage({ id: 'Document main language' })}
              />
            </Box>
            <StringInput
              data-testid="document-description"
              valueName={formatMessage({
                id: labels.description ?? 'Description'
              })}
              value={document.description}
              onValueChange={value => updateAttribute('description', value)}
              multiline
              minRows={3}
            />
            {rules.parentType && (
              <ParentDocumentSelect
                labelText={formatMessage({ id: rules.parentType })}
                searchLabelText={formatMessage({
                  id: 'Search for a document...'
                })}
                required
              />
            )}
            {rules.hasIssueNumber && (
              <StringInput
                valueName={formatMessage({ id: 'Periodical issue' })}
                helperText={formatMessage({
                  id: 'Use the same wording that is used on the document: Vol.12, Number 15, No.158...'
                })}
                maxLength={TEXT_LENGTH_LIMITS.DOCUMENT_ISSUE}
                value={document.issue}
                onValueChange={value => updateAttribute('issue', value)}
              />
            )}
            {rules.hasPages && <PagesEditor />}
            {rules.hasDate && (
              <Suspense fallback={<Skeleton height={60} />}>
                <PublicationDatePicker
                  required={rules.requiresDate}
                  allowFuture={rules.requiresDate}
                  label={formatMessage({
                    id: labels.date ?? 'DatePublication'
                  })}
                />
              </Suspense>
            )}
            {rules.requiresDate && <DocumentRegions />}
            {rules.hasGrantedLicense && (
              <GrantedLicenseField disabled={isSubmitting} />
            )}
            {blockedByStoredRights && (
              <Alert severity="warning">
                {formatMessage({
                  id: 'documentForm.incompatibleAuthorization'
                })}
              </Alert>
            )}
          </Stack>
          <AuthorAndSharing disabled={isSubmitting} />
          {rules.hasAdvancedMetadata && <AdvancedDocumentMetadata />}
        </>
      )}
      <FormActionRow
        submitTestId="document-submit"
        isNew={isNewDocument}
        isSubmitting={isSubmitting}
        disabled={!isFormValid || isSubmissionBlocked}
        onCancel={onCancel || (() => navigate(-1))}
      />
    </FormContainer>
  );
};

FormContent.propTypes = {
  fileError: DocumentFileErrorPropTypes,
  isSubmissionBlocked: PropTypes.bool,
  onCancel: PropTypes.func,
  isSubmitting: PropTypes.bool
};

export default FormContent;
