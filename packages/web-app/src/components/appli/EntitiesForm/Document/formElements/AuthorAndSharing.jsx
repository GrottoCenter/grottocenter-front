import { useContext, useId, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from '@mui/material';
import { useUserProperties } from '@/hooks';
import { getDocumentTypeRules } from '@/utils/documentTypeHelpers';
import { FormSection } from '../../utils/FormContainers';
import DocumentFieldError from '../DocumentFieldError';
import { DocumentFormContext } from '../Provider';
import AuthorsSection from './AuthorsSection';
import CollectionPublicationRights from './CollectionPublicationRights';
import DocumentSharing from './DocumentSharing';
import {
  AUTHORIZATION_FROM_AUTHOR,
  IS_DELETED
} from './AddFileForm/FileHelpers';

const AuthorAndSharing = ({ disabled = false }) => {
  const { formatMessage } = useIntl();
  const {
    document,
    isNewDocument,
    hasStoredAuthorization,
    invalidField,
    updateAttribute
  } = useContext(DocumentFormContext);
  const { id, nickname } = useUserProperties();
  const [authorChoice, setAuthorChoice] = useState('');
  const addedMeByChoice = useRef(null);
  const authorQuestionId = useId();
  const rules = getDocumentTypeRules(document.type);
  const hasFiles =
    rules.allowsFiles && document.files.some(file => file.state !== IS_DELETED);
  const showSharing =
    rules.hasFileSharing &&
    (hasFiles ||
      hasStoredAuthorization ||
      !!document.authorizationDocument?.id);
  const showQuestion =
    isNewDocument && rules.hasFileSharing && hasFiles && !!id;
  const hasCurrentUser = document.authors.some(
    author => String(author.id) === String(id)
  );
  const selectedAuthor =
    authorChoice === 'me' && !hasCurrentUser ? 'other' : authorChoice;
  const showAuthors = !showQuestion || !!selectedAuthor;
  const hasAuthorChoiceError =
    !showAuthors && ['authors', 'sharing'].includes(invalidField);
  const ownWork = showQuestion && selectedAuthor === 'me';

  const chooseAuthor = event => {
    const choice = event.target.value;
    setAuthorChoice(choice);
    const option = document.selectOptionAuthorizationDocument;
    if (
      choice === 'me' &&
      option &&
      option !== AUTHORIZATION_FROM_AUTHOR &&
      !document.inheritedPublicationRights
    ) {
      updateAttribute('authorizationDocument', null);
      updateAttribute('selectOptionAuthorizationDocument', null);
      updateAttribute('license', null);
    }
    if (choice === 'me' && !hasCurrentUser) {
      const author = { id, nickname };
      addedMeByChoice.current = author;
      updateAttribute('authors', [...document.authors, author]);
    }
    if (choice === 'other' && addedMeByChoice.current) {
      const addedAuthor = addedMeByChoice.current;
      addedMeByChoice.current = null;
      updateAttribute(
        'authors',
        document.authors.filter(author => author !== addedAuthor)
      );
    }
  };

  return (
    <FormSection
      title={
        showSharing || rules.hasCollectionSharing
          ? 'documentForm.authorAndSharing'
          : undefined
      }>
      <Stack spacing={1.5} sx={{ maxWidth: '48rem' }}>
        <Stack spacing={1} data-document-field="authors">
          {showQuestion && (
            <FormControl
              component="fieldset"
              required
              disabled={disabled}
              error={hasAuthorChoiceError}>
              <FormLabel
                component="legend"
                id={authorQuestionId}
                sx={{ fontWeight: 600 }}>
                {formatMessage({ id: 'documentForm.authorQuestion' })}
              </FormLabel>
              <RadioGroup
                aria-labelledby={authorQuestionId}
                aria-invalid={hasAuthorChoiceError || undefined}
                aria-describedby={
                  hasAuthorChoiceError ? `${authorQuestionId}-error` : undefined
                }
                value={selectedAuthor}
                sx={{
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 0, sm: 2 }
                }}
                onChange={chooseAuthor}>
                <FormControlLabel
                  value="me"
                  control={
                    <Radio
                      sx={{ minWidth: 44, minHeight: 44 }}
                      size="small"
                      slotProps={{
                        input: { 'data-testid': 'document-author-me' }
                      }}
                    />
                  }
                  label={formatMessage({ id: 'documentForm.me' })}
                />
                <FormControlLabel
                  value="other"
                  control={
                    <Radio
                      sx={{ minWidth: 44, minHeight: 44 }}
                      size="small"
                      slotProps={{
                        input: { 'data-testid': 'document-author-other' }
                      }}
                    />
                  }
                  label={formatMessage({ id: 'documentForm.anotherAuthor' })}
                />
              </RadioGroup>
              {hasAuthorChoiceError && (
                <DocumentFieldError
                  field={invalidField}
                  id={`${authorQuestionId}-error`}
                  label="Authors"
                />
              )}
            </FormControl>
          )}
          {showAuthors && (
            <AuthorsSection ownWork={ownWork} showHelp={!showQuestion} />
          )}
        </Stack>
        {rules.hasCollectionSharing && (
          <>
            <Divider />
            <Typography variant="body2" color="text.secondary">
              {formatMessage({ id: 'documentForm.collectionSharing' })}
            </Typography>
            <CollectionPublicationRights disabled={disabled} />
          </>
        )}
        {showAuthors && showSharing && (
          <>
            <Divider />
            <DocumentSharing ownWork={ownWork} disabled={disabled} />
          </>
        )}
      </Stack>
    </FormSection>
  );
};

AuthorAndSharing.propTypes = { disabled: PropTypes.bool };

export default AuthorAndSharing;
