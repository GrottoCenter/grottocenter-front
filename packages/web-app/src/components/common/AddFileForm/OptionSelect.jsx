import React from 'react';
import { useIntl } from 'react-intl';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';

const Wrapper = styled(FormControl)`
  ${({ theme }) => `
    margin: ${theme.spacing(4)};`}
`;

export const AUTHORIZATION_FROM_AUTHOR = 'Author created this document';
export const LICENSE_IN_FILE = 'License in files';
export const DOCUMENT_AUTHORIZE_TO_PUBLISH =
  'Authorization present in GrottoCenter';

/*
  How to add an option :
  - add the menu item
  - add the equivalent value in the database.

  We don't list the entire content of option table for langage reasons. It's easier to translate hardcoded constant.
*/
const OptionSelect = ({ label, selectedOption, updateSelectedOption }) => {
  const { formatMessage } = useIntl();

  const options = [
    {
      idDb: 1,
      value: AUTHORIZATION_FROM_AUTHOR,
      translatedOption: formatMessage({ id: AUTHORIZATION_FROM_AUTHOR }),
      translatedToUser: formatMessage({
        id: 'You are the author of this document'
      })
    },
    {
      idDb: 2,
      value: LICENSE_IN_FILE,
      translatedOption: formatMessage({ id: LICENSE_IN_FILE }),
      translatedToUser: formatMessage({
        id: 'The license is written in the files'
      })
    },
    {
      idDb: 3,
      value: DOCUMENT_AUTHORIZE_TO_PUBLISH,
      translatedOption: formatMessage({ id: DOCUMENT_AUTHORIZE_TO_PUBLISH }),
      translatedToUser: formatMessage({
        id: 'There is an authorization to publish from the author on GrottoCenter'
      })
    }
  ];

  return (
    <Wrapper variant="filled" required>
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
