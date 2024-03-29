import React, {
  useState,
  createContext,
  useEffect,
  useCallback,
  useMemo
} from 'react';
import PropTypes from 'prop-types';
import {
  __,
  append,
  isNil,
  mergeRight,
  pathOr,
  pipe,
  uniq,
  without
} from 'ramda';
import isStepValid from './ImportSteps/ImportStepsHelper';
import { defaultValuesTypes } from './types';
import { useBoolean } from '../../../hooks/useBoolean';
import { ENTRANCE } from './constants';

const defaultFormSteps = [
  { id: 1, name: 'General Information', isValid: false },
  { id: 2, name: 'File input', isValid: false },
  { id: 3, name: 'Review', isValid: false },
  { id: 4, name: 'Confirm or Rollback', isValid: true }
];

export const defaultContext = {
  importAttributes: {
    selectedType: ENTRANCE,
    baseErrors: {},
    fileImported: false,
    formSteps: defaultFormSteps
  },
  importData: [],
  selectedType: ENTRANCE,
  currentStep: 1,

  updateAttribute: (attributeName, newValue) => {}, // eslint-disable-line no-unused-vars
  resetContext: () => {}
};

export const ImportPageContentContext = createContext(defaultContext);

const Provider = ({ children, defaultValues = {} }) => {
  const [importFormState, setState] = useState(
    mergeRight(defaultContext.importAttributes, defaultValues)
  );
  const [selectedType, setSelectedType] = useState(defaultContext.selectedType);
  const [importData, setImportData] = useState(defaultContext.importData);
  const [validatedSteps, setValidatedSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(
    pathOr(null, [0, 'id'], defaultFormSteps)
  );
  const {
    isTrue: isFormValid,
    true: setFormValid,
    false: setFormInvalid
  } = useBoolean(false);
  const updateAttribute = useCallback((attributeName, newValue) => {
    switch (attributeName) {
      case 'selectedType':
        setSelectedType(newValue);
        break;
      case 'importData':
        setImportData(newValue);
        break;
      case 'validatedSteps':
        setValidatedSteps(newValue);
        break;
      default:
        setState(prevState => ({
          ...prevState,
          [attributeName]: newValue
        }));
        break;
    }
  }, []);

  const resetContext = useCallback(() => {
    setState(defaultContext.importAttributes);
    setCurrentStep(pathOr(null, [0, 'id'], defaultFormSteps));
    setValidatedSteps([]);
  }, [setState, setCurrentStep, setValidatedSteps]);

  useEffect(() => {
    const invalidateSteps = without(__, validatedSteps);
    const validateStep = pipe(append(__, validatedSteps), uniq);
    if (!isNil(currentStep)) {
      if (isStepValid(currentStep, importFormState, importData)) {
        setValidatedSteps(validateStep(currentStep));
      } else {
        setValidatedSteps(invalidateSteps([currentStep]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importFormState, currentStep]);

  useEffect(() => {
    if (defaultFormSteps.length === validatedSteps.length) {
      setFormValid();
    } else {
      setFormInvalid();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validatedSteps]);

  const contextValue = useMemo(
    () => ({
      action: {},
      currentStep,
      importAttributes: {
        ...importFormState,
        baseErrors: {},
        fileImported: false
      },
      importData,
      isFormValid,
      selectedType,
      resetContext,
      updateAttribute,
      updateCurrentStep: setCurrentStep,
      validatedSteps
    }),
    [
      currentStep,
      importData,
      importFormState,
      isFormValid,
      resetContext,
      selectedType,
      updateAttribute,
      validatedSteps
    ]
  );

  return (
    <ImportPageContentContext.Provider value={contextValue}>
      {children}
    </ImportPageContentContext.Provider>
  );
};

Provider.propTypes = {
  children: PropTypes.node.isRequired,
  defaultValues: defaultValuesTypes
};

export default Provider;
