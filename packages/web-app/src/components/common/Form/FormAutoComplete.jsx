import React from 'react';
import { styled } from '@mui/material/styles';
import {
  FilledInput,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Collapse
} from '@mui/material';

import { isNil } from 'ramda';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import Translate from '../Translate';
import { FormAutoCompleteTypes } from './types';

export const StyledInput = styled(FilledInput)`
  & .Mui-disabled {
    color: ${({ theme }) => theme.palette.primaryTextColor};
    -webkit-text-fill-color: initial;
  }

  color: ${({ theme }) => theme.palette.primaryTextColor};
`;

export const StyledFormControl = styled(FormControl)`
  background-color: ${({ theme }) => theme.palette.primary3Color};
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const InputWrapper = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

// eslint-disable-next-line react/prop-types
const ExpandIcon = ({ isOpen }) => (isOpen ? <ExpandLess /> : <ExpandMore />);

const FormAutoComplete = ({
  getValueName,
  value,
  autoCompleteSearch,
  hasError,
  helperContent,
  label,
  required,
  resultEndAdornment,
  onSideAction,
  sideActionIcon,
  sideActionDisabled = true,
  isSideActionOpen = false,
  children
}) => (
  <FormControl variant="filled" required={required} error={hasError} fullWidth>
    <InputLabel error={required && value === null}>
      <Translate>{label}</Translate>
    </InputLabel>
    <StyledInput
      disabled
      value={value !== null ? getValueName(value) : ''}
      endAdornment={resultEndAdornment}
    />

    {autoCompleteSearch && (
      <StyledFormControl variant="filled" required={required} error={hasError}>
        <InputWrapper>
          {autoCompleteSearch}
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
      </StyledFormControl>
    )}

    {helperContent && <FormHelperText>{helperContent}</FormHelperText>}
  </FormControl>
);

FormAutoComplete.propTypes = {
  ...FormAutoCompleteTypes
};

export default FormAutoComplete;
