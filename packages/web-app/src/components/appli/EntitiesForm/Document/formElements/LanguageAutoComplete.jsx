import React, { useEffect, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select
} from '@mui/material';
import withStyles from '@mui/styles/withStyles';

import DocumentFormAutoComplete from './DocumentFormAutoComplete';
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

const LanguageSelect = ({
  contextValueName,
  contextValueNameOfTheLanguage = null,
  labelText,
  required = false
}) => {
  const dispatch = useDispatch();

  const { document, updateAttribute } = useContext(DocumentFormContext);

  const { languages, isLoaded } = useSelector(state => state.language);

  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadLanguages(true));
    }
  }, [dispatch, isLoaded]);

  return (
    <FormControlLanguage required={required} variant="standard">
      <InputLabel shrink>
        <Translate>Language</Translate>
      </InputLabel>
      <Select
        value={isLoaded ? document[contextValueName] : '000'}
        onChange={e => {
          updateAttribute(contextValueName, e.target.value.id);
          if (contextValueNameOfTheLanguage) {
            updateAttribute(
              contextValueNameOfTheLanguage,
              e.target.value.refName
            );
          }
        }}>
        <MenuItem key="000" value="000">
          <i>
            <Translate>
              {isLoaded ? 'Select a language' : 'Loading...'}
            </Translate>
          </i>
        </MenuItem>
        {languages.map(l => (
          <MenuItem
            key={l.id}
            value={{ id: l.id, refName: l.refName }}
            name={l.refName}>
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
  contextValueNameOfTheLanguage: PropTypes.string,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool
};

const LanguageAutoComplete = ({
  contextValueName,
  contextValueNameOfTheLanguage,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false
}) => {
  const { document } = useContext(DocumentFormContext);

  return (
    <DocumentFormAutoComplete
      autoCompleteSearch={
        <LanguageSelect
          label={labelText}
          contextValueName={contextValueName}
          contextValueNameOfTheLanguage={contextValueNameOfTheLanguage}
        />
      }
      contextValueName={contextValueName}
      getValueName={() => {
        if (
          document &&
          document[contextValueName] &&
          document[contextValueNameOfTheLanguage]
        ) {
          return document[contextValueNameOfTheLanguage];
        }
        return '';
      }}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={null} // No specific adornment needed for license selection
      sideActionDisabled={false}
      sideActionIcon={null}
      onSideAction={null}
      isSideActionOpen={null}
    />
  );
};

LanguageAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  contextValueNameOfTheLanguage: PropTypes.string,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default LanguageAutoComplete;
