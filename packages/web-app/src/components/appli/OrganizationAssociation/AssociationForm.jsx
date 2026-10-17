import { createElement, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  Box,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material';

import OrganizationTypeField from '@/components/common/OrganizationTypeField';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import {
  TEXT_LENGTH_LIMITS,
  isNearLengthLimit
} from '@/utils/textLengthLimits';
import { AUTOCOMPLETE_DEBOUNCE_DELAY } from '@/conf/config';
import { useDebounce, useQuickSearch, useOnlineStatus } from '@/hooks';
import REDUCER_STATUS from '../../../reducers/ReducerStatus';
import { FormActionRow } from '../EntitiesForm/utils/FormContainers';

const ORGANIZATION_ENTITIES = ['organizations'];

const AssociationForm = ({ onClose, onSubmit, status, error }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  // Only an option object is an existing organization; RHF owns the input text.
  const [selectedOrg, setSelectedOrg] = useState(null);
  const { control, handleSubmit } = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { type: '', name: '' }
  });
  const inputValue = useWatch({ control, name: 'name' });
  const trimmedInput = inputValue.trim();
  const debouncedInput = useDebounce(trimmedInput, AUTOCOMPLETE_DEBOUNCE_DELAY);
  const { data: searchData, isFetching: isLoading } = useQuickSearch({
    entities: ORGANIZATION_ENTITIES,
    // Selecting an existing option must not search for its own label again.
    query: debouncedInput === selectedOrg?.name ? '' : debouncedInput
  });
  const results = searchData?.results ?? [];

  // Local state reset on success is not strictly needed anymore — the parent
  // unmounts this component when it closes — but keep the effect so a caller
  // that leaves us mounted still gets the expected auto-close behaviour.
  useEffect(() => {
    if (status === REDUCER_STATUS.SUCCEEDED) {
      onClose();
    }
  }, [status, onClose]);

  const handleValidSubmit = data => {
    if (!isOnline || status === REDUCER_STATUS.LOADING) return;
    if (selectedOrg) {
      onSubmit({ id: selectedOrg.id, name: selectedOrg.name });
    } else {
      onSubmit({ name: data.name.trim(), type: data.type });
    }
  };

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
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(handleValidSubmit)}
      sx={{ mb: 2 }}>
      {status === REDUCER_STATUS.FAILED && (
        <FormSubmissionError error={error} />
      )}
      <Controller
        name="name"
        control={control}
        rules={{
          validate: {
            required: value =>
              !!selectedOrg ||
              !!value.trim() ||
              formatMessage({ id: 'Required' }),
            maxLength: value =>
              !!selectedOrg ||
              value.trim().length <= TEXT_LENGTH_LIMITS.ENTITY_NAME ||
              formatMessage(
                { id: 'form.maxLength' },
                {
                  limit: TEXT_LENGTH_LIMITS.ENTITY_NAME,
                  count: value.trim().length
                }
              )
          }
        }}
        render={({ field, fieldState }) => (
          <Autocomplete
            freeSolo
            disabled={status === REDUCER_STATUS.LOADING}
            options={results}
            renderOption={(optionProps, option) => {
              const { key, ...liProps } = optionProps;
              return createElement(
                'li',
                { ...liProps, key },
                <OrganizationIcon organizationType={option.type} size={24} />,
                option.name
              );
            }}
            getOptionLabel={option =>
              typeof option === 'string' ? option : option.name || ''
            }
            value={selectedOrg}
            onChange={(event, newValue) => {
              // Only an object option is an existing organization. A freeSolo
              // string is left unstored: it will be handled as a creation from
              // the input on submit.
              setSelectedOrg(typeof newValue === 'string' ? null : newValue);
              field.onChange(
                typeof newValue === 'string' ? newValue : (newValue?.name ?? '')
              );
            }}
            inputValue={inputValue}
            onInputChange={(event, newInputValue, reason) => {
              field.onChange(newInputValue);
              if (reason === 'input') {
                setSelectedOrg(null);
              }
            }}
            renderInput={params => (
              <TextField
                id={params.id}
                disabled={params.disabled}
                fullWidth={params.fullWidth}
                size={params.size}
                name={field.name}
                inputRef={field.ref}
                onBlur={field.onBlur}
                label={formatMessage({ id: 'Search or create organization' })}
                error={isNameTooLong || !!fieldState.error}
                helperText={
                  isNameNearLimit
                    ? nameLengthFeedback
                    : fieldState.error?.message
                }
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
        )}
      />
      {!selectedOrg && (
        <Box sx={{ mt: 1 }}>
          <OrganizationTypeField control={control} name="type" />
        </Box>
      )}
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
        disabled={status === REDUCER_STATUS.LOADING}
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
