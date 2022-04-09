import React from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import LanguageSelect from './Document/DocumentForm/formElements/LanguageSelect';

const DocumentLanguageSelect = ({
  contextValueName,
  helperText,
  labelText,
  required
}) => {
  const { languages: allLanguages } = useSelector(state => state.language);

  return (
    <LanguageSelect
      allLanguages={allLanguages}
      contextValueName={contextValueName}
      helperText={helperText}
      labelText={labelText}
      required={required}
    />
  );
};

DocumentLanguageSelect.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string,
  labelText: PropTypes.string,
  required: PropTypes.bool.isRequired
};

export default DocumentLanguageSelect;
