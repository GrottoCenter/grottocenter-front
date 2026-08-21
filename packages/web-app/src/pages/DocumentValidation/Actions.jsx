import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import VerifiedIcon from '@mui/icons-material/Verified';
import DeclineIcon from '@mui/icons-material/NotInterested';
import EditIcon from '@mui/icons-material/Edit';
import { useProcessDocuments } from '../../hooks';
import ActionButton from '../../components/common/ActionButton';
import StandardDialog from '../../components/common/StandardDialog';
import StringInput from '../../components/common/Form/StringInput';

// `edit` has no confirmation dialog (the Edit button calls `onEdit` directly),
// so it only needs a name for the button label — no confirmationText/helperText.
const ActionTypes = {
  edit: {
    name: 'Edit'
  },
  decline: {
    confirmationText: 'Confirmation of document refusal',
    helperText:
      'Indicate to the contributor(s) why you decline the document(s) he / she / they submitted.',
    name: 'Decline'
  },
  validate: {
    confirmationText: 'Confirmation of document approval',
    helperText:
      'Indicate to the contributor(s) why you validate the document(s) he / she / they submitted.',
    name: 'Validate'
  }
};

const Wrapper = styled('div')`
  display: flex;
  flex-direction: row;
  margin-top: ${({ theme }) => theme.spacing(2)};
  & > button {
    margin-right: ${({ theme }) => theme.spacing(1)};
  }
`;

const Actions = ({ selectedIds, onEdit, onProcessed = null }) => {
  const { formatMessage } = useIntl();
  const processMutation = useProcessDocuments();
  const { isPending: isLoading, isSuccess: success, reset } = processMutation;
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [actionType, setActionType] = useState(null);
  const [comment, setComment] = useState('');

  const hasNoSelectedIds = !selectedIds || selectedIds.length === 0;

  const handleActionConfirmation = selectedType => () => {
    setActionType(selectedType);
    setIsConfirmationDialogOpen(true);
  };

  // Reset the mutation so `success` doesn't stay sticky across renders — if it
  // did, an unmemoized `onProcessed` from the parent would re-fire this effect
  // and re-invoke setSelectedIds([]) → infinite update loop.
  useEffect(() => {
    if (success) {
      setIsConfirmationDialogOpen(false);
      setComment('');
      if (onProcessed) onProcessed();
      reset();
    }
  }, [success, onProcessed, reset]);

  return (
    <>
      <Wrapper>
        <ActionButton
          label={formatMessage({ id: ActionTypes.validate.name })}
          color="success"
          disabled={hasNoSelectedIds || isLoading}
          onClick={handleActionConfirmation(ActionTypes.validate)}
          icon={<VerifiedIcon />}
        />
        <ActionButton
          label={formatMessage({ id: ActionTypes.edit.name })}
          variant="outlined"
          color="secondary"
          disabled={hasNoSelectedIds || isLoading || selectedIds.length > 1}
          onClick={() => {
            if (selectedIds[0]) onEdit(selectedIds[0]);
          }}
          icon={<EditIcon />}
        />
        <ActionButton
          label={formatMessage({ id: ActionTypes.decline.name })}
          color="error"
          disabled={hasNoSelectedIds || isLoading}
          onClick={handleActionConfirmation(ActionTypes.decline)}
          icon={<DeclineIcon />}
        />
      </Wrapper>
      <StandardDialog
        maxWidth="xs"
        fullWidth
        scrollable
        open={isConfirmationDialogOpen}
        onClose={() => setIsConfirmationDialogOpen(false)}
        title={actionType && formatMessage({ id: actionType.confirmationText })}
        actions={[
          <ActionButton
            key={0}
            label={`${formatMessage({
              id: actionType?.name ?? ActionTypes.validate.name
            })} ${selectedIds.length} ${formatMessage({ id: 'document(s)' })}`}
            color={actionType === ActionTypes.validate ? 'success' : 'error'}
            onClick={() => {
              processMutation.mutate({
                ids: selectedIds,
                isValidated: actionType === ActionTypes.validate,
                comment
              });
            }}
            icon={
              actionType === ActionTypes.validate ? (
                <VerifiedIcon />
              ) : (
                <DeclineIcon />
              )
            }
            loading={isLoading}
            disabled={actionType === ActionTypes.decline && !comment}
          />
        ]}>
        <StringInput
          helperText={
            actionType
              ? formatMessage({
                  id: actionType.helperText
                })
              : ''
          }
          multiline
          onValueChange={setComment}
          value={comment}
          valueName={formatMessage({ id: 'Comment' })}
          required={actionType === ActionTypes.decline}
        />
      </StandardDialog>
    </>
  );
};

export default Actions;

Actions.propTypes = {
  selectedIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  onEdit: PropTypes.func.isRequired,
  onProcessed: PropTypes.func
};
