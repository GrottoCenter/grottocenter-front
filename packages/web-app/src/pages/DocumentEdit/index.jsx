import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, isNil, head, pathOr, propOr, reject, pipe } from 'ramda';
import DocumentSubmission from '../DocumentSubmission';
import { fetchDocumentDetails } from '../../actions/DocumentDetails';
import docInfoGetters from './docInfoGetters';

const DocumentEdit = ({ onSuccessfulUpdate, id }) => {
  const dispatch = useDispatch();
  const { isLoading, details, error } = useSelector(
    state => state.documentDetails
  );

  const { latestHttpCode, errorMessages } = useSelector(
    state => state.document
  );

  useEffect(() => {
    if (!isNil(id)) {
      dispatch(fetchDocumentDetails(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (latestHttpCode === 200 && isEmpty(errorMessages)) {
      onSuccessfulUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCode, errorMessages]);

  return isLoading || !isNil(error) ? (
    <CircularProgress />
  ) : (
    <DocumentSubmission
      defaultValues={reject(isNil, {
        authorComment: propOr(null, 'authorComment', details),
        authors: pathOr(null, ['authors'], details),
        description: pipe(
          propOr([], ['descriptions']),
          head,
          propOr(null, ['text'])
        )(details),
        documentMainLanguage: propOr(null, 'mainLanguage', details),
        documentType: pathOr(null, ['type'], details),
        editor: pathOr(null, ['editor'], details),
        endPage: docInfoGetters.getEndPage(details),
        id: details.id,
        identifier: pathOr(null, ['identifier'], details),
        identifierType: pathOr(null, ['identifierType'], details),
        isNewDocument: false,
        // doesn't exist at the moment in the db, TODO
        issue: pathOr(null, ['issue'], details),
        library: pathOr(null, ['library'], details),
        massif: pathOr(null, ['massif'], details),
        partOf: docInfoGetters.getAndConvertParentDocument(details),
        publicationDate: propOr('', 'datePublication', details),
        regions: pathOr(null, ['regions'], details),
        startPage: docInfoGetters.getStartPage(details),
        subjects: pathOr(null, ['subjects'], details),
        title: pipe(propOr([], 'titles'), head, propOr(null, 'text'))(details),
        titleAndDescriptionLanguage: pipe(
          propOr([], 'titles'),
          head,
          propOr(null, 'language')
        )(details)
      })}
    />
  );
};

DocumentEdit.propTypes = {
  onSuccessfulUpdate: PropTypes.func.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default DocumentEdit;
