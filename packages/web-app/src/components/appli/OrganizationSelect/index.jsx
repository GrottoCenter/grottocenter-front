import { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import CreatableAutocomplete from '@/components/common/AutoCompleteSearch/CreatableAutocomplete';
import EntityAutocompleteInput from '@/components/common/AutoCompleteSearch/EntityAutocompleteInput';
import FieldHelperText from '@/components/common/Form/FieldHelperText';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import RelatedEntityDialog from '@/components/appli/EntitiesForm/RelatedEntityDialog';
import { useEntitySearch } from '@/hooks';
import { entityOptionForSelector } from '@/helpers/Entity';
import { restoreFieldFocus } from '@/utils/restoreFieldFocus';
import { useRestoreFieldFocus } from '@/hooks/useRestoreFieldFocus';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '@/conf/config';
import { OrganizationSimplePropTypes } from '@/types/organization.type';

const ORGANIZATIONS = ['organizations'];

// Controlled selection, local search and creation. Each caller owns validation
// and decides whether editing the search abandons its current selection.
const OrganizationSelect = ({
  value = null,
  onChange,
  label,
  placeholder,
  helperContent,
  required = false,
  allowCreation = true,
  defaultType = '',
  disabled,
  clearOnBlur,
  onSearchChange,
  inputRef,
  name,
  onBlur,
  errorMessage,
  testId,
  creationTestId
}) => {
  const { formatMessage } = useIntl();
  const wrapperRef = useRef(null);
  const nativeInputRef = useRef(null);
  const [creationName, setCreationName] = useState(null);
  const {
    inputValue,
    setInputValue,
    results,
    isLoading,
    hasError,
    hasSearched
  } = useEntitySearch(ORGANIZATIONS, { skipQuery: value?.name });
  const handleInputRef = useCallback(
    node => {
      nativeInputRef.current = node;
      inputRef?.(node);
    },
    [inputRef]
  );

  useRestoreFieldFocus(creationName !== null, nativeInputRef, wrapperRef);

  const handleSelect = organization => {
    onChange(organization);
    setInputValue('');
    setCreationName(null);
    if (creationName === null)
      restoreFieldFocus(nativeInputRef.current, wrapperRef.current);
  };
  const emptyText =
    inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARACTERS
      ? formatMessage({ id: 'No results' })
      : formatMessage(
          { id: 'Type at least {nbOfChars} character(s)' },
          { nbOfChars: AUTOCOMPLETE_MIN_CHARACTERS }
        );

  return (
    <Box ref={wrapperRef} sx={{ width: '100%', minWidth: 0 }}>
      {helperContent && <FieldHelperText>{helperContent}</FieldHelperText>}
      <CreatableAutocomplete
        fullWidth
        clearOnBlur={clearOnBlur}
        disabled={disabled}
        value={value}
        inputValue={inputValue}
        options={
          value &&
          !results.some(option => String(option.id) === String(value.id))
            ? [value, ...results]
            : results
        }
        loading={isLoading}
        creationActions={
          allowCreation && hasSearched && !disabled
            ? [
                {
                  id: 'organization',
                  iconType: 'organization',
                  label: formatMessage({ id: 'entityCreation.organization' }),
                  onClick: () => setCreationName(inputValue.trim()),
                  testId: creationTestId
                }
              ]
            : []
        }
        getOptionLabel={organization => organization.name || ''}
        isOptionEqualToValue={(option, selected) =>
          String(option.id) === String(selected.id)
        }
        renderOption={(props, organization) =>
          entityOptionForSelector(props, {
            ...organization,
            _type: 'organizations'
          })
        }
        onChange={(_event, organization) => handleSelect(organization)}
        onInputChange={(_event, next, reason) => {
          setInputValue(reason === 'reset' ? (value?.name ?? '') : next);
          if (reason === 'input') onSearchChange?.(next);
        }}
        noOptionsText={
          hasError
            ? formatMessage({ id: 'entityCreation.searchFailed' })
            : emptyText
        }
        renderInput={params => (
          <EntityAutocompleteInput
            params={params}
            label={label ?? formatMessage({ id: 'Organization' })}
            placeholder={
              placeholder ??
              formatMessage({ id: 'Search for an organization...' })
            }
            inputRef={handleInputRef}
            name={name}
            onBlur={onBlur}
            errorMessage={errorMessage}
            required={required && !value}
            hasError={hasError}
            loading={isLoading}
            testId={testId}
            selectedIcon={
              value && (
                <OrganizationIcon organizationType={value.type} size={20} />
              )
            }
          />
        )}
      />
      {allowCreation && creationName !== null && (
        <RelatedEntityDialog
          entityType="organizations"
          defaultName={creationName}
          defaultType={defaultType}
          onSelect={handleSelect}
          onClose={() => setCreationName(null)}
        />
      )}
    </Box>
  );
};

OrganizationSelect.propTypes = {
  value: OrganizationSimplePropTypes,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  helperContent: PropTypes.node,
  required: PropTypes.bool,
  allowCreation: PropTypes.bool,
  defaultType: PropTypes.string,
  disabled: PropTypes.bool,
  clearOnBlur: PropTypes.bool,
  onSearchChange: PropTypes.func,
  inputRef: PropTypes.func,
  name: PropTypes.string,
  onBlur: PropTypes.func,
  errorMessage: PropTypes.string,
  testId: PropTypes.string,
  creationTestId: PropTypes.string
};

export default OrganizationSelect;
