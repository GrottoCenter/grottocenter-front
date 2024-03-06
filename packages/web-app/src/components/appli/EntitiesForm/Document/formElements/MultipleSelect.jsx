import React, { useEffect, useState, useContext } from 'react';
import { useIntl } from 'react-intl';
import Autocomplete from '@mui/material/Autocomplete';
import {
  Collapse as MuiCollapse,
  FormHelperText,
  IconButton,
  TextField
} from '@mui/material';
import { isNil } from 'ramda';

import { styled } from '@mui/material/styles';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

import { useDebounce } from '../../../../../hooks';
import Translate from '../../../../common/Translate';
import { MultipleSelectTypes } from '../../../../common/Form/types';

import { DocumentFormContext } from '../Provider';

const InputWrapper = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const Wrapper = styled('div')`
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
  contextValueName,
  computeHasError,
  getOptionLabel,
  getOptionSelected,
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
  onSideAction,
  sideActionIcon,
  sideActionDisabled = true,
  isSideActionOpen = false,
  children
}) => {
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue);
  const { formatMessage } = useIntl();

  const { document, updateAttribute } = useContext(DocumentFormContext);

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        updateAttribute(contextValueName, []);
        break;
      case 'selectOption':
      case 'removeOption':
        updateAttribute(contextValueName, newValue);
        break;
      default:
    }
  };

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
    if (debouncedInput.length >= nbCharactersNeededToLaunchSearch) {
      loadSearchResults(debouncedInput.trim());
    } else {
      resetSearchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  const hasError = computeHasError(document[contextValueName]);
  return (
    <>
      <Wrapper>
        <InputWrapper>
          <Autocomplete
            multiple
            value={document[contextValueName]}
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
