import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { LinearProgress as MuiLinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import {
  createNewEntityFromDuplicate,
  deleteDuplicate,
  fetchDuplicate
} from '../../../actions/DuplicatesImport';
import DuplicatesHandler from '../../common/DuplicatesHandler';
import { useUpdateEntranceWithNewEntities } from '../../../hooks';

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const HydratedEntranceDuplicates = ({
  onSuccessSubmit,
  onSuccessNotDuplicateSubmit,
  goBack,
  selectedDuplicates
}) => {
  const updateMutation = useUpdateEntranceWithNewEntities();
  const {
    loading: loadingDuplicate,
    duplicate,
    error,
    latestHttpCodeOnDelete,
    latestHttpCodeOnCreate
  } = useSelector(state => state.duplicatesImport);
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [currentDuplicate, setCurrentDuplicate] = useState(0);

  const loading = updateMutation.isPending || loadingDuplicate;
  const currentDuplicateId = selectedDuplicates[currentDuplicate];

  useEffect(() => {
    if (currentDuplicateId) {
      dispatch(fetchDuplicate(currentDuplicateId, 'entrance'));
    } else {
      goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDuplicate]);

  useEffect(() => {
    if (updateMutation.isSuccess) {
      dispatch(deleteDuplicate(currentDuplicateId, 'entrance'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateMutation.isSuccess]);

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

  const updateEntry = (entryObject, newRelatedEntitiesObject) => {
    updateMutation.mutate({
      entrance: entryObject,
      newNames: newRelatedEntitiesObject.newNames,
      newDescriptions: newRelatedEntitiesObject.newDescriptions,
      newLocations: newRelatedEntitiesObject.newLocations,
      newRiggings: newRelatedEntitiesObject.newRiggings,
      newComments: newRelatedEntitiesObject.newComments
    });
  };

  const createEntry = () => {
    dispatch(createNewEntityFromDuplicate(currentDuplicateId, 'entrance'));
  };

  return (
    <>
      {loading && <LinearProgress $isLoading={loading} />}
      {duplicate && isNil(error) && (
        <DuplicatesHandler
          duplicateType="entrance"
          duplicate1={duplicate.entrance}
          duplicate2={duplicate.content}
          titleDuplicate1={formatMessage({ id: 'Duplicate from database' })}
          titleDuplicate2={formatMessage({ id: 'Duplicate from import' })}
          handleSubmit={updateEntry}
          handleNotDuplicatesSubmit={createEntry}
        />
      )}
    </>
  );
};

HydratedEntranceDuplicates.propTypes = {
  selectedDuplicates: PropTypes.arrayOf(PropTypes.number).isRequired,
  goBack: PropTypes.func.isRequired,
  onSuccessSubmit: PropTypes.func.isRequired,
  onSuccessNotDuplicateSubmit: PropTypes.func.isRequired
};

export default HydratedEntranceDuplicates;
