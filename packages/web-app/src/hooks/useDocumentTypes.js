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

  const isUnknown = documentType => {
    return documentType.id === DocumentTypes.UNKNOWN;
  };
  const isCollection = documentType => {
    return documentType.id === DocumentTypes.COLLECTION;
  };
  const isIssue = documentType => {
    return documentType.id === DocumentTypes.ISSUE;
  };
  const isArticle = documentType => {
    return documentType.id === DocumentTypes.ARTICLE;
  };
  // Image is also included in "Other" type.
  const isImage = documentType => {
    return documentType.id === DocumentTypes.IMAGE;
  };
  const isOther = documentType => {
    return (
      !isUnknown(documentType) &&
      !isCollection(documentType) &&
      !isIssue(documentType) &&
      !isArticle(documentType)
    );
  };

  return {
    documentTypes: state.documentTypes,
    error,
    isArticle: docType => isArticle(docType),
    isCollection: docType => isCollection(docType),
    isIssue,
    isImage,
    isOther,
    isUnknown: docType => isUnknown(docType),
    loading
  };
};

export default useDocumentTypes;
