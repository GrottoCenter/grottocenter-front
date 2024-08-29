import React, { useEffect, useState } from 'react';
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

import { AutoCompleteSearchTypes } from './types';
import Translate from '../Translate';
import DisabledTooltip from '../DisabledTooltip';

const StyledAutocomplete = styled(Autocomplete)`
  min-width: 200px;
  width: 100%;
`;

const InputWrapper = styled('div', {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  display: flex;
  margin-left: auto;
  width: ${({ $hasFixWidth }) => ($hasFixWidth ? 100 : 80)}%;
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
    max-height: 70vh;
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
  hasFixWidth = true
}) => {
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
    if (inputValue !== '') setOpen(true);
  };

  useEffect(() => {
    if (inputValue === '') {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [inputValue]);

  return (
    <StyledAutocomplete
      // clearOnBlur={false} // Usefull for development
      disabled={disabled}
      id={`AutoCompleteSearch${hasFixWidth}${label}`}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={handleSelectionChange}
      options={suggestions}
      getOptionLabel={getOptionLabel}
      renderOption={renderOption}
      loading={isLoading}
      PopperComponent={StyledPopper(hasFixWidth)}
      color="inherit"
      // had to disable built-int filter
      // https://github.com/mui-org/material-ui/issues/20068
      filterOptions={x => x}
      onOpen={handleOpen}
      onClose={handleClose}
      open={isOpen}
      noOptionsText={
        <Translate>No result (enter at least 3 characters)</Translate>
      }
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
  ...AutoCompleteSearchTypes
};

export default AutoCompleteSearch;
