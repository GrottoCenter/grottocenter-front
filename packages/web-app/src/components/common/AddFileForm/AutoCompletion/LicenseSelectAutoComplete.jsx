import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../../../appli/EntitiesForm/DocumentV2/Provider';

import LicenseSelect from '../LicenseSelect';
import FormAutoComplete from '../../../appli/Form/FormAutoComplete';

const LicenseSelectAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  updateSelected
}) => {
  const { document } = useContext(DocumentFormContext);

  return (
    <FormAutoComplete
      autoCompleteSearch={
        <LicenseSelect
          label={labelText}
          selected={document[contextValueName]}
          updateSelected={updateSelected}
        />
      }
      contextValueName={contextValueName}
      getValueName={license => {
        if (license && license.name) {
          return license.name;
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

LicenseSelectAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.string,
  helperContentIfValueIsForced: PropTypes.string,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  updateSelected: PropTypes.func.isRequired
};

export default LicenseSelectAutoComplete;
