import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';

import FormAutoComplete from '../../../Form/FormAutoComplete';
import LanguageSelect from './LanguageSelect';

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
    <FormAutoComplete
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
