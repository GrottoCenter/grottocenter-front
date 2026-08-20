/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { LinearProgress as MuiLinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { useUpdateDocumentWithNewEntities } from '../../../hooks';
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

  const updateDocumentMutation = useUpdateDocumentWithNewEntities();
  const docUpdateLoading = updateDocumentMutation.isPending;
  const isDocUpdateSuccess = updateDocumentMutation.isSuccess;

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
    updateDocumentMutation.mutate({
      document: data,
      newAuthors: newRelatedEntitiesObject.newAuthors,
      newDescriptions: newRelatedEntitiesObject.newDescriptions
    });
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
  }, [currentDuplicate]);

  // After a successful duplicate merge, delete the source duplicate row. The
  // mutation invalidates documentKeys.detail already; this step removes it
  // from the duplicates queue.
  useEffect(() => {
    if (isDocUpdateSuccess) {
      dispatch(deleteDuplicate(currentDuplicateId, 'document'));
      updateDocumentMutation.reset();
    }
  }, [isDocUpdateSuccess]);

  useEffect(() => {
    if ([200, 204].includes(latestHttpCodeOnDelete)) {
      onSuccessSubmit();
      setCurrentDuplicate(currentDuplicate + 1);
    }
  }, [latestHttpCodeOnDelete]);

  useEffect(() => {
    if ([200, 204].includes(latestHttpCodeOnCreate)) {
      onSuccessNotDuplicateSubmit();
      setCurrentDuplicate(currentDuplicate + 1);
    }
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
