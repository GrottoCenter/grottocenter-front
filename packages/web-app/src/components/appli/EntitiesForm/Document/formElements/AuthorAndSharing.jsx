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
import { DocumentFormContext } from '../Provider';
import AuthorsSection from './AuthorsSection';
import CollectionPublicationRights from './CollectionPublicationRights';
import DocumentSharing from './DocumentSharing';
import { IS_DELETED } from './AddFileForm/FileHelpers';

const AuthorAndSharing = ({ disabled = false }) => {
  const { formatMessage } = useIntl();
  const { document, isNewDocument, updateAttribute } =
    useContext(DocumentFormContext);
  const { id, nickname } = useUserProperties();
  const [authorChoice, setAuthorChoice] = useState('');
  const addedMeByChoice = useRef(null);
  const authorQuestionId = useId();
  const rules = getDocumentTypeRules(document.type);
  const hasFiles =
    rules.allowsFiles && document.files.some(file => file.state !== IS_DELETED);
  const showSharing = rules.hasFileSharing && hasFiles;
  const showQuestion = isNewDocument && rules.requiresAuthor && !!id;
  const showAuthors = !showQuestion || !!authorChoice;
  const hasCurrentUser = document.authors.some(
    author => String(author.id) === String(id)
  );
  const ownWork = authorChoice === 'me' && hasCurrentUser;

  const chooseAuthor = event => {
    const choice = event.target.value;
    setAuthorChoice(choice);
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
          : 'Authors'
      }>
      <Stack spacing={1.5} sx={{ maxWidth: '48rem' }}>
        {showQuestion && (
          <FormControl component="fieldset" required disabled={disabled}>
            <FormLabel component="legend" id={authorQuestionId}>
              {formatMessage({ id: 'documentForm.authorQuestion' })}
            </FormLabel>
            <RadioGroup
              aria-labelledby={authorQuestionId}
              value={authorChoice}
              onChange={chooseAuthor}>
              <FormControlLabel
                value="me"
                control={
                  <Radio
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
                    size="small"
                    slotProps={{
                      input: { 'data-testid': 'document-author-other' }
                    }}
                  />
                }
                label={formatMessage({ id: 'documentForm.anotherAuthor' })}
              />
            </RadioGroup>
          </FormControl>
        )}
        {showAuthors && <AuthorsSection ownWork={ownWork} />}
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
