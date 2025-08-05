import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../../../appli/EntitiesForm/Document/Provider';

import DocumentAuthorizationSelect from '../../../appli/Form/DocumentAuthorizationSelect';
import FormAutoComplete from '../../../appli/Form/FormAutoComplete';

const DocumentAuthorizationSelectAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  updateSelectedDocument
}) => {
  const { document } = useContext(DocumentFormContext);

  return (
    <FormAutoComplete
      autoCompleteSearch={
        <DocumentAuthorizationSelect
          label={labelText}
          selectedDocument={document[contextValueName]}
          updateSelectedDocument={updateSelectedDocument}
        />
      }
      contextValueName={contextValueName}
      getValueName={doc => {
        if (doc && doc.title) {
          return doc.title;
        }
        return '';
      }}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      searchLabelText={labelText}
      resultEndAdornment={null}
      sideActionDisabled={false}
      sideActionIcon={null}
      onSideAction={null}
      isSideActionOpen={false}
    />
  );
};

DocumentAuthorizationSelectAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  updateSelectedDocument: PropTypes.func.isRequired
};

export default DocumentAuthorizationSelectAutoComplete;
