import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import DeclineIcon from '@mui/icons-material/NotInterested';
import EditIcon from '@mui/icons-material/Edit';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import {
  formatDocumentProcessSummary,
  isDocumentProcessFinished,
  normalizeDocumentProcessResults
} from '@/utils/documentProcessResults';
import {
  useNotification,
  useOnlineStatus,
  useProcessDocuments
} from '../../hooks';
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

const Actions = ({
  selectedIds,
  onEdit,
  onProcessed = null,
  disabled = false,
  isEditDisabled = false,
  editDescriptionId,
  keepLabels = false,
  documents = [],
  draft,
  onDraftChange
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const { onSuccess, onWarning, onError } = useNotification();
  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] =
    useState(false);
  const [localDraft, setLocalDraft] = useState({
    isValidated: true,
    comment: ''
  });
  const activeDraft = draft ?? localDraft;
  const setDraft = onDraftChange ?? setLocalDraft;
  const { comment } = activeDraft;
  const actionType = activeDraft.isValidated
    ? ActionTypes.validate
    : ActionTypes.decline;

  const handleResults = (response, variables) => {
    const results = normalizeDocumentProcessResults(
      response,
      variables.ids
    ).map(result => ({
      ...result,
      title: variables.titles?.[result.id]
    }));
    const hasUnfinished = results.some(
      result => !isDocumentProcessFinished(result)
    );
    setIsConfirmationDialogOpen(false);
    // The page owns controlled drafts by submitted ID. Updating the current
    // selection here could overwrite a different document's draft mid-request.
    if (draft === undefined) {
      setDraft(
        hasUnfinished
          ? { isValidated: variables.isValidated, comment: variables.comment }
          : { isValidated: true, comment: '' }
      );
    }
    const summary = formatDocumentProcessSummary(results, formatMessage);
    if (hasUnfinished) onError(summary);
    else if (
      results.some(
        result =>
          result.status === 'auto_rejected' || result.status === 'not_found'
      )
    )
      onWarning(summary);
    else onSuccess(summary);
    onProcessed?.(results, variables);
  };
  // Hook-level callbacks also run if the preview is closed while submitting.
  const processMutation = useProcessDocuments({
    onSuccess: handleResults,
    onError: (error, variables) => {
      // The global handler owns session loss and the deduplicated rate-limit
      // toast. These requests did not reach document processing.
      if (error.status === 401 || error.status === 429) return;
      if (error.status === 400) {
        onError(formatMessage({ id: 'processDocumentsBadRequest' }));
        return;
      }
      if (error.status === 403) {
        onError(formatMessage({ id: 'processDocumentsForbidden' }));
        return;
      }
      handleResults(null, variables);
    }
  });
  const { isPending: isLoading } = processMutation;

  const hasNoSelectedIds = disabled || !selectedIds || selectedIds.length === 0;

  const handleActionConfirmation = selectedType => () => {
    setDraft({
      ...activeDraft,
      isValidated: selectedType === ActionTypes.validate
    });
    setIsConfirmationDialogOpen(true);
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          flexWrap: keepLabels ? 'nowrap' : 'wrap',
          ...(keepLabels && {
            display: { xs: 'grid', sm: 'flex' },
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            width: '100%',
            justifyContent: 'flex-end',
            pb: { xs: 'env(safe-area-inset-bottom)', sm: 0 },
            '& button': {
              minWidth: 0,
              minHeight: 44,
              px: { xs: 0.25, sm: 2 },
              whiteSpace: 'normal',
              overflowWrap: 'anywhere'
            },
            '& .MuiButton-startIcon': {
              ml: { xs: 0, sm: -0.5 },
              mr: { xs: 0.25, sm: 1 },
              flexShrink: 0
            }
          })
        }}>
        <ActionButton
          label={formatMessage({ id: ActionTypes.validate.name })}
          color="success"
          disabled={hasNoSelectedIds || isLoading}
          onClick={handleActionConfirmation(ActionTypes.validate)}
          icon={<VerifiedIcon />}
          data-testid={keepLabels ? 'preview-validate' : 'batch-validate'}
          shouldHideLabelOnMobile={!keepLabels}
        />
        <ActionButton
          label={formatMessage({ id: ActionTypes.edit.name })}
          variant="outlined"
          color="secondary"
          disabled={
            hasNoSelectedIds ||
            isLoading ||
            isEditDisabled ||
            selectedIds.length > 1
          }
          onClick={() => {
            if (selectedIds[0]) onEdit(selectedIds[0]);
          }}
          icon={<EditIcon />}
          data-testid={keepLabels ? 'preview-edit' : 'batch-edit'}
          aria-describedby={isEditDisabled ? editDescriptionId : undefined}
          shouldHideLabelOnMobile={!keepLabels}
        />
        <ActionButton
          label={formatMessage({ id: ActionTypes.decline.name })}
          color="error"
          disabled={hasNoSelectedIds || isLoading}
          onClick={handleActionConfirmation(ActionTypes.decline)}
          icon={<DeclineIcon />}
          data-testid={keepLabels ? 'preview-decline' : 'batch-decline'}
          shouldHideLabelOnMobile={!keepLabels}
        />
      </Box>
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
              if (
                !isOnline ||
                comment.length > TEXT_LENGTH_LIMITS.DOCUMENT_COMMENT
              )
                return;
              processMutation.mutate({
                ids: [...selectedIds],
                isValidated: actionType === ActionTypes.validate,
                comment,
                titles: Object.fromEntries(
                  documents.map(document => [document.id, document.title])
                )
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
            data-testid="confirm-process-documents"
            disabled={
              hasNoSelectedIds ||
              !isOnline ||
              (actionType === ActionTypes.decline && !comment.trim()) ||
              comment.length > TEXT_LENGTH_LIMITS.DOCUMENT_COMMENT
            }
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
          onValueChange={value => setDraft({ ...activeDraft, comment: value })}
          value={comment}
          characterLimit={TEXT_LENGTH_LIMITS.DOCUMENT_COMMENT}
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
  onProcessed: PropTypes.func,
  disabled: PropTypes.bool,
  isEditDisabled: PropTypes.bool,
  editDescriptionId: PropTypes.string,
  keepLabels: PropTypes.bool,
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string
    })
  ),
  draft: PropTypes.shape({
    isValidated: PropTypes.bool.isRequired,
    comment: PropTypes.string.isRequired
  }),
  onDraftChange: PropTypes.func
};
