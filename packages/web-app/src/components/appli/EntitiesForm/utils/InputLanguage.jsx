import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { Controller } from 'react-hook-form';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  withStyles
} from '@material-ui/core';
import { loadLanguages } from '../../../../actions/Language';
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
  const { languages, isLoaded } = useSelector(state => state.language);
  const dispatch = useDispatch();
  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadLanguages(true));
    }
  }, [dispatch, isLoaded]);

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
            value={isLoaded ? value : -1}
            onChange={onChange}
            inputRef={ref}>
            <MenuItem key={-1} value={-1} disabled>
              <i>
                <Translate>
                  {isLoaded ? 'Select a language' : 'Loading...'}
                </Translate>
              </i>
            </MenuItem>
            {languages.map(l => (
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
