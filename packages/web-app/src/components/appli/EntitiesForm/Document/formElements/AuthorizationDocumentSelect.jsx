import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Autocomplete } from '@mui/material';

import EntityAutocompleteInput from '@/components/common/AutoCompleteSearch/EntityAutocompleteInput';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '@/conf/config';
import { useEntitySearch } from '@/hooks';
import { DocumentTypes, hasSameDocumentId } from '@/utils/documentTypeHelpers';

const DOCUMENTS = ['documents'];
// Quick search excludes documents awaiting their first validation by default.
const AUTHORIZATION_FILTER = { type: [DocumentTypes.AUTHORIZATION_TO_PUBLISH] };
const isSameAuthorization = (option, selected) =>
  hasSameDocumentId(option.id, selected.id);

const AuthorizationDocumentSelect = ({
  value,
  onChange,
  disabled = false,
  required = true,
  disableClearable = false
}) => {
  const { formatMessage } = useIntl();
  const { inputValue, setInputValue, results, isLoading, hasError } =
    useEntitySearch(DOCUMENTS, {
      enabled: !disabled,
      filter: AUTHORIZATION_FILTER
    });
  const options =
    value && !results.some(option => isSameAuthorization(option, value))
      ? [value, ...results]
      : results;
  const emptyText =
    inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARACTERS
      ? formatMessage({ id: 'No results' })
      : formatMessage(
          { id: 'Type at least {nbOfChars} character(s)' },
          { nbOfChars: AUTOCOMPLETE_MIN_CHARACTERS }
        );

  return (
    <Autocomplete
      disabled={disabled}
      disableClearable={disableClearable}
      loading={isLoading}
      loadingText={formatMessage({ id: 'Loading ...' })}
      noOptionsText={
        hasError
          ? formatMessage({ id: 'entityCreation.searchFailed' })
          : emptyText
      }
      options={options}
      filterSelectedOptions
      filterOptions={available => available}
      getOptionKey={doc => doc.id}
      getOptionLabel={doc => doc.title ?? ''}
      isOptionEqualToValue={isSameAuthorization}
      value={value ?? null}
      onInputChange={(_, text, reason) =>
        setInputValue(reason === 'input' ? text : '')
      }
      onChange={(_, selection) =>
        onChange(
          selection
            ? { id: Number(selection.id), title: selection.title }
            : null
        )
      }
      renderInput={params => (
        <EntityAutocompleteInput
          params={params}
          required={required && !disabled}
          label={formatMessage({ id: 'Authorization from authors' })}
          loading={isLoading}
          hasError={hasError}
          testId="authorization-document-search"
        />
      )}
    />
  );
};

AuthorizationDocumentSelect.propTypes = {
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  disableClearable: PropTypes.bool,
  value: PropTypes.shape({ id: PropTypes.number, title: PropTypes.string }),
  onChange: PropTypes.func.isRequired
};

export default AuthorizationDocumentSelect;
