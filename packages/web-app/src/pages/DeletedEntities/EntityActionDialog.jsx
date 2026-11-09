import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  Alert,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';
import { apiGet } from '@/api/client';
import { DeleteConfirmationDialog } from '@/components/common/card/Deleted';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import StandardDialog from '@/components/common/StandardDialog';
import {
  useDeleteCave,
  useDeleteDocument,
  useDeleteEntrance,
  useDeleteGuideline,
  useDeleteMassif,
  useDeleteOrganization,
  useRestoreCave,
  useRestoreDocument,
  useRestoreEntrance,
  useRestoreGuideline,
  useRestoreMassif,
  useRestoreOrganization,
  useOnlineStatus,
  usePermissions
} from '@/hooks';
import { useNotification } from '@/hooks/useNotification';
import {
  DELETED_ENTITY_RESOURCES,
  getDeletedEntityName
} from '@/utils/deletedEntities';
import { getOrganizationIconType } from '@/utils/organizationIcons';

const EntityActionDialog = ({
  resource,
  id,
  action,
  deletion,
  restoration,
  onClose
}) => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();
  const permissions = usePermissions();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const isSubmitting = useRef(false);
  const [isChecking, setChecking] = useState(false);
  const [actionError, setActionError] = useState(null);
  const config = DELETED_ENTITY_RESOURCES[resource];
  const isPermanent = action === 'delete';
  const canAct = isPermanent
    ? permissions.canPermanentlyDeleteEntities
    : permissions.canManageDeletedEntities;
  const sourceQuery = useQuery({
    queryKey: config.keys.detail(id),
    queryFn: () => apiGet(`${config.collectionUrl}/${id}`),
    enabled: canAct,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    retry: false
  });
  const source = sourceQuery.data;
  const isSourceValid =
    source?.isDeleted === true && String(source.id) === String(id);
  const mutation = isPermanent ? deletion : restoration;
  const isLoading = isChecking || mutation.isPending;
  const name = source ? getDeletedEntityName(source) : `#${id}`;
  const hasChanged =
    sourceQuery.isSuccess && !sourceQuery.isFetching && !isSourceValid;
  const changedError = hasChanged
    ? Object.assign(new Error('Entity changed'), {
        code: 'deletedEntities.changed'
      })
    : null;
  const error =
    actionError || mutation.error || sourceQuery.error || changedError;
  const refreshList = () =>
    queryClient.invalidateQueries({ queryKey: [...config.keys.all, 'list'] });
  useEffect(() => {
    if (sourceQuery.isSuccess && !isSourceValid) {
      queryClient.invalidateQueries({ queryKey: [...config.keys.all, 'list'] });
    }
  }, [sourceQuery.isSuccess, isSourceValid, config.keys, queryClient]);
  const handleClose = () => {
    if (!isSubmitting.current && !mutation.isPending) onClose();
  };
  const handleConfirmation = async target => {
    if (isSubmitting.current || !canAct || !isOnline) return;
    isSubmitting.current = true;
    setChecking(true);
    setActionError(null);
    try {
      // Recheck immediately before writing: a row may have been restored in
      // another session while the confirmation was open.
      const fresh = await apiGet(`${config.collectionUrl}/${id}`);
      if (
        fresh?.isDeleted !== true ||
        String(fresh.id) !== String(id) ||
        (isPermanent &&
          (fresh.redirectTo ?? null) !== (source.redirectTo ?? null))
      ) {
        throw Object.assign(new Error('Entity changed'), {
          code: 'deletedEntities.changed'
        });
      }
      if (isPermanent) {
        await deletion.mutateAsync({
          id,
          entityId: target?.id,
          isPermanent: true
        });
      } else {
        await restoration.mutateAsync({ id });
        onSuccess(formatMessage({ id: 'deletedEntities.restored' }));
        onClose();
      }
    } catch (failure) {
      setActionError(failure);
      refreshList();
      throw failure;
    } finally {
      isSubmitting.current = false;
      setChecking(false);
    }
  };

  if (isPermanent) {
    return (
      <DeleteConfirmationDialog
        entityType={config.entityType}
        entityId={id}
        entityName={name}
        entityIconType={
          resource === 'organizations'
            ? getOrganizationIconType(source?.type)
            : config.entityType.iconType
        }
        existingRedirectId={sourceQuery.isFetching ? null : source?.redirectTo}
        isOpen
        isLoading={isLoading || sourceQuery.isFetching}
        isConfirmationDisabled={
          !isSourceValid || !!sourceQuery.error || !canAct
        }
        error={error}
        isPermanent
        isSearchMandatory={
          resource === 'caves' &&
          (source?.nbEntrances ?? source?.entrances?.length ?? 0) > 0
        }
        successMessageId="deletedEntities.permanentlyDeleted"
        consequences={
          <Stack spacing={1}>
            {resource === 'entrances' && (
              <Alert severity="warning">
                {formatMessage({ id: 'deletedEntities.entranceConsequences' })}
              </Alert>
            )}
            {sourceQuery.error && (
              <Button
                disabled={!isOnline || sourceQuery.isFetching}
                onClick={() => sourceQuery.refetch()}>
                {formatMessage({ id: 'Retry' })}
              </Button>
            )}
          </Stack>
        }
        onClose={handleClose}
        onConfirmation={handleConfirmation}
      />
    );
  }

  return (
    <StandardDialog
      open
      fullWidth
      scrollable
      title={formatMessage({ id: 'Restore' })}
      onClose={handleClose}
      actions={
        <Stack direction="row" spacing={1}>
          <Button onClick={handleClose} disabled={isLoading}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          <Button
            variant="contained"
            disabled={
              !canAct ||
              !isOnline ||
              isLoading ||
              !isSourceValid ||
              sourceQuery.isFetching ||
              !!sourceQuery.error
            }
            onClick={() => handleConfirmation().catch(() => {})}>
            {formatMessage({ id: 'Restore' })}
          </Button>
        </Stack>
      }>
      <Typography sx={{ overflowWrap: 'anywhere' }}>
        {formatMessage({ id: config.entityType.str })} — {name}
        {name !== `#${id}` && ` (#${id})`}
      </Typography>
      {(sourceQuery.isFetching || isLoading) && <CircularProgress size={24} />}
      <FormSubmissionError error={error} />
      {sourceQuery.error && (
        <Button
          disabled={!isOnline || sourceQuery.isFetching}
          onClick={() => sourceQuery.refetch()}>
          {formatMessage({ id: 'Retry' })}
        </Button>
      )}
      {resource === 'caves' && (
        <Alert severity="info">
          {formatMessage({ id: 'deletedEntities.caveRestoration' })}
        </Alert>
      )}
    </StandardDialog>
  );
};

