import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';

import IdentifierEditor from './Document/DocumentForm/formElements/IdentifierEditor';
import { loadIdentifierTypes } from '../../actions/IdentifierType';
import idNameType from '../../types/idName.type';

const DocIdentifierEditor = ({
  documentType,
  contextIdentifierValueName,
  contextIdentifierTypeValueName
}) => {
  const dispatch = useDispatch();
  const { identifierTypes: allIdentifierTypes } = useSelector(
    state => state.identifierType
  );

  useEffect(() => {
    dispatch(loadIdentifierTypes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <IdentifierEditor
      allIdentifierTypes={allIdentifierTypes}
      contextIdentifierValueName={contextIdentifierValueName}
      contextIdentifierTypeValueName={contextIdentifierTypeValueName}
      documentType={documentType}
    />
  );
};

DocIdentifierEditor.propTypes = {
  documentType: idNameType.isRequired,
  contextIdentifierValueName: PropTypes.string.isRequired,
  contextIdentifierTypeValueName: PropTypes.string.isRequired
};

export default DocIdentifierEditor;
