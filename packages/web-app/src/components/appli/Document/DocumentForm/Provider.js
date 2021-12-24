import React, { useState, createContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  pathOr,
  isNil,
  without,
  append,
  uniq,
  pipe,
  mergeRight,
  __
} from 'ramda';
import { isStepValid } from './formSteps/DocumentStepsHelper';
import DocumentTypes from '../../../../conf/DocumentTypes';
import { defaultValuesTypes } from './types';

const defaultFormSteps = [
  { id: 1, name: 'General Information', isValid: false },
  { id: 2, name: 'Classification', isValid: false },
  { id: 3, name: 'Additional information', isValid: false },
  { id: 4, name: 'Files', isValid: true },
  { id: 5, name: 'Synthesis', isValid: true }
];

export const defaultContext = {
  docAttributes: {
    authors: [],
    authorComment: '',
    description: '',
    documentMainLanguage: null,
    documentType: { id: DocumentTypes.UNKNOWN },
    editor: null,
    endPage: null,
    id: null,
    identifier: '',
    identifierType: null,
    isNewDocument: true,
    issue: '',
    library: null,
    license: null,
    massif: null,
    partOf: null,
    publicationDate: '',
    regions: [],
    startPage: null,
    subjects: [],
    title: '',
    titleAndDescriptionLanguage: null,
    files: [],
    option: null,
    authorizationDocument: null,
    formSteps: defaultFormSteps
  },
  currentStep: 1,

  updateAttribute: (attributeName, newValue) => {}, // eslint-disable-line no-unused-vars
  resetContext: () => {}
};

export const DocumentFormContext = createContext(defaultContext);

const Provider = ({ children, defaultValues = {} }) => {
  const [docFormState, setState] = useState(
    mergeRight(defaultContext.docAttributes, defaultValues)
  );
  const [validatedSteps, setValidatedSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(
    pathOr(null, [0, 'id'], defaultFormSteps)
  );
  const [isFormValid, setIsFormValid] = useState(false);
  const updateAttribute = useCallback(
    (attributeName, newValue) => {
      setState(prevState => ({
        ...prevState,
        [attributeName]: newValue
      }));
    },
    [setState]
  );

  const resetContext = useCallback(() => {
    setState(defaultContext.docAttributes);
    setCurrentStep(pathOr(null, [0, 'id'], defaultFormSteps));
    setValidatedSteps([]);
  }, [setState, setCurrentStep, setValidatedSteps]);

  useEffect(() => {
    const invalidateSteps = without(__, validatedSteps);
    const validateStep = pipe(append(__, validatedSteps), uniq);
    if (!isNil(currentStep)) {
      if (isStepValid(currentStep, docFormState, docFormState.documentType)) {
        setValidatedSteps(validateStep(currentStep));
      } else {
        setValidatedSteps(invalidateSteps([currentStep]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docFormState, currentStep]);

  useEffect(() => {
    setIsFormValid(defaultFormSteps.length === validatedSteps.length);
  }, [validatedSteps]);

  return (
    <DocumentFormContext.Provider
      value={{
        action: {},
        currentStep,
        docAttributes: docFormState,
        isFormValid,
        resetContext,
        updateAttribute,
        updateCurrentStep: setCurrentStep,
        validatedSteps
      }}>
      {children}
    </DocumentFormContext.Provider>
  );
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultValues: defaultValuesTypes
};

export default Provider;
