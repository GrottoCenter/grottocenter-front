import {
  FormControl as MuiFormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@material-ui/core';
import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import CaveSelection from './CaveSelection';
import CaveCreation from './CaveCreation';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const Cave = ({
  control,
  errors,
  creationType,
  updateCreationType,
  allLanguages,
  reset,
  disabled = false
}) => {
  const { formatMessage } = useIntl();

  const handleRadioChange = event => {
    updateCreationType(event.target.value);
    reset();
  };

  return (
    <div>
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend">
          {formatMessage({ id: 'The cave is' })}
        </FormLabel>
        <RadioGroup
          aria-label="creationType"
          name="creationType"
          value={creationType}
          onChange={handleRadioChange}>
          <FormControlLabel
            value="entrance"
            control={<Radio />}
            label={formatMessage({ id: 'Linked to an existing network' })}
          />
          <FormControlLabel
            value="cave"
            control={<Radio />}
            label={formatMessage({
              id: 'First entrance of the cave (on Grottocenter)'
            })}
          />
        </RadioGroup>
      </FormControl>
      {creationType === 'cave' ? (
        <CaveCreation
          control={control}
          errors={errors}
          allLanguages={allLanguages}
        />
      ) : (
        <CaveSelection control={control} errors={errors} />
      )}
    </div>
  );
};
Cave.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({}),
  creationType: PropTypes.oneOf(['cave', 'entrance']),
  updateCreationType: PropTypes.func,
  disabled: PropTypes.bool,
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  reset: PropTypes.func
};

export default Cave;
