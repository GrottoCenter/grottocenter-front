/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { LinearProgress as MuiLinearProgress } from '@material-ui/core';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import { isNil } from 'ramda';
import DuplicatesHandler from '../../common/DuplicatesHandler';
import { fetchDocumentDetails } from '../../../actions/DocumentDetails';
import { postDocument } from '../../../actions/Document';

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const HydratedDocumentDuplicates = ({ selectedDuplicates }) => {
  const { loading: docUpdateLoading, latestHttpCode } = useSelector(
    state => state.document
  );
  const { isLoading: docDetailsLoading, detail, error } = useSelector(
    state => state.documentDetails
  );
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [currentDuplicate, setCurrentDuplicate] = useState(0);

  useEffect(() => {
    dispatch(
      fetchDocumentDetails(selectedDuplicates[currentDuplicate].document)
    );
  }, [currentDuplicate]);

  useEffect(() => {
    if (latestHttpCode === 200) {
      setCurrentDuplicate(currentDuplicate + 1);
    }
  }, [latestHttpCode]);

  const updateDocument = data => {
    dispatch(updateDocument(data));
  };

  const createDocument = data => {
    dispatch(postDocument(data));
  };

  return (
    <>
      {docUpdateLoading ||
        (docDetailsLoading && (
          <LinearProgress $isLoading={docUpdateLoading || docDetailsLoading} />
        ))}
      {!docDetailsLoading && !isNil(error) && (
        <>
          <DuplicatesHandler
            duplicateType="document"
            duplicate1={detail}
            duplicate2={selectedDuplicates[currentDuplicate].content}
            titleDuplicate1={formatMessage({ id: 'Duplicate from database' })}
            titleDuplicate2={formatMessage({ id: 'Duplicate from import' })}
            handleSubmit={updateDocument}
            handleNotDuplicateSubmit={createDocument}
          />
        </>
      )}
    </>
  );
};

HydratedDocumentDuplicates.propTypes = {
  selectedDuplicates: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default HydratedDocumentDuplicates;
