/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { LinearProgress as MuiLinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import {
  useCreateEntityFromDuplicate,
  useDeleteDuplicate,
  useDuplicate,
  useUpdateEntranceWithNewEntities
} from '../../../hooks';
import DuplicatesHandler from '../../common/DuplicatesHandler';

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const HydratedEntranceDuplicates = ({
  onSuccessSubmit,
  onSuccessNotDuplicateSubmit,
  goBack,
  selectedDuplicates
}) => {
  const { formatMessage } = useIntl();
  const [currentDuplicate, setCurrentDuplicate] = useState(0);
  const currentDuplicateId = selectedDuplicates[currentDuplicate];

  const updateMutation = useUpdateEntranceWithNewEntities();
  const deleteDuplicateMutation = useDeleteDuplicate('entrance');
  const createEntityMutation = useCreateEntityFromDuplicate('entrance');
  const { data: duplicate, error } = useDuplicate(
    'entrance',
    currentDuplicateId
  );
  const loadingDuplicate = !duplicate && !error && !!currentDuplicateId;

  const loading =
    updateMutation.isPending ||
    deleteDuplicateMutation.isPending ||
    createEntityMutation.isPending ||
    loadingDuplicate;

  useEffect(() => {
    if (!currentDuplicateId) goBack();
  }, [currentDuplicate]);

  useEffect(() => {
    if (updateMutation.isSuccess) {
      deleteDuplicateMutation.mutate(currentDuplicateId);
      updateMutation.reset();
    }
  }, [updateMutation.isSuccess]);

  useEffect(() => {
    if (deleteDuplicateMutation.isSuccess) {
      onSuccessSubmit();
      setCurrentDuplicate(currentDuplicate + 1);
      deleteDuplicateMutation.reset();
    }
  }, [deleteDuplicateMutation.isSuccess]);

  useEffect(() => {
    if (createEntityMutation.isSuccess) {
      onSuccessNotDuplicateSubmit();
      setCurrentDuplicate(currentDuplicate + 1);
      createEntityMutation.reset();
    }
  }, [createEntityMutation.isSuccess]);

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
    createEntityMutation.mutate(currentDuplicateId);
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
