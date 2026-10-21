import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import FormSubmissionError from '@/components/common/FormSubmissionError';
import {
  DeleteConfirmationDialog,
  DELETED_ENTITIES
} from '@/components/common/card/Deleted';
import {
  useDeleteOrganization,
  useOnlineStatus,
  useOrganization,
  usePermissions
} from '@/hooks';
import { useDeletedOrganizations } from '@/hooks/queries/useDeletedOrganizations';
import { useNotification } from '@/hooks/useNotification';
import { getOrganizationIconType } from '@/utils/organizationIcons';
import OrganizationActionButtons from './OrganizationActionButtons';

const DeletedOrganizationsSection = ({ enabled, onPreview }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const { isAdmin } = usePermissions();
  const { onSuccess } = useNotification();
  const mutation = useDeleteOrganization();
  const [selected, setSelected] = useState(null);
  // The list omits redirectTo. Load fresh details before opening the shared
  // dialog so it can preselect the existing destination, as on the detail page.
  const sourceQuery = useOrganization(selected?.id, { staleTime: 0 });
  const source = sourceQuery.data;
  const isPreparing =
    !!selected && (sourceQuery.isPending || sourceQuery.isFetching);
  const isSourceValid =
    source?.isDeleted === true && String(source.id) === String(selected?.id);
  const isConfirmationOpen =
    !!selected && !isPreparing && !sourceQuery.error && isSourceValid;
  const {
    data,
    isPending,
    isFetching,
    error,
    isFetchNextPageError,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useDeletedOrganizations({ enabled });
  const organizations = data?.organizations ?? [];

  const handleConfirm = entity => {
    if (!isOnline || !isAdmin || !isSourceValid || mutation.isPending) return;
    mutation.mutate(
      { id: source.id, entityId: entity?.id, isPermanent: true },
      {
        onSuccess: () =>
          onSuccess(formatMessage({ id: 'deletedOrganizations.success' }))
      }
    );
  };

  return (
    <Box
      role="region"
      aria-label={formatMessage({ id: 'deletedOrganizations.heading' })}
      data-testid="deleted-organizations-section">
      <Typography variant="h2" sx={{ mb: 1 }}>
        {formatMessage({ id: 'deletedOrganizations.heading' })}
      </Typography>
      {data && (
        <Typography
          aria-live="polite"
          data-testid="deleted-organizations-count"
          sx={{ mb: 2 }}>
          {formatMessage(
            { id: 'deletedOrganizations.count' },
            { count: data.totalCount }
          )}
        </Typography>
      )}
      {isPending && enabled && !error && <CircularProgress />}
      {isPreparing && <CircularProgress size={24} />}
      {selected && sourceQuery.error && (
        <Box>
          <FormSubmissionError error={sourceQuery.error} />
          <Button disabled={!isOnline} onClick={() => sourceQuery.refetch()}>
            {formatMessage({ id: 'Retry' })}
          </Button>
        </Box>
      )}
      {selected && !isPreparing && !sourceQuery.error && !isSourceValid && (
        <Alert severity="error">
          {formatMessage({ id: 'deletedOrganizations.changed' })}
        </Alert>
      )}
      {mutation.error && <FormSubmissionError error={mutation.error} />}
      {error && (
        <Box>
          <FormSubmissionError error={error} />
          <Button
            disabled={!isOnline || isFetching}
            onClick={() =>
              isFetchNextPageError ? fetchNextPage() : refetch()
            }>
            {formatMessage({ id: 'Retry' })}
          </Button>
        </Box>
      )}
      {data && organizations.length === 0 && (
        <Alert severity="info">
          {formatMessage({ id: 'deletedOrganizations.empty' })}
        </Alert>
      )}
      <Stack component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {organizations.map(organization => (
          <Box
            component="li"
            key={organization.id}
            data-testid={`deleted-organization-${organization.id}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr) auto',
                md: 'auto minmax(0, 1fr) auto'
              },
              alignItems: 'center',
              gap: 1,
              py: 1,
              borderBottom: 1,
              borderColor: 'divider'
            }}>
            <OrganizationActionButtons
              organization={organization}
              onPreview={onPreview}
              showIdInLabel
              showOpenLink
              showEditLink={false}
            />
            <Typography
              sx={{
                gridColumn: { xs: 1, md: 2 },
                gridRow: 1,
                overflowWrap: 'anywhere',
                minWidth: 0
              }}>
              {organization.name}{' '}
              <Box component="span" sx={{ color: 'text.secondary' }}>
                #{organization.id}
              </Box>
            </Typography>
            {isAdmin && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteForeverIcon />}
                disabled={!isOnline || isPreparing || mutation.isPending}
                data-testid={`permanent-delete-organization-${organization.id}`}
                sx={{
                  gridColumn: { xs: '1 / -1', md: 3 },
                  gridRow: { xs: 2, md: 1 },
                  minWidth: 0
                }}
                onClick={() => {
                  mutation.reset();
                  setSelected(organization);
                }}>
                {formatMessage({ id: 'Permanently delete' })}
              </Button>
            )}
          </Box>
        ))}
      </Stack>
      {hasNextPage && (
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          disabled={!isOnline || isFetching}
          onClick={() => fetchNextPage()}>
          {formatMessage({ id: 'Load more' })}
        </Button>
      )}
      {isFetching && !isPending && (
        <CircularProgress size={24} sx={{ mt: 2 }} />
      )}
      {isConfirmationOpen && (
        <DeleteConfirmationDialog
          entityType={DELETED_ENTITIES.organization}
          entityId={source.id}
          entityName={source.name}
          entityIconType={getOrganizationIconType(source.type)}
          existingRedirectId={source.redirectTo}
          isOpen
          isLoading={mutation.isPending || !isOnline}
          isPermanent
          onClose={() => setSelected(null)}
          onConfirmation={handleConfirm}
        />
      )}
    </Box>
  );
};

DeletedOrganizationsSection.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onPreview: PropTypes.func.isRequired
};

export default DeletedOrganizationsSection;
