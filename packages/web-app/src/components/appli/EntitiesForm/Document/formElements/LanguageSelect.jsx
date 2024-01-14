import React, { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  withStyles
} from '@material-ui/core';

import { DocumentFormContext } from '../Provider';
import { loadLanguages } from '../../../../../actions/Language';
import Translate from '../../../../common/Translate';

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

const LanguageSelect = ({ contextValueName, labelText, required = false }) => {
  const dispatch = useDispatch();

  const { document, updateAttribute } = useContext(DocumentFormContext);

  const { languages, isLoaded } = useSelector(state => state.language);

  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadLanguages(true));
    }
  }, [dispatch, isLoaded]);

  return (
    <FormControlLanguage required={required}>
      <InputLabel shrink>
        <Translate>Language</Translate>
      </InputLabel>
      <Select
        value={isLoaded ? document[contextValueName] : '000'}
        onChange={e => updateAttribute(contextValueName, e.target.value)}>
        <MenuItem key="000" value="000">
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
      {labelText && (
        <FormHelperText>
          <Translate>{labelText}</Translate>
        </FormHelperText>
      )}
    </FormControlLanguage>
  );
};

LanguageSelect.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default LanguageSelect;
