import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  TEXT_LENGTH_LIMITS,
  isNearLengthLimit
} from '@/utils/textLengthLimits';
import {
  Box,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material';
import { useEntitySearch } from '../../../hooks';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import { FormActionRow } from '../EntitiesForm/utils/FormContainers';

const ORGANIZATION_ENTITIES = ['organizations'];

const AssociationForm = ({ onClose, onSubmit, status, error }) => {
  const { formatMessage } = useIntl();
  // Holds ONLY an existing organization picked from the list (it always has an
  // `id`). Free text is never stored here — the "create" path is derived from
  // the input alone. This keeps the submit decision unambiguous.
  const [selectedOrg, setSelectedOrg] = useState(null);
  // Selecting an option makes the field show the org name; skip searching for
  // that exact name (it just re-fetches the already selected organization).
  const { inputValue, setInputValue, results, isLoading } = useEntitySearch(
    ORGANIZATION_ENTITIES,
    { skipQuery: selectedOrg?.name }
  );
  const trimmedInput = inputValue.trim();

  // Local state reset on success is not strictly needed anymore — the parent
  // unmounts this component when it closes — but keep the effect so a caller
  // that leaves us mounted still gets the expected auto-close behaviour.
  useEffect(() => {
    if (status === REDUCER_STATUS.SUCCEEDED) {
      onClose();
    }
  }, [status, onClose]);

  const handleSubmit = e => {
    e.preventDefault();
    if (status === REDUCER_STATUS.LOADING) return;
    if (selectedOrg && selectedOrg.id) {
      onSubmit({ id: selectedOrg.id, name: selectedOrg.name });
    } else if (
      trimmedInput &&
      trimmedInput.length <= TEXT_LENGTH_LIMITS.ENTITY_NAME
    ) {
      onSubmit({ name: trimmedInput });
    }
  };

  const isSubmitDisabled =
    (!selectedOrg && !trimmedInput) ||
    (!selectedOrg && trimmedInput.length > TEXT_LENGTH_LIMITS.ENTITY_NAME) ||
    status === REDUCER_STATUS.LOADING;

  // The quicksearch is fuzzy, so a random string like "gucem ffff" still comes
  // back with partial matches — `results.length === 0` almost never fires.
  // What we actually want is "no result matches the typed text exactly", which
  // is when a submit would take the create path.
  const isNameNearLimit =
    !selectedOrg &&
    isNearLengthLimit(trimmedInput.length, TEXT_LENGTH_LIMITS.ENTITY_NAME);
  const isNameTooLong =
    !selectedOrg && trimmedInput.length > TEXT_LENGTH_LIMITS.ENTITY_NAME;
  const nameLengthFeedback = isNameTooLong
    ? formatMessage(
        { id: 'form.maxLength' },
        { limit: TEXT_LENGTH_LIMITS.ENTITY_NAME, count: trimmedInput.length }
      )
    : `${trimmedInput.length} / ${TEXT_LENGTH_LIMITS.ENTITY_NAME}`;
  const hasExactMatch = results.some(
    r => r.name?.toLowerCase() === trimmedInput.toLowerCase()
  );

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
      {status === REDUCER_STATUS.FAILED && (
        <Alert severity="error" sx={{ mb: 1 }}>
          {error?.message ||
            formatMessage({ id: 'An error occurred while saving.' })}
        </Alert>
      )}
      <Autocomplete
        freeSolo
        options={results}
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
            error={isNameTooLong}
            helperText={isNameNearLimit ? nameLengthFeedback : undefined}
            slotProps={{
              ...params.slotProps,

              formHelperText: {
                sx: {
                  textAlign: 'right',
                  color: isNameTooLong ? 'error.main' : 'text.secondary'
                }
              },

              input: {
                ...params.slotProps.input,
                endAdornment: (
                  <>
                    {isLoading ? (
                      <CircularProgress color="inherit" size={20} />
                    ) : null}
                    {params.slotProps.input.endAdornment}
                  </>
                )
              },

              htmlInput: {
                ...params.slotProps.htmlInput,
                maxLength: TEXT_LENGTH_LIMITS.ENTITY_NAME
              }
            }}
          />
        )}
      />
      {!selectedOrg &&
        trimmedInput.length > 0 &&
        !isLoading &&
        !hasExactMatch && (
          <Alert severity="info" sx={{ mt: 1 }}>
            {formatMessage(
              {
                id: 'Select an existing organization from the list, or a new one named "{name}" will be created.'
              },
              { name: trimmedInput }
            )}
          </Alert>
        )}
      <FormActionRow
        isCenter
        isSubmitting={status === REDUCER_STATUS.LOADING}
        disabled={isSubmitDisabled}
        submitLabel={formatMessage({ id: 'Associate' })}
      />
    </Box>
  );
};

AssociationForm.propTypes = {
  // Called on submit success. The parent's SectionCreateButton is the primary
  // close affordance; this hook lets us reset from within on SUCCEEDED without
  // requiring the caller to watch the status.
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  status: PropTypes.string,
  error: PropTypes.shape({
    message: PropTypes.string
  })
};

export default AssociationForm;
