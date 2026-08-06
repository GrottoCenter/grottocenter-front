import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Autocomplete from '@mui/material/Autocomplete';
import {
  InputBase,
  CircularProgress,
  InputAdornment,
  Popper
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import ErrorIcon from '@mui/icons-material/Error';

import DisabledTooltip from './DisabledTooltip';

import { entityOptionForSelector } from '../../../helpers/Entity';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '../../../conf/config';

const StyledAutocomplete = styled(Autocomplete)`
  min-width: 200px;
  width: 100%;
`;

const InputWrapper = styled('div')`
  display: flex;
  margin-left: auto;
  width: 100%;
  border-radius: ${({ theme }) => theme.shape.borderRadius}px;
  background-color: ${({ theme }) => alpha(theme.palette.common.white, 0.15)};
  transition: 0.5s;
  &:hover {
    background-color: ${({ theme, disabled }) =>
      alpha(theme.palette.common.white, disabled ? 0.15 : 0.25)};
  }
  &:focus-within {
    width: 100%;
  }
`;

const SearchIconWrapper = styled('div')`
  padding: ${({ theme }) => theme.spacing(0.5)};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledInputBase = styled(InputBase)`
  padding: ${({ theme }) => theme.spacing(0.5, 0.5, 0.5, 0.25)};
  width: 100%;
`;

const ResultsPopper = styled(Popper, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  width: fit-content;

  ul.MuiAutocomplete-listbox {
    max-height: 70vh; /* fallback for old browsers */
    max-height: 70dvh;
  }

  /* The panel is shaped one level down, on the paper: MUI writes the popper's
     own width inline from the anchor, so a rule set on the popper never wins. */
  > div {
    ${({ $isFullWidth }) =>
      $isFullWidth ? 'width: 100%;' : 'width: fit-content; max-width: 80vw;'}
  }
`;

// Purely internal rendering helper; its props are enforced by the
// AutoCompleteSearch PropTypes above, not at this call-site level.
// eslint-disable-next-line react/prop-types
const InputAdornments = ({ isLoading, hasError }) =>
  isLoading || hasError ? (
    <InputAdornment position="end">
      {isLoading && <CircularProgress color="secondary" size={24} />}
      {hasError && <ErrorIcon color="secondary" />}
    </InputAdornment>
  ) : null;

// Two components declared once rather than one built from a prop at render
// time: MUI takes this as `PopperComponent`, i.e. as a component *identity*, so
// a factory called during render hands React a brand new type on every
// keystroke and remounts the whole result panel with it.
//
// Each one hangs from the edge its field is anchored to, so the panel and the
// field always share a side. `bottom-end` for the hugging one: that field is
// pushed right by `InputWrapper`'s `margin-left: auto`. `bottom-start` for the
// full-width one: that field spans its container, so the left edge is the one
// the eye is on — it is where the caret is.
const HuggingResults = props => (
  <ResultsPopper {...props} placement="bottom-end" />
);
const FullWidthResults = props => (
  <ResultsPopper {...props} placement="bottom-start" $isFullWidth />
);

const AutoCompleteSearch = ({
  suggestions,
  renderOption,
  getOptionLabel,
  onSelection,
  inputValue,
  onInputChange,
  label = 'Search...',
  hasError = false,
  isLoading = false,
  disabled = false,
  hasFullWidthResults = false,
  autoFocus = false,
  noOptionsText = null,
  value
}) => {
  const { formatMessage } = useIntl();
  const [isOpen, setOpen] = useState(false);

  const handleSelectionChange = (_event, newSelection) => {
    onSelection(newSelection);
  };

  const handleInputChange = (e, newInput) => {
    if (e === null || e.type === null || e.type === 'blur') {
      onInputChange('');
    } else {
      onInputChange(newInput);
    }
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleOpen = () => {
    if (!disabled && inputValue !== '') setOpen(true);
  };

  useEffect(() => {
    if (disabled || inputValue === '') {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [inputValue, disabled]);

  return (
    <StyledAutocomplete
      // clearOnBlur={false} // Usefull for development
      disabled={disabled}
      id={`AutoCompleteSearch${label}`}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleSelectionChange}
      options={suggestions}
      getOptionLabel={getOptionLabel ?? (e => e?.name ?? '')}
      renderOption={renderOption ?? entityOptionForSelector}
      loading={isLoading}
      PopperComponent={hasFullWidthResults ? FullWidthResults : HuggingResults}
      color="inherit"
      // had to disable built-int filter
      // https://github.com/mui-org/material-ui/issues/20068
      filterOptions={x => x}
      onOpen={handleOpen}
      onClose={handleClose}
      open={disabled ? false : isOpen}
      noOptionsText={
        noOptionsText ??
        formatMessage(
          { id: 'No result (enter at least {count} characters)' },
          { count: AUTOCOMPLETE_MIN_CHARACTERS }
        )
      }
      value={value}
      isOptionEqualToValue={(option, val) => {
        if (!option || !val) return false;
        if (option.id !== undefined && val.id !== undefined) {
          return String(option.id) === String(val.id);
        }
        return option === val;
      }}
      renderInput={params => (
        <DisabledTooltip disabled={disabled}>
          <InputWrapper disabled={disabled}>
            <SearchIconWrapper>
              <SearchIcon color={disabled ? 'disabled' : 'inherit'} />
            </SearchIconWrapper>
            <StyledInputBase
              required={false}
              autoFocus={autoFocus}
              disabled={params.disabled}
              ref={params.InputProps.ref}
              placeholder={label}
              error={hasError}
              inputProps={{
                ...params.inputProps
              }}
              endAdornment={
                <InputAdornments isLoading={isLoading} hasError={hasError} />
              }
              fullWidth
            />
          </InputWrapper>
        </DisabledTooltip>
      )}
    />
  );
};

AutoCompleteSearch.propTypes = {
  suggestions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  onSelection: PropTypes.func.isRequired,
  inputValue: PropTypes.string.isRequired,
  onInputChange: PropTypes.func.isRequired,
  renderOption: PropTypes.func,
  getOptionLabel: PropTypes.func,
  label: PropTypes.string,
  hasError: PropTypes.bool,
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  // Makes the results panel as wide as the field instead of hugging its own
  // content. For fields that already span their container.
  hasFullWidthResults: PropTypes.bool,
  // Focuses the input on mount — for fields that only appear once the user has
  // asked for them, so nothing else can reasonably hold focus.
  autoFocus: PropTypes.bool,
  // Overrides the default "no result" wording — e.g. to explain that search
  // needs a connection rather than claim nothing was found.
  noOptionsText: PropTypes.node,
  // Whatever shape the caller's options carry; compared by reference.
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.shape({})
  ])
};

export default AutoCompleteSearch;
