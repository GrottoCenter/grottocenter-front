import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadDocumentTypes } from '../actions/DocumentType';

export const DocumentTypes = {
  UNKNOWN: 0,
  COLLECTION: 1,
  DATASET: 2,
  EVENT: 3,
  IMAGE: 4,
  INTERACTIVE_RESOURCE: 5,
  MOVING_IMAGE: 6,
  PHYSICAL_OBJECT: 7,
  SERVICE: 8,
  SOFTWARE: 9,
  SOUND: 10,
  STILL_IMAGE: 11,
  TEXT: 12,
  TOPOGRAPHIC_DRAWING: 13,
  TOPOGRAPHIC_DATA: 14,
  BOOK: 16,
  ISSUE: 17,
  ARTICLE: 18,
  MAP: 19,
  AUTHORIZATION_TO_PUBLISH: 20
};

const useDocumentTypes = () => {
  const { documentTypes: data, loading, error } = useSelector(
    state => state.documentType
  );
  const dispatch = useDispatch();
  const [state, setState] = useState({
    documentTypes: []
  });

  // Store types in state
  useEffect(() => {
    if (data.length > 0) {
      setState({
        documentTypes: data
      });
    }
  }, [data]);

  // Ask for types
  useEffect(() => {
    // Avoid uselesses requests if we already have the data
    if (data.length === 0) {
      dispatch(loadDocumentTypes());
    }
  }, [data, dispatch]);

  const isUnknown = docType => docType.id === DocumentTypes.UNKNOWN;
  const isCollection = docType => docType.id === DocumentTypes.COLLECTION;
  const isIssue = docType => docType.id === DocumentTypes.ISSUE;
  const isArticle = docType => docType.id === DocumentTypes.ARTICLE;
  const isImage = docType => docType.id === DocumentTypes.IMAGE;

  // Image is also included in "Other" type.
  const isOther = docType =>
    !isArticle(docType) &&
    !isCollection(docType) &&
    !isIssue(docType) &&
    !isUnknown(docType);

  return {
    documentTypes: state.documentTypes,
    error,
    isArticle,
    isCollection,
    isIssue,
    isImage,
    isOther,
    isUnknown: docType => isUnknown(docType),
    loading
  };
};

export default useDocumentTypes;
