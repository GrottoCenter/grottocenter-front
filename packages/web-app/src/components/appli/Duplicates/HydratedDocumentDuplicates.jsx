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
  useUpdateDocumentWithNewEntities
} from '../../../hooks';
import DuplicatesHandler from '../../common/DuplicatesHandler';

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const HydratedDocumentDuplicates = ({
  onSuccessSubmit,
  onSuccessNotDuplicateSubmit,
  goBack,
  selectedDuplicates
}) => {
  const { formatMessage } = useIntl();
  const [currentDuplicate, setCurrentDuplicate] = useState(0);

  const currentDuplicateId = selectedDuplicates[currentDuplicate];

  const updateDocumentMutation = useUpdateDocumentWithNewEntities();
  const deleteDuplicateMutation = useDeleteDuplicate('document');
  const createEntityMutation = useCreateEntityFromDuplicate('document');
  const { data: duplicate, error } = useDuplicate(
    'document',
    currentDuplicateId
  );
  const loadingDuplicate = !duplicate && !error && !!currentDuplicateId;

  const showLoading =
    updateDocumentMutation.isPending ||
    deleteDuplicateMutation.isPending ||
    createEntityMutation.isPending ||
    loadingDuplicate;

  const updateDocument = (data, newRelatedEntitiesObject) => {
    updateDocumentMutation.mutate({
      document: data,
      newAuthors: newRelatedEntitiesObject.newAuthors,
      newDescriptions: newRelatedEntitiesObject.newDescriptions
    });
  };

  const createDocument = () => {
    createEntityMutation.mutate(currentDuplicateId);
  };

  useEffect(() => {
    if (!currentDuplicateId) goBack();
  }, [currentDuplicate]);

  useEffect(() => {
    if (updateDocumentMutation.isSuccess) {
      deleteDuplicateMutation.mutate(currentDuplicateId);
      updateDocumentMutation.reset();
    }
  }, [updateDocumentMutation.isSuccess]);

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
