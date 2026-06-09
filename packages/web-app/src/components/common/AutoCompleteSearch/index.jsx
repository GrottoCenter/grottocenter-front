import React, { useEffect, useState } from 'react';
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

const InputWrapper = styled('div', {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  display: flex;
  margin-left: ${({ $hasFixWidth }) => ($hasFixWidth ? 'auto' : '0')};
  width: 100%;
  border-radius: ${({ theme }) => theme.shape.borderRadius};
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
  padding: ${({ theme }) => theme.spacing(1)};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StyledInputBase = styled(InputBase)`
  padding: ${({ theme }) => theme.spacing(1, 1, 1, 0)};
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

  > div {
    width: fit-content;
    max-width: 80vw;
    ${({ $hasFixWidth }) => !$hasFixWidth && 'float: right'};
  }
`;

// eslint-disable-next-line react/prop-types
const InputAdornments = ({ isLoading, hasError }) =>
  isLoading || hasError ? (
    <InputAdornment position="end">
      {isLoading && <CircularProgress color="secondary" size={24} />}
      {hasError && <ErrorIcon color="secondary" />}
    </InputAdornment>
  ) : null;

const StyledPopper = hasFixWidth =>
  function (props) {
    return (
      <ResultsPopper
        {...props}
        $hasFixWidth={hasFixWidth}
        placement="bottom-end"
      />
    );
  };
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
  hasFixWidth = true,
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
      id={`AutoCompleteSearch${hasFixWidth}${label}`}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleSelectionChange}
      options={suggestions}
      getOptionLabel={getOptionLabel ?? (e => e?.name ?? '')}
      renderOption={renderOption ?? entityOptionForSelector}
      loading={isLoading}
      PopperComponent={StyledPopper(hasFixWidth)}
      color="inherit"
      // had to disable built-int filter
      // https://github.com/mui-org/material-ui/issues/20068
      filterOptions={x => x}
      onOpen={handleOpen}
      onClose={handleClose}
      open={disabled ? false : isOpen}
      noOptionsText={formatMessage(
        { id: 'No result (enter at least {count} characters)' },
        { count: AUTOCOMPLETE_MIN_CHARACTERS }
      )}
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
          <InputWrapper $hasFixWidth={hasFixWidth} disabled={disabled}>
            <SearchIconWrapper>
              <SearchIcon color={disabled ? 'disabled' : 'inherit'} />
            </SearchIconWrapper>
            <StyledInputBase
              required={false}
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
  hasFixWidth: PropTypes.bool,
  value: PropTypes.any
};

export default AutoCompleteSearch;
