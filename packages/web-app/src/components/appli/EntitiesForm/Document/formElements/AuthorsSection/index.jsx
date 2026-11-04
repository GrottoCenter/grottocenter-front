import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Chip } from '@mui/material';
import { useIntl } from 'react-intl';
import FieldHelperText from '@/components/common/Form/FieldHelperText';
import RelatedEntityDialog from '@/components/appli/EntitiesForm/RelatedEntityDialog';
import CreatableAutocomplete from '@/components/common/AutoCompleteSearch/CreatableAutocomplete';
import EntityAutocompleteInput from '@/components/common/AutoCompleteSearch/EntityAutocompleteInput';
import DocumentAuthorLabel from '@/components/common/DocumentAuthorLabel';
import { entityOptionForSelector } from '@/helpers/Entity';
import { useEntitySearch, useUserProperties } from '@/hooks';
import { restoreFieldFocus } from '@/utils/restoreFieldFocus';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '@/conf/config';
import { DocumentFormContext } from '@/components/appli/EntitiesForm/Document/Provider';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from '../AddFileForm/FileHelpers';

const MIXED_ENTITIES = ['persons', 'organizations'];

const getOptionLabel = option =>
  (option._type === 'organizations' ? option.name : option.nickname) || '';

const stripType = ({ _type, ...rest }) => rest;

const AuthorsSection = () => {
  const { formatMessage } = useIntl();
  const {
    document: doc,
    isNewDocument,
    updateAttribute,
    allowEntityCreation = true
  } = useContext(DocumentFormContext);
  const currentUser = useUserProperties();
  const hasPrefilledRef = useRef(false);

  // Convenience prefill for a brand new document only: never attribute
  // authorship to whoever edits an existing one. A document is validly authored
  // by at least one person OR one organization, so an existing organization
  // author is enough to leave the field alone.
  useEffect(() => {
    if (
      hasPrefilledRef.current ||
      !isNewDocument ||
      !currentUser.id ||
      doc.authors.length > 0 ||
      doc.authorsOrganization.length > 0 ||
      doc.selectOptionAuthorizationDocument === DOCUMENT_AUTHORIZE_TO_PUBLISH
    )
      return;
    hasPrefilledRef.current = true;
    updateAttribute('authors', [
      { id: currentUser.id, nickname: currentUser.nickname }
    ]);
    // doc author collections and updateAttribute are stable; currentUser.id guards async hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.id, isNewDocument, doc.selectOptionAuthorizationDocument]);

  const value = useMemo(
    () => [
      ...doc.authors.map(a => ({ ...a, _type: 'persons' })),
      ...doc.authorsOrganization.map(o => ({ ...o, _type: 'organizations' }))
    ],
    [doc.authors, doc.authorsOrganization]
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
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  const applyValue = newValue => {
    updateAttribute(
      'authors',
      newValue.filter(v => v._type === 'persons').map(stripType)
    );
    updateAttribute(
      'authorsOrganization',
      newValue.filter(v => v._type === 'organizations').map(stripType)
    );
  };

  const handleChange = (_event, newValue) => applyValue(newValue);

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
    restoreFieldFocus(inputRef.current, wrapperRef.current);
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
    <Box ref={wrapperRef} data-testid="document-authors" sx={{ mt: 2 }}>
      <FieldHelperText>
        {formatMessage({ id: 'entityCreation.authorsHelp' })}
      </FieldHelperText>

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
        renderOption={(props, option) =>
          entityOptionForSelector(props, option, { showPersonType: true })
        }
        isOptionEqualToValue={(option, val) =>
          String(option.id) === String(val.id) && option._type === val._type
        }
        filterSelectedOptions
        renderValue={(tagValue, getItemProps) =>
          tagValue.map((option, index) => (
            <Chip
              {...getItemProps({ index })}
              key={`${option._type}-${option.id}`}
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
            required={value.length === 0}
            hasError={hasError}
            loading={isLoading}
          />
        )}
      />
      {allowEntityCreation && creation && (
        <RelatedEntityDialog
          entityType={creation.entityType}
          defaultName={creation.name}
          onSelect={handleEntitySelected}
          onClose={() => {
            setCreation(null);
            restoreFieldFocus(inputRef.current, wrapperRef.current);
          }}
        />
      )}
    </Box>
  );
};

export default AuthorsSection;
