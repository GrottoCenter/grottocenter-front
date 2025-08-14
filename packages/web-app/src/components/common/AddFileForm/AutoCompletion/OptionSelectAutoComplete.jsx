import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../../../appli/EntitiesForm/DocumentV2/Provider';

import OptionSelect from '../OptionSelect';
import FormAutoComplete from '../../../appli/Form/FormAutoComplete';

const OptionSelectAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  updateSelectedOption
}) => {
  const { document } = useContext(DocumentFormContext);

  return (
    <FormAutoComplete
      autoCompleteSearch={
        <OptionSelect
          label={labelText}
          selectedOption={document[contextValueName]}
          updateSelectedOption={updateSelectedOption}
        />
      }
      contextValueName={contextValueName}
      getValueName={name => name}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      resultEndAdornment={null}
      sideActionDisabled={false}
      sideActionIcon={null}
      onSideAction={null}
      isSideActionOpen={false}
    />
  );
};

OptionSelectAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  updateSelectedOption: PropTypes.func.isRequired
};

export default OptionSelectAutoComplete;
