import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Collapse as MuiCollapse,
  FormHelperText,
  IconButton,
  TextField
} from '@mui/material';
import { isNil, length } from 'ramda';

import styled from 'styled-components';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { useDebounce } from '../../../hooks';
import Translate from '../Translate';

import { MultipleSelectTypes } from './types';

const InputWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Collapse = styled(MuiCollapse)`
  padding: ${({ theme }) => theme.spacing(1)};
`;

// eslint-disable-next-line react/prop-types
const ExpandIcon = ({ isOpen }) => (isOpen ? <ExpandLess /> : <ExpandMore />);

const MultipleSelect = ({
  computeHasError,
  getOptionLabel,
  getOptionSelected,
  handleOnChange,
  helperText,
  isLoading = false,
  labelName,
  loadSearchResults,
  nbCharactersNeededToLaunchSearch = 3,
  noOptionsText,
  renderOption,
  required = false,
  resetSearchResults,
  searchError,
  searchResults,
  value,
  onSideAction,
  sideActionIcon,
  sideActionDisabled = true,
  isSideActionOpen = false,
  children
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const debouncedInput = useDebounce(inputValue);
  const { formatMessage } = useIntl();

  const handleInputChange = (event, newValue, reason) => {
    switch (reason) {
      case 'reset':
      case 'clear':
        setInputValue('');
        break;

      case 'input':
        setInputValue(newValue);
        break;

      default:
        break;
    }
  };

  useEffect(() => {
    if (length(debouncedInput) >= nbCharactersNeededToLaunchSearch) {
      loadSearchResults(debouncedInput.trim());
    } else {
      resetSearchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  const hasError = computeHasError(value);

  return (
    <>
      <Wrapper>
        <InputWrapper>
          <Autocomplete
            multiple
            value={value}
            id={labelName}
            options={searchResults}
            onChange={handleOnChange}
            onInputChange={handleInputChange}
            inputValue={inputValue}
            loading={isLoading}
            getOptionLabel={getOptionLabel}
            renderOption={renderOption}
            isOptionEqualToValue={getOptionSelected}
            filterSelectedOptions
            filterOptions={options => options} // This fixes a bug: without it, the autocomplete hides some results...
            noOptionsText={
              inputValue.length >= nbCharactersNeededToLaunchSearch ? (
                noOptionsText
              ) : (
                <span>
                  {formatMessage(
                    {
                      id: 'Type at least {nbOfChars} character(s)',
                      defaultMessage: 'Type at least {nbOfChars} character(s)'
                    },
                    {
                      nbOfChars: (
                        <span key="notEnoughCharsEntered">
                          {nbCharactersNeededToLaunchSearch}
                        </span>
                      )
                    }
                  )}
                </span>
              )
            }
            required={required}
            renderInput={params => (
              <TextField
                {...params}
                variant="filled"
                label={<Translate>{labelName}</Translate>}
                required={required}
                error={hasError || searchError}
              />
            )}
          />
          {!isNil(children) && (
            <Collapse in={isSideActionOpen}>{children}</Collapse>
          )}
        </InputWrapper>
        {!isNil(onSideAction) && (
          <IconButton
            size="small"
            onClick={onSideAction}
            disabled={sideActionDisabled}
            color="secondary"
            aria-label="new entity">
            {!isNil(sideActionIcon) ? (
              sideActionIcon
            ) : (
              <ExpandIcon isOpen={isSideActionOpen} />
            )}
          </IconButton>
        )}
      </Wrapper>
      {helperText && (
        <FormHelperText variant="filled" error={hasError || searchError}>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
    </>
  );
};

MultipleSelect.propTypes = {
  ...MultipleSelectTypes
};

export default MultipleSelect;
