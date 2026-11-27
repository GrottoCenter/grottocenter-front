import { useContext, useId, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, Menu, MenuItem, Stack } from '@mui/material';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import FieldHelperText from '@/components/common/Form/FieldHelperText';
import RelatedEntityDialog from '@/components/appli/EntitiesForm/RelatedEntityDialog';
import CreatableAutocomplete from '@/components/common/AutoCompleteSearch/CreatableAutocomplete';
import EntityAutocompleteInput from '@/components/common/AutoCompleteSearch/EntityAutocompleteInput';
import DocumentAuthorLabel from '@/components/common/DocumentAuthorLabel';
import { entityOptionForSelector } from '@/helpers/Entity';
import { useEntitySearch, useUserProperties } from '@/hooks';
import { PROTECTED_AUTHOR_LABEL_IDS } from '@/utils/personConstants';
import { DEFAULT_PERSON_TYPE } from '@/utils/personTypes';
import { useRestoreFieldFocus } from '@/hooks/useRestoreFieldFocus';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '@/conf/config';
import { requiresDocumentAuthor } from '@/utils/documentTypeHelpers';
import { DocumentFormContext } from '@/components/appli/EntitiesForm/Document/Provider';

const MIXED_ENTITIES = ['persons', 'organizations'];

const getOptionLabel = option =>
  (option._type === 'organizations' ? option.name : option.nickname) || '';

const isFallbackAuthor = author =>
  author?._type === 'persons' &&
  Object.hasOwn(PROTECTED_AUTHOR_LABEL_IDS, author.id);

const stripType = ({ _type, ...rest }) => rest;

