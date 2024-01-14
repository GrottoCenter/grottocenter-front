import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../EntitiesForm/Document/Provider';

import FormAutoCompleteComponent from '../../common/Form/FormAutoComplete';
import { FormAutoCompleteTypes } from '../../common/Form/types';

const FormAutoComplete = props => {
  const { contextValueName, helperContent, helperContentIfValueIsForced } =
    props;

  const { document } = useContext(DocumentFormContext);
  const isValueForced = document.parent !== null;

  return (
    <FormAutoCompleteComponent
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

FormAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  ...FormAutoCompleteInheritedProps
};

export default FormAutoComplete;
