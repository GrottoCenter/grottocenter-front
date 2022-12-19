import { isNil, isEmpty } from 'ramda';
import {
  AUTHORIZATION_FROM_AUTHOR,
  DOCUMENT_AUTHORIZE_TO_PUBLISH,
  LICENSE_IN_FILE
} from '../../../../../hooks/useDocumentOptions';
import DocumentTypes from '../../../../../conf/DocumentTypes';
import checkDocumentPages from '../../../../../helpers/validateDocumentPages';

const isStep1Valid = (stepData, documentType) => {
  if (isNil(stepData)) {
    return false;
  }
  const {
    title,
    titleAndDescriptionLanguage,
    documentMainLanguage,
    description,
    publicationDate
  } = stepData;
  const isValid =
    title !== '' && titleAndDescriptionLanguage !== null && description !== '';

  switch (documentType.id) {
    case DocumentTypes.UNKNOWN:
      return false;
    case DocumentTypes.ISSUE:
      return isValid && publicationDate !== '' && documentMainLanguage !== null;
    case DocumentTypes.ARTICLE:
      return isValid && documentMainLanguage !== null;
    case DocumentTypes.COLLECTION:
      return isValid && documentMainLanguage !== null;
    case DocumentTypes.IMAGE:
    default:
      return isValid;
  }
};

const isStep2Valid = (stepData, documentType) => {
  if (isNil(stepData)) {
    return false;
  }
  const { editor, partOf, authors, subjects } = stepData;

  switch (documentType.id) {
    case DocumentTypes.UNKNOWN:
      return false;
    case DocumentTypes.COLLECTION:
      return editor !== null;
    case DocumentTypes.ISSUE:
      return editor !== null && partOf !== null;
    case DocumentTypes.ARTICLE:
      return authors.length > 0 && subjects.length > 0;
    case DocumentTypes.IMAGE:
    default:
      return authors.length > 0;
  }
};

const isStep3Valid = stepData => {
  if (isNil(stepData)) {
    return false;
  }
  const { identifier, identifierType, startPage, endPage } = stepData;

  const arePagesOk = checkDocumentPages(startPage, endPage).length === 0;

  let regexpValidation = false;
  if (identifierType !== null) {
    const regexp = new RegExp(identifierType.regexp);
    regexpValidation = regexp.test(identifier);
  }

  return (
    arePagesOk &&
    (identifier === '' ||
      (identifier !== '' && identifierType !== null && regexpValidation))
  );
};

const isStep4Valid = stepData => {
  const { files, option, license, authorizationDocument } = stepData;
  if (isEmpty(files)) {
    return true;
  }

  for (let i = 0; i < files.length; i += 1) {
    if (isEmpty(files[i].name)) {
      return false;
    }
  }

  switch (option) {
    case AUTHORIZATION_FROM_AUTHOR:
      return !isNil(license);
    case LICENSE_IN_FILE:
      return !isNil(license);
    case DOCUMENT_AUTHORIZE_TO_PUBLISH:
      return !isNil(authorizationDocument);
    default:
      return false;
  }
};

// currentStep must be the index +1
// eslint-disable-next-line import/prefer-default-export
export const isStepValid = (currentStep, stepData, documentType) => {
  switch (currentStep) {
    case 1:
      return isStep1Valid(stepData, documentType);
    case 2:
      return isStep2Valid(stepData, documentType);
    case 3:
      return isStep3Valid(stepData);
    case 4:
      return isStep4Valid(stepData);
    case 5: // case 5 is whole submission recap => it's always valid
      return true;
    default:
      return false;
  }
};
