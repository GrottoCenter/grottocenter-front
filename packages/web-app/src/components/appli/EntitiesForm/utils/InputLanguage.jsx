import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Controller } from 'react-hook-form';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  withStyles
} from '@material-ui/core';
import Translate from '../../../common/Translate';

const FormControlLanguage = withStyles(
  theme => ({
    root: {
      width: '100%',
      minWidth: '120px',
      [theme.breakpoints.up('sm')]: {
        width: 'initial'
      }
    }
  }),
  { withTheme: true }
)(FormControl);

const InputLanguage = ({
  formKey,
  control,
  isError,
  isDisabled = false,
  labelName = false
}) => {
  const { languages: allLanguages } = useSelector(state => state.language);
  return (
    <Controller
      name={formKey}
      control={control}
      rules={{ required: true }}
      render={({ field: { ref, value, onChange } }) => (
        <FormControlLanguage required error={isError}>
          <InputLabel shrink>
            <Translate>Language</Translate>
          </InputLabel>
          <Select
            disabled={isDisabled}
            value={value}
            onChange={onChange}
            inputRef={ref}>
            <MenuItem key={-1} value={-1} disabled>
              <i>
                <Translate>Select a language</Translate>
              </i>
            </MenuItem>
            {allLanguages.map(l => (
              <MenuItem key={l.id} value={l.id} name={l.refName}>
                <Translate>{l.refName}</Translate>
              </MenuItem>
            ))}
          </Select>
          {labelName && (
            <FormHelperText>
              <Translate>{labelName}</Translate>
            </FormHelperText>
          )}
        </FormControlLanguage>
      )}
    />
  );
};

InputLanguage.propTypes = {
  formKey: PropTypes.string.isRequired,
  control: PropTypes.shape({}).isRequired,
  isError: PropTypes.bool.isRequired,
  labelName: PropTypes.string,
  isDisabled: PropTypes.bool
};

export default InputLanguage;
