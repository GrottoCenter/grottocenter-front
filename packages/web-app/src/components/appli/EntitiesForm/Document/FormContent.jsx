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
import DocumentFieldError from './DocumentFieldError';
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
  submissionNotice,
  fileError
}) => {
  const {
    document,
    invalidField,
    validationAttempt,
    lengthErrors,
    isNewDocument,
    updateAttribute,
    linkedEntrance,
    hasStoredAuthorization,
    initialType
  } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const firstFieldRef = useRef(null);
  const shouldRevealFirstField = useRef(false);
  const focusedAttempt = useRef(null);
  const prefersReducedMotion = useMediaQuery(
    '(prefers-reduced-motion: reduce)'
  );
  const locale = useSelector(state => state.intl.locale);
  const { data: languages = [] } = useLanguages();
  const userLanguageId =
    languages.find(language => language.part1 === locale)?.id ?? '000';
  const rules = getDocumentTypeRules(document.type);
  const labels = typeLabels[document.type] ?? {};
  useLayoutEffect(() => {
    if (!invalidField || focusedAttempt.current === validationAttempt) return;
    focusedAttempt.current = validationAttempt;
    const root = rootRef.current;
    const field =
      root?.querySelector(`[data-document-field="${invalidField}"]`) ??
      (invalidField === 'sharing'
        ? root?.querySelector('[data-document-field="authors"]')
        : null);
    const control =
      field?.querySelector('[data-validation-focus]') ??
      field?.querySelector(
        'input[aria-invalid="true"]:not([type="hidden"], [aria-hidden="true"], :disabled), textarea[aria-invalid="true"]:not(:disabled)'
      ) ??
      field?.querySelector(
        '[role="combobox"]:not(:disabled, [aria-disabled="true"])'
      ) ??
      field?.querySelector('input[type="radio"]:checked:not(:disabled)') ??
      field?.querySelector('input[type="radio"]:not(:disabled)') ??
      field?.querySelector(
        'input:not([type="hidden"], [type="file"], :disabled), textarea:not(:disabled), [tabindex="0"]:not([aria-disabled="true"]), button:not(:disabled)'
      );
    const target = control ?? field;
    target?.focus({ preventScroll: true });
    target?.scrollIntoView?.({
      block: 'center',
      behavior: 'instant'
    });
  }, [invalidField, validationAttempt]);
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
    <FormContainer
      ref={rootRef}
      sx={{
        '& .MuiInputLabel-root.Mui-error': { color: 'error.dark' },
        '& .MuiAutocomplete-endAdornment button': {
          width: { xs: 44 },
          height: { xs: 44 }
        },
        '& .MuiAutocomplete-hasPopupIcon .MuiFilledInput-root.MuiAutocomplete-inputRoot, & .MuiAutocomplete-hasClearIcon .MuiFilledInput-root.MuiAutocomplete-inputRoot':
          {
            paddingInlineEnd: { xs: 7 }
          },
        '& .MuiAutocomplete-hasPopupIcon.MuiAutocomplete-hasClearIcon .MuiFilledInput-root.MuiAutocomplete-inputRoot':
          {
            paddingInlineEnd: { xs: 12.5 }
          }
      }}>
      {linkedEntrance && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {formatMessage(
            { id: 'This document will be linked to entrance: {name}' },
            { name: <strong>{linkedEntrance.name}</strong> }
          )}
        </Alert>
      )}
      <Box data-document-field="type" tabIndex={-1}>
        <DocumentTypeSelect onTypeChange={changeType} />
        <DocumentFieldError field="type" label="Document type" />
      </Box>
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
              <Box
                data-document-field="files"
                tabIndex={-1}
                ref={rules.allowsFiles ? firstFieldRef : undefined}>
                <AddFileForm
                  files={document.files}
                  setFiles={files => updateAttribute('files', files)}
                  acceptConfig={rules.accept}
                  allowFileAdd={rules.allowsFiles}
                  allowAiAnalysis={rules.allowAiAnalysis}
                  disabled={isSubmitting}
                  fileError={fileError}
                />
                {incompatibleFiles.length === 0 && (
                  <DocumentFieldError field="files" label="Files" />
                )}
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
                data-document-field="title"
                value={document.title}
                errorText={
                  invalidField === 'title' && !document.title?.trim()
                    ? formatMessage({ id: 'A title is required.' })
                    : undefined
                }
                maxLength={TEXT_LENGTH_LIMITS.TITLE}
                onValueChange={value => updateAttribute('title', value)}
                required
              />
              <LanguageSelect
                variant="filled"
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
              <Box data-document-field="parent" tabIndex={-1}>
                <ParentDocumentSelect
                  labelText={formatMessage({ id: rules.parentType })}
                  searchLabelText={formatMessage({
                    id: 'Search for a document...'
                  })}
                  required
                />
              </Box>
            )}
            {rules.hasIssueNumber && (
              <StringInput
                data-document-field="issue"
                valueName={formatMessage({ id: 'Periodical issue' })}
                helperText={formatMessage({
                  id: 'Use the same wording that is used on the document: Vol.12, Number 15, No.158...'
                })}
                maxLength={TEXT_LENGTH_LIMITS.DOCUMENT_ISSUE}
                value={document.issue}
                onValueChange={value => updateAttribute('issue', value)}
              />
            )}
            {rules.hasPages && (
              <Box data-document-field="pages">
                <PagesEditor />
              </Box>
            )}
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
      {submissionNotice}
      <FormActionRow
        submitTestId="document-submit"
        isNew={isNewDocument}
        isSubmitting={isSubmitting}
        disabled={isSubmissionBlocked}
        onCancel={onCancel || (() => navigate(-1))}
      />
    </FormContainer>
  );
};

FormContent.propTypes = {
  fileError: DocumentFileErrorPropTypes,
  isSubmissionBlocked: PropTypes.bool,
  submissionNotice: PropTypes.node,
  onCancel: PropTypes.func,
  isSubmitting: PropTypes.bool
};

export default FormContent;
