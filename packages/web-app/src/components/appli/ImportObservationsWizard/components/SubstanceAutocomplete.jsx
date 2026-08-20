import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useDebounce, useSubstanceSearch } from '../../../../hooks';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS
} from '../../../../conf/config';

const SubstanceAutocomplete = ({ value, onChange }) => {
  const { formatMessage } = useIntl();

  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue, AUTOCOMPLETE_DEBOUNCE_DELAY);
  const trimmed = (debouncedInput || '').trim();

  // useSubstanceSearch guards `enabled` on trimmed.length >= 2 internally;
  // isFetching is false when disabled, so we don't need our own gate.
  const { data: options, isFetching, isSuccess } = useSubstanceSearch(trimmed);
  const hasSearched =
    isSuccess && trimmed.length >= AUTOCOMPLETE_MIN_CHARACTERS;
  const loading = isFetching;

  const handleInputChange = useCallback((_e, newInput, reason) => {
    if (reason === 'reset') return;
    setInputValue(newInput);
  }, []);

  const getOptionLabel = option =>
    option.formula ? `${option.name} (${option.formula})` : option.name;

  const noOptionsText =
    hasSearched && inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARACTERS
      ? formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.substanceNoResults'
        })
      : formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.substanceSearchHint'
        });

  return (
    <Autocomplete
      value={value}
      onChange={(_e, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      options={options}
      getOptionLabel={getOptionLabel}
      filterOptions={x => x}
      loading={loading}
      noOptionsText={noOptionsText}
      isOptionEqualToValue={(opt, val) => opt.name === val.name}
      renderOption={(props, option) => {
        // MUI hands `key` inside renderOption's props bag and React 19 requires
        // extracting it before the spread; this callback is not a component.
        // eslint-disable-next-line react/prop-types
        const { key, ...rest } = props;
        return (
          <li key={key || option.externalId || option.name} {...rest}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2">
                {option.formula
                  ? `${option.name} (${option.formula})`
                  : option.name}
              </Typography>
              {option.id === null && (
                <Typography variant="caption" color="text.secondary">
                  {formatMessage({
                    id: 'ImportObservationsWizard.DeviceSensorsStep.substanceViaPubChem'
                  })}
                </Typography>
              )}
            </Box>
          </li>
        );
      }}
      renderInput={params => (
        <TextField
          {...params}
          label={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.substance'
          })}
          placeholder={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.substancePlaceholder'
          })}
          size="small"
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress size={18} />}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
        />
      )}
      data-testid="sensor-config-substance"
    />
  );
};

SubstanceAutocomplete.propTypes = {
  value: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    formula: PropTypes.string,
    casNumber: PropTypes.string,
    externalId: PropTypes.string,
    externalSource: PropTypes.string
  }),
  onChange: PropTypes.func.isRequired
};

export default SubstanceAutocomplete;
