import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';

import { useEntitySearch } from '../../../hooks';
import { entityOptionForSelector } from '../../../helpers/Entity';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '../../../conf/config';

// Quicksearch entities: stable module-level reference.
const CAVE_ENTITIES = ['caves'];

// Async single-select search of an existing entrance/network, on the standard
// MUI Autocomplete + quicksearch pattern used elsewhere in the app (see
// AuthorsSelect / OrganizationAssociation). One field: it searches and, once a
// result is picked, displays it with a native clear button.
const getCaveLabel = cave => cave?.name ?? '';

const CaveAutoCompleteSearch = ({
  onSelection,
  value = null,
  required = false,
  disabled = false,
  label
}) => {
  const { formatMessage } = useIntl();
  const { inputValue, setInputValue, results, isLoading, hasError } =
    useEntitySearch(CAVE_ENTITIES);

  // Keep the current value matchable so MUI doesn't warn when it isn't part of
  // the latest results (e.g. right after selection, when results are empty).
  const options =
    value?.id && !results.some(r => String(r.id) === String(value.id))
      ? [value, ...results]
      : results;

  return (
    <Autocomplete
      fullWidth
      disabled={disabled}
      value={value}
      options={options}
      loading={isLoading}
      inputValue={inputValue}
      onInputChange={(_event, newInput, reason) =>
        setInputValue(reason === 'reset' || reason === 'clear' ? '' : newInput)
      }
      onChange={(_event, newValue) => onSelection(newValue)}
      getOptionLabel={getCaveLabel}
      renderOption={entityOptionForSelector}
      isOptionEqualToValue={(option, val) =>
        String(option?.id) === String(val?.id)
      }
      // The server already filters; keep every returned option.
      filterOptions={x => x}
      noOptionsText={
        inputValue.length >= AUTOCOMPLETE_MIN_CHARACTERS
          ? formatMessage({ id: 'No results' })
          : formatMessage(
              { id: 'Type at least {nbOfChars} character(s)' },
              { nbOfChars: AUTOCOMPLETE_MIN_CHARACTERS }
            )
      }
      renderInput={params => (
        <TextField
          {...params}
          variant="filled"
          required={required}
          error={hasError}
          label={label ?? formatMessage({ id: 'Entrance or network' })}
          placeholder={formatMessage({
            id: 'Search for an entrance or network'
          })}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {isLoading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
};

CaveAutoCompleteSearch.propTypes = {
  onSelection: PropTypes.func.isRequired,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  value: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string
  })
};

export default CaveAutoCompleteSearch;