const mutationPropType = PropTypes.shape({
  mutateAsync: PropTypes.func.isRequired,
  isPending: PropTypes.bool.isRequired,
  error: PropTypes.instanceOf(Error)
});

const actionDialogPropTypes = {
  resource: PropTypes.string.isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  action: PropTypes.oneOf(['restore', 'delete']).isRequired,
  onClose: PropTypes.func.isRequired
};

EntityActionDialog.propTypes = {
  ...actionDialogPropTypes,
  deletion: mutationPropType.isRequired,
  restoration: mutationPropType.isRequired
};

// Each adapter owns its hooks. Mount only the selected resource's adapter,
// preserving each mutation's cache/map side effects without dynamic hook calls.
const OrganizationActions = ({ resource, id, action, onClose }) => (
  <EntityActionDialog
    resource={resource}
    id={id}
    action={action}
    onClose={onClose}
    deletion={useDeleteOrganization()}
    restoration={useRestoreOrganization()}
  />
);
OrganizationActions.propTypes = actionDialogPropTypes;
const EntranceActions = ({ resource, id, action, onClose }) => (
  <EntityActionDialog
    resource={resource}
    id={id}
    action={action}
    onClose={onClose}
    deletion={useDeleteEntrance()}
    restoration={useRestoreEntrance()}
  />
);
EntranceActions.propTypes = actionDialogPropTypes;
const MassifActions = ({ resource, id, action, onClose }) => (
  <EntityActionDialog
    resource={resource}
    id={id}
    action={action}
    onClose={onClose}
    deletion={useDeleteMassif()}
    restoration={useRestoreMassif()}
  />
);
MassifActions.propTypes = actionDialogPropTypes;
const CaveActions = ({ resource, id, action, onClose }) => (
  <EntityActionDialog
    resource={resource}
    id={id}
    action={action}
    onClose={onClose}
    deletion={useDeleteCave()}
    restoration={useRestoreCave()}
  />
);
CaveActions.propTypes = actionDialogPropTypes;
const GuidelineActions = ({ resource, id, action, onClose }) => (
  <EntityActionDialog
    resource={resource}
    id={id}
    action={action}
    onClose={onClose}
    deletion={useDeleteGuideline()}
    restoration={useRestoreGuideline()}
  />
);
GuidelineActions.propTypes = actionDialogPropTypes;
const DocumentActions = ({ resource, id, action, onClose }) => (
  <EntityActionDialog
    resource={resource}
    id={id}
    action={action}
    onClose={onClose}
    deletion={useDeleteDocument()}
    restoration={useRestoreDocument()}
  />
);
DocumentActions.propTypes = actionDialogPropTypes;

const actionDialogs = {
  organizations: OrganizationActions,
  entrances: EntranceActions,
  massifs: MassifActions,
  caves: CaveActions,
  guidelines: GuidelineActions,
  documents: DocumentActions
};

export default actionDialogs;
