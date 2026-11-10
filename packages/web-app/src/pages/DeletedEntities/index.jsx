import { Fragment, useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  IconButton,
  Stack,
  TablePagination,
  Tooltip,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RestoreIcon from '@mui/icons-material/RestoreFromTrash';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AppLink from '@/components/common/AppLink';
import CustomIcon from '@/components/common/CustomIcon';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import SearchInput from '@/components/common/SearchInput';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import PageTabs from '@/components/common/Layouts/PageTabs';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import {
  useDeletedEntities,
  useDeletedEntityCounts,
  useOnlineStatus,
  usePermissions
} from '@/hooks';
import {
  DELETED_ENTITY_RESOURCES,
  getDeletedEntityName
} from '@/utils/deletedEntities';
import actionDialogs from './EntityActionDialog';
import EntityIcon from './EntityIcon';
import EntityPreview from './EntityPreview';
import MergeDestination from './MergeDestination';

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
  const [preview, setPreview] = useState(null);
  const [search, setSearch] = useState('');
  const counts = useDeletedEntityCounts();
  const query = useDeletedEntities({
    entityType,
    skip: page * limit,
    limit
  });
  const entities = query.data?.entities ?? [];
  const searchTerm = search.trim().toLowerCase();
  const visibleEntities = entities.filter(
    entity =>
      getDeletedEntityName(entity).toLowerCase().includes(searchTerm) ||
      `#${entity.id}`.includes(searchTerm)
  );
  const isPastEnd =
    !!query.data &&
    !query.isPlaceholderData &&
    entities.length === 0 &&
    page > 0;
  // Empty pages carry no Content-Range, including out-of-range pages. Read
  // page zero to recover the total and jump directly to the last valid page.
  const firstPage = useDeletedEntities({
    entityType,
    skip: 0,
    limit,
    enabled: isPastEnd,
    staleTime: 0
  });
  // Keep the known first-page total while a page without placeholder loads,
  // including the target of last-page recovery, but not after it fails.
  const totalCount =
    isPastEnd || query.isPending
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
  const resources = Object.values(DELETED_ENTITY_RESOURCES);
  const tabs = resources.map((resource, index) => ({
    id: resource.resource,
    label: formatMessage({ id: resource.labelId }),
    count: counts[index]?.data?.totalCount,
    icon: <CustomIcon type={resource.entityType.iconType} size={20} alt="" />
  }));
  const content = (
    <ScrollableContent collapsible={false}>
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={formatMessage({ id: 'deletedEntities.searchCurrentPage' })}
        sx={{ mb: 1.5 }}
      />
      {totalCount != null && (
        <Typography
          aria-live="polite"
          data-testid="deleted-entities-count"
          sx={{ mb: 1.5 }}>
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
        !query.isPlaceholderData &&
        entities.length === 0 &&
        page === 0 && (
          <Alert severity="info">
            {formatMessage({ id: 'deletedEntities.empty' })}
          </Alert>
        )}
      {query.isSuccess &&
        !query.isFetching &&
        entities.length > 0 &&
        visibleEntities.length === 0 && (
          <Alert severity="info">{formatMessage({ id: 'No results' })}</Alert>
        )}
      <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {visibleEntities.map(entity => (
          <Card
            component="li"
            variant="outlined"
            key={entity.id}
            data-testid={`deleted-${config.kind}-${entity.id}`}
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'minmax(0, 1fr) auto',
                md: 'minmax(0, 1fr) auto auto'
              },
              gridTemplateAreas: {
                xs: '"content preview" "actions actions"',
                md: '"content preview actions"'
              },
              alignItems: 'center',
              rowGap: 1,
              columnGap: { xs: 1, md: 2 },
              p: 1.5,
              borderColor: 'primary.main',
              minWidth: 0
            }}>
            <Box
              sx={{
                gridArea: 'content',
                minWidth: 0,
                overflowWrap: 'anywhere'
              }}>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', minHeight: 40 }}>
                <Box sx={{ display: 'flex', flexShrink: 0 }}>
                  <EntityIcon resource={entityType} entity={entity} />
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'baseline',
                    columnGap: 1,
                    flex: 1,
                    minWidth: 0
                  }}>
                  <Typography
                    component="span"
                    sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    <AppLink
                      to={`${config.entityType.url}${entity.id}`}
                      data-testid={`open-${config.kind}-${entity.id}`}>
                      {getDeletedEntityName(entity)}
                    </AppLink>
                  </Typography>
                  {(entity.title || entity.name) && (
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{ color: 'grey.600', whiteSpace: 'nowrap' }}>
                      #{entity.id}
                    </Typography>
                  )}
                </Box>
              </Stack>
              {entity.redirectTo != null && (
                <MergeDestination
                  resource={entityType}
                  id={entity.redirectTo}
                />
              )}
            </Box>
            <Tooltip title={formatMessage({ id: 'Preview' })}>
              <Box
                component="span"
                sx={{
                  gridArea: 'preview',
                  alignSelf: { xs: 'start', md: 'center' }
                }}>
                <IconButton
                  aria-label={formatMessage({ id: 'Preview' })}
                  color="primary"
                  disabled={!!activeSelection || query.isPlaceholderData}
                  onClick={() => setPreview({ resource: entityType, entity })}>
                  <VisibilityIcon />
                </IconButton>
              </Box>
            </Tooltip>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                gridArea: 'actions',
                alignItems: 'center',
                justifyContent: 'flex-end',
                flexShrink: 0,
                '& > .MuiButton-root': { flex: { xs: 1, md: '0 0 auto' } },
                '& .MuiButton-startIcon': {
                  ml: { xs: 0, md: -0.25 },
                  mr: { xs: 0, md: 1 }
                }
              }}>
              <Button
                startIcon={<RestoreIcon />}
                aria-label={formatMessage({ id: 'Restore' })}
                color="secondary"
                variant="outlined"
                size="small"
                disabled={
                  !isOnline || !!activeSelection || query.isPlaceholderData
                }
                onClick={() =>
                  setSelected({
                    resource: entityType,
                    id: entity.id,
                    action: 'restore'
                  })
                }>
                <Box
                  component="span"
                  sx={{ display: { xs: 'none', md: 'inline' } }}>
                  {formatMessage({ id: 'Restore' })}
                </Box>
              </Button>
              {permissions.canPermanentlyDeleteEntities && (
                <Button
                  data-testid={`permanently-delete-${config.kind}-${entity.id}`}
                  aria-label={formatMessage({ id: 'Permanently delete' })}
                  color="error"
                  variant="contained"
                  size="small"
                  startIcon={<DeleteForeverIcon />}
                  disabled={
                    !isOnline || !!activeSelection || query.isPlaceholderData
                  }
                  onClick={() =>
                    setSelected({
                      resource: entityType,
                      id: entity.id,
                      action: 'delete'
                    })
                  }>
                  <Box
                    component="span"
                    sx={{ display: { xs: 'none', md: 'inline' } }}>
                    {formatMessage({ id: 'Permanently delete' })}
                  </Box>
                </Button>
              )}
            </Stack>
          </Card>
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
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        getItemAriaLabel={type =>
          formatMessage({
            id: type === 'next' ? 'Next page' : 'Previous page'
          })
        }
        disabled={!isOnline || query.isFetching || isPastEnd}
        onPageChange={(_, nextPage) => changePage(nextPage)}
        onRowsPerPageChange={event => changePage(0, Number(event.target.value))}
        sx={{ '& .MuiTablePagination-toolbar': { flexWrap: 'wrap', px: 0 } }}
      />
    </ScrollableContent>
  );
  return (
    <PageContainer>
      <PageHeader
        title={formatMessage({ id: 'deletedEntities.heading' })}
        icon={<DeleteIcon />}
      />
      <PageTabs
        tabs={tabs}
        searchParam="type"
        onChange={nextType => {
          setSelected(null);
          setPreview(null);
          setSearch('');
          setSearchParams(
            previous => {
              previous.set('type', nextType);
              previous.set('page', '1');
              previous.set('limit', String(limit));
              return previous;
            },
            { replace: true }
          );
        }}>
        {resources.map(resource => (
          <Fragment key={resource.resource}>
            {resource.resource === entityType && content}
          </Fragment>
        ))}
      </PageTabs>
      {activeSelection && (
        <ActionDialog
          key={`${entityType}:${activeSelection.id}:${activeSelection.action}`}
          resource={entityType}
          id={activeSelection.id}
          action={activeSelection.action}
          onClose={() => setSelected(null)}
        />
      )}
      {preview?.resource === entityType && (
        <EntityPreview
          key={`${entityType}:${preview.entity.id}`}
          resource={entityType}
          entity={preview.entity}
          onClose={() => setPreview(null)}
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
