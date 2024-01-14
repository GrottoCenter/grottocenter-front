import React, {
  useState,
  createContext,
  useCallback,
  useEffect,
  useMemo
} from 'react';
import PropTypes from 'prop-types';
import { DocumentTypes } from '../../../../hooks/useDocumentTypes';
import { defaultDocumentValuesTypes } from './types';

export const defaultDocAttributes = {
  id: null,
  identifier: null,
  identifierType: null,
  datePublication: '',
  creatorComment: '',
  authors: [],
  editor: null,
  library: null,
  type: -1,
  title: '',
  description: '',
  subjects: [],
  pages: null,
  issue: '',
  license: null,
  mainLanguage: '000',
  iso3166: [],
  option: null,
  parent: null,
  files: [],
  authorizationDocument: null
};

export function isDocumentPagesFormatValid(pages) {
  if (!pages || !pages.includes('-')) return true;
  if (pages.endsWith('-')) return false;

  const [start, end] = pages.split('-').map(e => parseInt(e, 10));
  if (start > 0 && end > 0 && end > start) return true;
  return false;
}

const checkFormValidation = document => {
  let isValid = true;

  if (!document.title) isValid = false;
  if (!document.description) isValid = false;
  if (document.type === DocumentTypes.ISSUE && !document.parent)
    isValid = false;

  if (!isDocumentPagesFormatValid(document.pages)) isValid = false;
  if (document.identifier && !document.identifierType) isValid = false;
  if (isValid && document.identifierType?.regexp)
    isValid = new RegExp(document.identifierType?.regexp).test(
      document.identifier
    );

  return !!isValid;
};

export const DocumentFormContext = createContext({
  document: defaultDocAttributes,
  isNewDocument: true,
  isFormValid: true,
  updateAttribute: (attributeName, newValue) => {}, // eslint-disable-line no-unused-vars
  resetContext: () => {}
});

const Provider = ({ children, initialValues }) => {
  const [document, setDocument] = useState({
    ...defaultDocAttributes,
    ...(initialValues ?? {})
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const updateAttribute = useCallback(
    (attributeName, newValue) => {
      setDocument(prevState => ({
        ...prevState,
        [attributeName]: newValue
      }));
    },
    [setDocument]
  );

  useEffect(() => {
    setIsFormValid(checkFormValidation(document));
  }, [document, setIsFormValid]);

  const resetContext = useCallback(() => {
    setDocument(defaultDocAttributes);
  }, [setDocument]);

  const contextValue = useMemo(
    () => ({
      document,
      isNewDocument: !initialValues,
      isFormValid,
      updateAttribute,
      resetContext
    }),
    [document, initialValues, isFormValid, updateAttribute, resetContext]
  );

  return (
    <DocumentFormContext.Provider value={contextValue}>
      {children}
    </DocumentFormContext.Provider>
  );
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  initialValues: defaultDocumentValuesTypes
};

export default Provider;
