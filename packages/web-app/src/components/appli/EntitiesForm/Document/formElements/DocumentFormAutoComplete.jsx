import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';

import FormAutoComplete from '../../../../common/Form/FormAutoComplete';
import { FormAutoCompleteTypes } from '../../../../common/Form/types';

const DocumentFormAutoComplete = props => {
  const { contextValueName, helperContent, helperContentIfValueIsForced } =
    props;

  const { document } = useContext(DocumentFormContext);
  const isValueForced = document.parent !== null;

  return (
    <FormAutoComplete
      {...props}
      value={document[contextValueName]}
      helperContent={
        isValueForced ? helperContentIfValueIsForced : helperContent
      }
    />
  );
};

const FormAutoCompleteInheritedProps = FormAutoCompleteTypes;
delete FormAutoCompleteInheritedProps.value;
delete FormAutoCompleteInheritedProps.isValueForced;

DocumentFormAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  ...FormAutoCompleteInheritedProps
};

export default DocumentFormAutoComplete;
