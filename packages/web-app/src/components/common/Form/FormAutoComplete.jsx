import React from 'react';
import { styled } from '@mui/material/styles';
import {
  Box,
  FilledInput,
  FormControl,
  IconButton,
  InputLabel,
  Collapse,
  Typography
} from '@mui/material';

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
}) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {helperContent && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{}}>
          {helperContent}
        </Typography>
      )}
      <FormControl
        variant="filled"
        required={required}
        error={hasError}
        fullWidth>
        <InputLabel>
          <Translate>{label}</Translate>
        </InputLabel>
        <StyledInput
          disabled
          value={value !== null ? getValueName(value) : ''}
          endAdornment={resultEndAdornment}
        />

        {autoCompleteSearch && (
          <StyledFormControl
            variant="filled"
            required={required}
            error={hasError}>
            <InputWrapper>
              {autoCompleteSearch}
              {children && <Collapse in={isSideActionOpen}>{children}</Collapse>}
            </InputWrapper>
            {onSideAction && (
              <IconButton
                size="small"
                onClick={onSideAction}
                disabled={sideActionDisabled}
                color="secondary"
                aria-label="new entity">
                {sideActionIcon || <ExpandIcon isOpen={isSideActionOpen} />}
              </IconButton>
            )}
          </StyledFormControl>
        )}
      </FormControl>
    </Box>
  );
};

FormAutoComplete.propTypes = {
  ...FormAutoCompleteTypes
};

export default FormAutoComplete;
