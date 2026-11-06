import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { CircularProgress, InputAdornment, TextField } from '@mui/material';

const SELECTED_ENTITY_INPUT_SX = {
  // Keep the icon aligned with the filled label and let the adornment own its gap.
  '&&.MuiFilledInput-root': { pl: 1.5 },
  '& .MuiInputAdornment-positionStart': {
    mr: 0.5,
    '& > :first-of-type': { mr: 0 }
  }
};

// Preserve MUI's refs, input handlers and chip adornments. Only single-value
// selectors supply a selectedIcon; multiple selectors keep MUI's startAdornment.
const EntityAutocompleteInput = ({
  params,
  label,
  placeholder,
  inputRef,
  required = false,
  hasError = false,
  loading = false,
  selectedIcon,
  testId,
  name,
  onBlur,
  errorMessage
}) => {
  const { formatMessage } = useIntl();
  return (
    <TextField
      {...params}
      inputRef={inputRef}
      name={name}
      onBlur={onBlur}
      variant="filled"
      label={label}
      placeholder={placeholder}
      required={required}
      error={hasError || !!errorMessage}
      helperText={
        errorMessage ||
        (hasError
          ? formatMessage({ id: 'entityCreation.searchFailed' })
          : undefined)
      }
      slotProps={{
        ...params.slotProps,
        htmlInput: {
          ...params.slotProps.htmlInput,
          ...(testId && { 'data-testid': testId })
        },
        input: {
          ...params.slotProps.input,
          sx: selectedIcon ? SELECTED_ENTITY_INPUT_SX : undefined,
          startAdornment: selectedIcon ? (
            // Autocomplete already offsets filled content vertically.
            <InputAdornment position="start" variant="standard">
              {selectedIcon}
            </InputAdornment>
          ) : (
            params.slotProps.input.startAdornment
          ),
          endAdornment: (
            <>
              {loading && <CircularProgress size={16} />}
              {params.slotProps.input.endAdornment}
            </>
          )
        }
      }}
    />
  );
};

EntityAutocompleteInput.propTypes = {
  params: PropTypes.shape({
    slotProps: PropTypes.shape({
      input: PropTypes.shape({
        startAdornment: PropTypes.node,
        endAdornment: PropTypes.node
      }).isRequired,
      htmlInput: PropTypes.shape({ 'data-testid': PropTypes.string }).isRequired
    }).isRequired
  }).isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  inputRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({ current: PropTypes.shape({ focus: PropTypes.func }) })
  ]),
  required: PropTypes.bool,
  hasError: PropTypes.bool,
  loading: PropTypes.bool,
  selectedIcon: PropTypes.node,
  testId: PropTypes.string,
  name: PropTypes.string,
  onBlur: PropTypes.func,
  errorMessage: PropTypes.string
};

export default EntityAutocompleteInput;
