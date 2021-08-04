import React, { useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from '@material-ui/core';

import LanguageIcon from '@material-ui/icons/Translate';

import Translate from '../../../../common/Translate';
import { DocumentFormContext } from '../Provider';

const LanguageSelect = ({
  allLanguages = [],
  contextValueName,
  helperText,
  labelText,
  required = false
}) => {
  const {
    docAttributes: { [contextValueName]: language },
    updateAttribute
  } = useContext(DocumentFormContext);

  // Find user language in languages from the DB
  const languageState = useSelector(state => state.language);
  const { lang: userLanguage, languages } = languageState;
  const defaultUserLanguage = languages.find(l => l.part1 === userLanguage);
  if (defaultUserLanguage && !language) {
    updateAttribute(contextValueName, defaultUserLanguage);
  }

  const handleChange = (event, child) => {
    const newLanguage = {
      id: event.target.value,
      refName: child.props.name
    };
    updateAttribute(contextValueName, newLanguage);
  };

  const memoizedValues = [allLanguages, language];
  return useMemo(
    () => (
      <FormControl
        variant="filled"
        required={required}
        fullWidth
        error={required && language === null}>
        <InputLabel htmlFor={labelText}>
          <LanguageIcon style={{ verticalAlign: 'middle' }} />
          <Translate>{labelText}</Translate>
        </InputLabel>

        <Select
          value={language === null ? -1 : language.id}
          onChange={handleChange}
          inputProps={{
            name: `${labelText}`,
            id: `${labelText}`
          }}>
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
        {helperText && (
          <FormHelperText>
            <Translate>{helperText}</Translate>
          </FormHelperText>
        )}
      </FormControl>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoizedValues
  );
};

LanguageSelect.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default LanguageSelect;
