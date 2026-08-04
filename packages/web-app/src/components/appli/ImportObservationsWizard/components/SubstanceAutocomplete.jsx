import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { useDebounce } from '../../../../hooks';
import { searchSubstances } from '../../../../actions/Substance';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS
} from '../../../../conf/config';

const SubstanceAutocomplete = ({ value, onChange }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedInput = useDebounce(inputValue, AUTOCOMPLETE_DEBOUNCE_DELAY);

  useEffect(() => {
    const query = debouncedInput ? debouncedInput.trim() : '';
    if (query.length < AUTOCOMPLETE_MIN_CHARACTERS) {
      setOptions([]);
      setHasSearched(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    dispatch(searchSubstances(query))
      .then(results => {
        if (!cancelled) {
          setOptions(results || []);
          setHasSearched(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedInput, dispatch]);

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