const AuthorsSection = ({ ownWork = false, showHelp = true }) => {
  const { formatMessage } = useIntl();
  const {
    document: doc,
    invalidField,
    updateAttribute,
    allowEntityCreation = true
  } = useContext(DocumentFormContext);
  const { id, nickname } = useUserProperties();
  const requiresAuthor = requiresDocumentAuthor(doc.type);
  const value = useMemo(
    () => [
      ...doc.authors.map(author => {
        const option = { ...author, _type: 'persons' };
        if (isFallbackAuthor(option)) {
          return {
            ...option,
            nickname: formatMessage({
              id: PROTECTED_AUTHOR_LABEL_IDS[author.id]
            }),
            type: 'AUTHOR'
          };
        }
        if (id != null && String(author.id) === String(id)) {
          return { ...option, type: DEFAULT_PERSON_TYPE };
        }
        return option;
      }),
      ...doc.authorsOrganization.map(o => ({ ...o, _type: 'organizations' }))
    ],
    [doc.authors, doc.authorsOrganization, formatMessage, id]
  );

  const {
    inputValue,
    setInputValue,
    results,
    isLoading,
    hasError,
    hasSearched
  } = useEntitySearch(MIXED_ENTITIES);

  const [creation, setCreation] = useState(null);
  const [fallbackAnchor, setFallbackAnchor] = useState(null);
  const fallbackButtonId = useId();
  const fallbackMenuId = useId();
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);
  useRestoreFieldFocus(creation !== null, inputRef, wrapperRef);

  const applyValue = newValue => {
    const knownAuthors = newValue.filter(author => !isFallbackAuthor(author));
    const selected = knownAuthors.length ? knownAuthors : newValue;
    updateAttribute(
      'authors',
      selected.filter(v => v._type === 'persons').map(stripType)
    );
    updateAttribute(
      'authorsOrganization',
      selected.filter(v => v._type === 'organizations').map(stripType)
    );
  };

  const hasPerson = personId =>
    doc.authors.some(author => String(author.id) === String(personId));

  const handleChange = (_event, newValue, reason, details) => {
    if (reason === 'selectOption' && isFallbackAuthor(details?.option)) {
      applyValue([details.option]);
    } else {
      applyValue(newValue);
    }
  };

  const selectFallback = (personId, label) => {
    applyValue([
      {
        id: Number(personId),
        nickname: formatMessage({ id: label }),
        _type: 'persons'
      }
    ]);
    setInputValue('');
    setFallbackAnchor(null);
  };

  const handleInputChange = (_event, newValue, reason) => {
    setInputValue(reason === 'reset' || reason === 'clear' ? '' : newValue);
  };

  const handleOpenCreate = entityType => {
    setCreation({ entityType, name: inputValue.trim() });
  };

  const handleEntitySelected = entity => {
    const typed = { ...entity, _type: creation.entityType };
    if (
      !value.some(
        item =>
          String(item.id) === String(entity.id) && item._type === typed._type
      )
    ) {
      applyValue([...value, typed]);
    }
    setInputValue('');
    setCreation(null);
  };

  const emptyText =
    inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARACTERS
      ? formatMessage({ id: 'No results' })
      : formatMessage(
          {
            id: 'Type at least {nbOfChars} character(s)',
            defaultMessage: 'Type at least {nbOfChars} character(s)'
          },
          { nbOfChars: AUTOCOMPLETE_MIN_CHARACTERS }
        );

  return (
    <Box ref={wrapperRef} data-testid="document-authors">
      {!ownWork && showHelp && (
        <FieldHelperText>
          {formatMessage({ id: 'entityCreation.authorsHelp' })}
        </FieldHelperText>
      )}

      <CreatableAutocomplete
        clearOnBlur={false}
        creationActions={
          allowEntityCreation && hasSearched
            ? [
                {
                  id: 'person',
                  iconType: 'author',
                  label: formatMessage({ id: 'entityCreation.author' }),
                  onClick: () => handleOpenCreate('persons'),
                  testId: 'create-author-search-button'
                },
                {
                  id: 'organization',
                  iconType: 'organization',
                  label: formatMessage({ id: 'entityCreation.organization' }),
                  onClick: () => handleOpenCreate('organizations'),
                  testId: 'create-author-organization-search-button'
                }
              ]
            : []
        }
        multiple
        value={value}
        options={results}
        onChange={handleChange}
        onInputChange={handleInputChange}
        inputValue={inputValue}
        loading={isLoading}
        getOptionLabel={getOptionLabel}
        renderOption={entityOptionForSelector}
        isOptionEqualToValue={(option, val) =>
          String(option.id) === String(val.id) && option._type === val._type
        }
        filterSelectedOptions
        renderValue={(tagValue, getItemProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getItemProps({ index })}
              key={`${option._type}-${option.id}`}
              data-testid={`document-author-${option._type}-${option.id}`}
              color="primary"
              label={
                <DocumentAuthorLabel
                  author={option}
                  entityType={option._type}
                  showPersonType={false}
                />
              }
            />
          ))
        }
        noOptionsText={
          hasError
            ? formatMessage({ id: 'entityCreation.searchFailed' })
            : emptyText
        }
        renderInput={params => (
          <EntityAutocompleteInput
            params={params}
            inputRef={inputRef}
            label={formatMessage({ id: 'Authors' })}
            required={requiresAuthor && value.length === 0}
            hasError={hasError}
            errorMessage={
              invalidField === 'authors'
                ? formatMessage(
                    { id: 'documentForm.checkField' },
                    { field: formatMessage({ id: 'Authors' }) }
                  )
                : undefined
            }
            loading={isLoading}
          />
        )}
      />
      {!ownWork && (
        <Stack
          direction="row"
          useFlexGap
          spacing={0.5}
          sx={{ mt: 0.5, flexWrap: 'wrap' }}>
          {id && !hasPerson(id) && (
            <Button
              type="button"
              size="small"
              variant="text"
              startIcon={<PersonAddOutlinedIcon />}
              sx={{ textTransform: 'none', minHeight: { xs: 44, sm: 36 } }}
              onClick={() =>
                applyValue([...value, { id, nickname, _type: 'persons' }])
              }>
              {formatMessage({ id: 'documentForm.addMe' })}
            </Button>
          )}
          <Button
            id={fallbackButtonId}
            type="button"
            size="small"
            variant="text"
            color="inherit"
            startIcon={<HelpOutlineOutlinedIcon />}
            aria-haspopup="menu"
            aria-controls={fallbackAnchor ? fallbackMenuId : undefined}
            aria-expanded={!!fallbackAnchor}
            onClick={event => setFallbackAnchor(event.currentTarget)}
            sx={{
              marginInlineStart: 'auto',
              textTransform: 'none',
              minHeight: { xs: 44, sm: 36 }
            }}>
            {formatMessage({ id: 'authorDuplicates.unknownAuthor' })}
          </Button>
          <Menu
            id={fallbackMenuId}
            anchorEl={fallbackAnchor}
            open={!!fallbackAnchor}
            onClose={() => setFallbackAnchor(null)}
            slotProps={{ list: { 'aria-labelledby': fallbackButtonId } }}>
            {Object.entries(PROTECTED_AUTHOR_LABEL_IDS).map(
              ([personId, label]) => (
                <MenuItem
                  key={personId}
                  onClick={() => selectFallback(personId, label)}>
                  {formatMessage({ id: label })}
                </MenuItem>
              )
            )}
          </Menu>
        </Stack>
      )}
      {allowEntityCreation && creation && (
        <RelatedEntityDialog
          entityType={creation.entityType}
          defaultName={creation.name}
          onSelect={handleEntitySelected}
          onClose={() => setCreation(null)}
        />
      )}
    </Box>
  );
};

AuthorsSection.propTypes = {
  ownWork: PropTypes.bool,
  showHelp: PropTypes.bool
};

export default AuthorsSection;
