/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { LinearProgress as MuiLinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { updateDocumentWithNewEntities } from '../../../actions/Document/UpdateDocument';
import DuplicatesHandler from '../../common/DuplicatesHandler';
import {
  createNewEntityFromDuplicate,
  deleteDuplicate,
  fetchDuplicate
} from '../../../actions/DuplicatesImport';

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const HydratedDocumentDuplicates = ({
  onSuccessSubmit,
  onSuccessNotDuplicateSubmit,
  goBack,
  selectedDuplicates
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [currentDuplicate, setCurrentDuplicate] = useState(0);

  const { loading: docUpdateLoading, latestHttpCode } = useSelector(
    state => state.updateDocument
  );

  const {
    loading: loadingDuplicate,
    duplicate,
    error,
    latestHttpCodeOnDelete,
    latestHttpCodeOnCreate
  } = useSelector(state => state.duplicatesImport);

  const showLoading = docUpdateLoading || loadingDuplicate;
  const currentDuplicateId = selectedDuplicates[currentDuplicate];

  const updateDocument = (data, newRelatedEntitiesObject) => {
    dispatch(
      updateDocumentWithNewEntities(
        data,
        newRelatedEntitiesObject.newAuthors,
        newRelatedEntitiesObject.newDescriptions
      )
    );
  };

  const createDocument = () => {
    dispatch(createNewEntityFromDuplicate(currentDuplicateId, 'document'));
  };

  useEffect(() => {
    if (currentDuplicateId) {
      dispatch(fetchDuplicate(currentDuplicateId, 'document'));
    } else {
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDuplicate]);

  useEffect(() => {
    if ([200, 204].includes(latestHttpCode)) {
      dispatch(deleteDuplicate(currentDuplicateId, 'document'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCode]);

  useEffect(() => {
    if ([200, 204].includes(latestHttpCodeOnDelete)) {
      onSuccessSubmit();
      setCurrentDuplicate(currentDuplicate + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCodeOnDelete]);

  useEffect(() => {
    if ([200, 204].includes(latestHttpCodeOnCreate)) {
      onSuccessNotDuplicateSubmit();
      setCurrentDuplicate(currentDuplicate + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCodeOnCreate]);

  return (
    <>
      {showLoading && <LinearProgress $isLoading={showLoading} />}
      {duplicate && isNil(error) && (
        <DuplicatesHandler
          duplicateType="document"
          duplicate1={duplicate.document}
          duplicate2={duplicate.content}
          titleDuplicate1={formatMessage({ id: 'Duplicate from database' })}
          titleDuplicate2={formatMessage({ id: 'Duplicate from import' })}
          handleSubmit={updateDocument}
          handleNotDuplicatesSubmit={createDocument}
        />
      )}
    </>
  );
};

HydratedDocumentDuplicates.propTypes = {
  selectedDuplicates: PropTypes.arrayOf(PropTypes.number).isRequired,
  goBack: PropTypes.func.isRequired,
  onSuccessSubmit: PropTypes.func.isRequired,
  onSuccessNotDuplicateSubmit: PropTypes.func.isRequired
};

export default HydratedDocumentDuplicates;
