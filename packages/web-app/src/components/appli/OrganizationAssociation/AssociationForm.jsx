import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';
import { fetchQuickSearchRaw } from '../../../actions/Quicksearch';
import { useDebounce } from '../../../hooks';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS
} from '../../../conf/config';

// Max length for an inline-created organization name (Requirement 7 AC3).
const ORGANIZATION_NAME_MAX_LENGTH = 200;

const AssociationForm = ({ open, onClose, onSubmit, status, error }) => {
  const { formatMessage } = useIntl();
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  // Holds ONLY an existing organization picked from the list (it always has an
  // `id`). Free text is never stored here — the "create" path is derived from
  // the input alone. This keeps the submit decision unambiguous.
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const debouncedInput = useDebounce(inputValue, AUTOCOMPLETE_DEBOUNCE_DELAY);

  useEffect(() => {
    let active = true;
    const trimmed = debouncedInput.trim();

    if (trimmed.length < AUTOCOMPLETE_MIN_CHARACTERS) {
      setOptions([]);
      return undefined;
    }

    // The input already matches the selected organization: nothing to search.
    if (selectedOrg && selectedOrg.name === trimmed) {
      return undefined;
    }

    setIsSearching(true);

    const fetchOptions = async () => {
      try {
        const data = await fetchQuickSearchRaw({
          query: trimmed,
          entities: ['organizations']
        });

        if (active) {
          const results =
            data.results?.filter(r => r._type === 'organizations') || [];
          setOptions(results);
        }
      } catch (err) {
        if (active) {
          setOptions([]);
        }
      } finally {
        if (active) {
          setIsSearching(false);
        }
      }
    };

    fetchOptions();

    return () => {
      active = false;
    };
  }, [debouncedInput, selectedOrg]);

  const handleClose = React.useCallback(() => {
    setInputValue('');
    setSelectedOrg(null);
    setOptions([]);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (status === REDUCER_STATUS.SUCCEEDED && open) {
      handleClose();
    }
  }, [status, open, handleClose]);

  const handleSubmit = () => {
    if (selectedOrg && selectedOrg.id) {
      onSubmit({ id: selectedOrg.id, name: selectedOrg.name });
    } else if (inputValue.trim()) {
      onSubmit({ name: inputValue.trim() });
    }
  };

  const isSubmitDisabled =
    (!selectedOrg && !inputValue.trim()) || status === REDUCER_STATUS.LOADING;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {formatMessage({ id: 'Create or associate an organization' })}
      </DialogTitle>
      <DialogContent>
        {status === REDUCER_STATUS.FAILED && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.message ||
              formatMessage({ id: 'An error occurred while saving.' })}
          </Alert>
        )}
        <Autocomplete
          freeSolo
          options={options}
          getOptionLabel={option =>
            typeof option === 'string' ? option : option.name || ''
          }
          value={selectedOrg}
          onChange={(event, newValue) => {
            // Only an object option is an existing organization. A freeSolo
            // string is left unstored: it will be handled as a creation from
            // the input on submit.
            setSelectedOrg(typeof newValue === 'string' ? null : newValue);
          }}
          inputValue={inputValue}
          onInputChange={(event, newInputValue, reason) => {
            setInputValue(newInputValue);
            if (reason === 'input') {
              setSelectedOrg(null);
            }
          }}
          renderInput={params => (
            <TextField
              {...params}
              label={formatMessage({ id: 'Search or create organization' })}
              margin="normal"
              inputProps={{
                ...params.inputProps,
                maxLength: ORGANIZATION_NAME_MAX_LENGTH
              }}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {isSearching ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                )
              }}
            />
          )}
        />
        {!selectedOrg && inputValue.trim().length > 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {formatMessage(
              {
                id: 'Select an existing organization from the list, or a new one named "{name}" will be created.'
              },
              { name: inputValue.trim() }
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={handleClose}
          disabled={status === REDUCER_STATUS.LOADING}>
          {formatMessage({ id: 'Cancel' })}
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={isSubmitDisabled}
          startIcon={
            status === REDUCER_STATUS.LOADING ? (
              <CircularProgress size={20} />
            ) : null
          }>
          {formatMessage({ id: 'Associate' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AssociationForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  status: PropTypes.string,
  error: PropTypes.shape({
    message: PropTypes.string
  })
};

export default AssociationForm;
