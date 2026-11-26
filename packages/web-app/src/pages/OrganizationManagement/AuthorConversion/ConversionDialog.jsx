import { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography
} from '@mui/material';

import { organizationManagementKeys } from '@/api/queryKeys';
import { useOnlineStatus } from '@/hooks';
import StandardDialog from '@/components/common/StandardDialog';
import DocumentAuthorLabel from '@/components/common/DocumentAuthorLabel';
import { auditOrganization } from './api';
import { Blockers, CleanupError, Progress, snapshotShape } from './Feedback';
import AuthorChoice from './AuthorChoice';
import { useAuthorConversion } from './useAuthorConversion';

const ConversionDialog = ({
  organization,
  accountId,
  snapshot = null,
  journal = null,
  onSaved,
  onDeleted,
  onClose
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [target, setTarget] = useState(journal?.target ?? null);
  const [hasCreatedAuthor, setCreatedAuthor] = useState(false);
  const [isCreating, setCreating] = useState(false);
  const [hasConfirmed, setConfirmed] = useState(false);
  const [auditProgress, setAuditProgress] = useState(null);
  const { mutation, progress, blockers } = useAuthorConversion({
    accountId,
    onSaved,
    onDeleted
  });
  const audit = useQuery({
    queryKey: organizationManagementKeys.conversionAudit(
      organization.id,
      accountId,
      snapshot?.analyzedAt
    ),
    queryFn: ({ signal }) =>
      auditOrganization(organization.id, {
        snapshot,
        signal,
        onProgress: setAuditProgress
      }),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    meta: { errorPresentation: 'inline' },
    enabled: !!snapshot && !mutation.isPending && !mutation.isSuccess
  });
  const isBusy = mutation.isPending || isCreating;
  const canRecoverDeletion =
    journal?.stage === 'archiving' && audit.data?.organization.isDeleted;
  const allBlockers = blockers.length ? blockers : (audit.data?.blockers ?? []);
  const canChoose =
    !!snapshot && audit.isSuccess && !audit.isFetching && !allBlockers.length;
  const canConvert =
    !!snapshot &&
    (canChoose || canRecoverDeletion) &&
    target &&
    hasConfirmed &&
    isOnline;

  return (
    <StandardDialog
      open
      fullScreenOnMobile
      title={formatMessage({ id: 'organizationConversion.transform' })}
      slotProps={{ paper: { 'data-testid': 'conversion-dialog' } }}
      isBusy={isBusy}
      onClose={onClose}
      actions={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isBusy}>
            {formatMessage({ id: 'close' })}
          </Button>
          <Button
            variant="contained"
            loading={mutation.isPending}
            disabled={isBusy || !canConvert}
            onClick={() =>
              mutation.mutate({ organizationId: organization.id, target })
            }
            data-testid="conversion-confirm">
            {formatMessage({
              id: journal
                ? 'organizationConversion.resume'
                : 'organizationConversion.confirm'
            })}
          </Button>
        </>
      }>
      <Stack spacing={2}>
        <Typography
          variant="h5"
          component="p"
          sx={{ overflowWrap: 'anywhere' }}>
          {organization.name} (#{organization.id})
        </Typography>
        {audit.data && (
          <Typography variant="body2">
            {formatMessage(
              { id: 'organizationConversion.authorCount' },
              { count: audit.data.organization.authoredCount }
            )}
          </Typography>
        )}
        {!isOnline && (
          <Alert severity="warning">
            {formatMessage({ id: 'organizationConversion.offline' })}
          </Alert>
        )}
        {!snapshot && (
          <Alert severity="info">
            {formatMessage({ id: 'organizationConversion.sessionUnavailable' })}
          </Alert>
        )}
        {audit.isFetching && <Progress progress={auditProgress} />}
        <CleanupError error={audit.error} />
        {audit.isError && (
          <Button onClick={() => audit.refetch()} disabled={!isOnline}>
            {formatMessage({ id: 'Retry' })}
          </Button>
        )}
        {!canRecoverDeletion && <Blockers blockers={allBlockers} />}
        {mutation.isError && !blockers.length && (
          <CleanupError error={mutation.error} />
        )}
        {journal && (
          <Alert severity="info">
            {formatMessage({ id: 'organizationConversion.partial' })}{' '}
            {journal.documents.filter(entry => entry.done).length} /{' '}
            {journal.documents.length}
          </Alert>
        )}
        {canChoose && !journal && !hasCreatedAuthor && (
          <fieldset
            disabled={isBusy}
            style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <AuthorChoice
              name={organization.name}
              selected={target}
              onSelect={setTarget}
              onCreated={person => {
                setTarget(person);
                setCreatedAuthor(true);
              }}
              onBusyChange={setCreating}
            />
          </fieldset>
        )}
        {target && (
          <Stack
            spacing={0.5}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-testid="conversion-selected-author"
            sx={{
              p: 2,
              border: 1,
              borderColor: 'primary.main',
              bgcolor: 'action.selected',
              borderRadius: 1,
              overflowWrap: 'anywhere'
            }}>
            <Typography variant="body2" color="text.secondary">
              {formatMessage({ id: 'organizationConversion.selectedAuthor' })}
            </Typography>
            <Typography variant="h5" component="p">
              <DocumentAuthorLabel author={target} />
            </Typography>
            <Typography variant="body2">
              #{target.id}
              {target.authoredCount != null && (
                <>
                  {' · '}
                  {formatMessage(
                    { id: 'organizationConversion.authorCount' },
                    { count: target.authoredCount }
                  )}
                </>
              )}
            </Typography>
          </Stack>
        )}
        {(canChoose || canRecoverDeletion) && (
          <FormControlLabel
            control={
              <Checkbox
                checked={hasConfirmed}
                onChange={event => setConfirmed(event.target.checked)}
                disabled={isBusy}
              />
            }
            label={formatMessage({ id: 'organizationConversion.effects' })}
            sx={{ alignItems: 'flex-start' }}
          />
        )}
        {mutation.isPending && <Progress progress={progress} />}
      </Stack>
    </StandardDialog>
  );
};

ConversionDialog.propTypes = {
  organization: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  accountId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  snapshot: snapshotShape,
  journal: PropTypes.shape({
    stage: PropTypes.string.isRequired,
    target: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
    }).isRequired,
    documents: PropTypes.arrayOf(
      PropTypes.shape({ done: PropTypes.bool.isRequired })
    ).isRequired
  }),
  onSaved: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default ConversionDialog;
