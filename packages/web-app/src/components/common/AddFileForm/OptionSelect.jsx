import React from 'react';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useDocumentOptions } from '../../../hooks';

const Wrapper = styled(FormControl)`
  ${({ theme }) => `
    margin: ${theme.spacing(4)};`}
`;
/*
  How to add an option :
  - add the menu item
  - add the equivalent value in the database.

  We don't list the entire content of option table for langage reasons. It's easier to translate hardcoded constant.
*/
const OptionSelect = ({ label, selectedOption, updateSelectedOption }) => {
  const options = useDocumentOptions();
  return (
    <Wrapper variant="filled">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={selectedOption || ''}
        onChange={event => updateSelectedOption(event.target.value)}>
        {options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.translatedToUser}
          </MenuItem>
        ))}
      </Select>
    </Wrapper>
  );
};

OptionSelect.propTypes = {
  label: PropTypes.string,
  selectedOption: PropTypes.string,
  updateSelectedOption: PropTypes.func.isRequired
};

export default OptionSelect;
