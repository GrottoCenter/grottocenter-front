import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TablePagination,
  TextField,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreIcon from '@mui/icons-material/RestoreFromTrash';
import AppLink from '@/components/common/AppLink';
import CustomIcon from '@/components/common/CustomIcon';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import { useDeletedEntities, useOnlineStatus, usePermissions } from '@/hooks';
import {
  DELETED_ENTITY_RESOURCES,
  getDeletedEntityName
} from '@/utils/deletedEntities';
import actionDialogs from './EntityActionDialog';
import EntitySummary from './EntitySummary';

const DeletedEntitiesContent = () => {
  const { formatMessage } = useIntl();
  const [searchParams, setSearchParams] = useSearchParams();
  const permissions = usePermissions();
  const isOnline = useOnlineStatus();
  const requestedType = searchParams.get('type');
  const entityType = Object.hasOwn(DELETED_ENTITY_RESOURCES, requestedType)
    ? requestedType
    : 'organizations';
  const config = DELETED_ENTITY_RESOURCES[entityType];
  const requestedPage = Number(searchParams.get('page') ?? 1);
  const page =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage - 1
      : 0;
  const requestedLimit = Number(searchParams.get('limit'));
  const limit = [20, 50, 100].includes(requestedLimit) ? requestedLimit : 50;
  const [selected, setSelected] = useState(null);
  const query = useDeletedEntities({ entityType, skip: page * limit, limit });
  const entities = query.data?.entities ?? [];
  const isPastEnd = !!query.data && entities.length === 0 && page > 0;
  // Empty pages carry no Content-Range, including out-of-range pages. Read
  // page zero to recover the total and jump directly to the last valid page.
  const firstPage = useDeletedEntities({
    entityType,
    skip: 0,
    limit,
    enabled: isPastEnd,
    staleTime: 0
  });
  const totalCount = isPastEnd
    ? firstPage.data?.totalCount
    : query.data?.totalCount;
  const changePage = (nextPage, nextLimit = limit) =>
    setSearchParams(
      previous => {
        previous.set('page', String(nextPage + 1));
        previous.set('limit', String(nextLimit));
        return previous;
      },
      { replace: true }
    );

  useEffect(() => {
    if (isPastEnd && firstPage.isSuccess && !firstPage.isFetching) {
      setSearchParams(
        previous => {
          previous.set(
            'page',
            String(Math.max(1, Math.ceil(firstPage.data.totalCount / limit)))
          );
          return previous;
        },
        { replace: true }
      );
    }
  }, [
    isPastEnd,
    firstPage.isSuccess,
    firstPage.isFetching,
    firstPage.data,
    limit,
    setSearchParams
  ]);

  const error = query.error || (isPastEnd && firstPage.error);
  const ActionDialog = actionDialogs[entityType];
  const activeSelection = selected?.resource === entityType ? selected : null;
  return (
    <PageContainer>
      <PageHeader
        title={formatMessage({ id: 'deletedEntities.heading' })}
        icon={<DeleteIcon />}
      />
      <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
        <TextField
          select
          fullWidth
          label={formatMessage({ id: 'Type' })}
          value={entityType}
          onChange={event => {
            setSelected(null);
            setSearchParams({
              type: event.target.value,
              page: '1',
              limit: String(limit)
            });
          }}>
          {Object.values(DELETED_ENTITY_RESOURCES).map(resource => (
            <MenuItem key={resource.resource} value={resource.resource}>
              {formatMessage({ id: resource.labelId })}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="h2" sx={{ mt: 2 }}>
          {formatMessage({ id: config.labelId })}
        </Typography>
        {totalCount != null && (
          <Typography aria-live="polite" data-testid="deleted-entities-count">
            {formatMessage(
              { id: 'deletedEntities.count' },
              { count: totalCount }
            )}
          </Typography>
        )}
        {(query.isFetching || (isPastEnd && firstPage.isFetching)) && (
          <CircularProgress size={24} sx={{ my: 2 }} />
        )}
        {error && (
          <Box>
            <FormSubmissionError error={error} />
            <Button
              disabled={!isOnline || query.isFetching || firstPage.isFetching}
              onClick={() => {
                query.refetch();
                if (isPastEnd) firstPage.refetch();
              }}>
              {formatMessage({ id: 'Retry' })}
            </Button>
          </Box>
        )}
        {query.isSuccess &&
          !query.isFetching &&
          entities.length === 0 &&
          page === 0 && (
            <Alert severity="info">
              {formatMessage({ id: 'deletedEntities.empty' })}
            </Alert>
          )}
        <Stack component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {entities.map(entity => (
            <Box
              component="li"
              key={entity.id}
              data-testid={`deleted-${config.kind}-${entity.id}`}
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 1.5,
                py: 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                minWidth: 0
              }}>
              <Box sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ alignItems: 'center' }}>
                  <CustomIcon type={config.entityType.iconType} size={24} />
                  <Typography component="span" sx={{ minWidth: 0 }}>
                    <AppLink
                      to={`${config.entityType.url}${entity.id}`}
                      data-testid={`open-${config.kind}-${entity.id}`}>
                      {getDeletedEntityName(entity)}
                      {(entity.title || entity.name) && ` (#${entity.id})`}
                    </AppLink>
                  </Typography>
                  <Chip size="small" label={formatMessage({ id: 'Deleted' })} />
                </Stack>
                <EntitySummary resource={entityType} entity={entity} />
                {entity.redirectTo != null && (
                  <AppLink to={`${config.entityType.url}${entity.redirectTo}`}>
                    {formatMessage(
                      { id: 'deletedEntities.redirect' },
                      { id: entity.redirectTo }
                    )}
                  </AppLink>
                )}
              </Box>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button
                  startIcon={<RestoreIcon />}
                  variant="outlined"
                  disabled={!isOnline || !!activeSelection}
                  onClick={() =>
                    setSelected({
                      resource: entityType,
                      id: entity.id,
                      action: 'restore'
                    })
                  }>
                  {formatMessage({ id: 'Restore' })}
                </Button>
                {permissions.canPermanentlyDeleteEntities && (
                  <Button
                    startIcon={<DeleteForeverIcon />}
                    color="error"
                    variant="contained"
                    disabled={!isOnline || !!activeSelection}
                    onClick={() =>
                      setSelected({
                        resource: entityType,
                        id: entity.id,
                        action: 'delete'
                      })
                    }>
                    {formatMessage({ id: 'Permanently delete' })}
                  </Button>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
        <TablePagination
          component="div"
          count={totalCount ?? 0}
          page={Math.min(
            page,
            Math.max(0, Math.ceil((totalCount ?? 0) / limit) - 1)
          )}
          rowsPerPage={limit}
          rowsPerPageOptions={[20, 50, 100]}
          labelRowsPerPage={formatMessage({ id: 'Results per page:' })}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} / ${count}`
          }
          getItemAriaLabel={type =>
            formatMessage({
              id: type === 'next' ? 'Next page' : 'Previous page'
            })
          }
          disabled={!isOnline || query.isFetching || isPastEnd}
          onPageChange={(_, nextPage) => changePage(nextPage)}
          onRowsPerPageChange={event =>
            changePage(0, Number(event.target.value))
          }
          sx={{ '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', px: 0 } }}
        />
      </Card>
      {activeSelection && (
        <ActionDialog
          key={`${entityType}:${activeSelection.id}:${activeSelection.action}`}
          resource={entityType}
          id={activeSelection.id}
          action={activeSelection.action}
          onClose={() => setSelected(null)}
        />
      )}
    </PageContainer>
  );
};

const DeletedEntities = () => {
  const { canManageDeletedEntities } = usePermissions();
  return canManageDeletedEntities ? (
    <DeletedEntitiesContent />
  ) : (
    <Navigate to="/" replace />
  );
};

export default DeletedEntities;
