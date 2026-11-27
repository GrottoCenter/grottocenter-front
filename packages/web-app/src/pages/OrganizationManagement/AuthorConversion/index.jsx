import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';

import { apiGet } from '@/api/client';
import { organizationKeys, organizationManagementKeys } from '@/api/queryKeys';
import { getOrganizationUrl } from '@/conf/apiRoutes';
import { useOnlineStatus } from '@/hooks';
import { useNotification } from '@/hooks/useNotification';
import OrganizationActionButtons from '../OrganizationActionButtons';
import {
  getOrganizationBlockers,
  getOtherOrganizations,
  getSnapshotBlockers,
  sameId
} from './api';
import { Blockers, CleanupError, Progress, snapshotShape } from './Feedback';
import ConversionDialog from './ConversionDialog';
import { journalKey, readJournal } from './journal';
import { useCleanupSession } from './useCleanupSession';

const OrganizationRow = ({
  organization,
  onPreview,
  onConvert,
  isLocked,
  isOnline,
  snapshot = null
}) => {
  const { formatMessage } = useIntl();
  const detail = useQuery({
    queryKey: organizationKeys.detail(organization.id),
    queryFn: () => apiGet(`${getOrganizationUrl}${organization.id}`),
    retry: false,
    staleTime: 0
  });
  let blockers = [];
  let dataError = null;
  if (detail.data) {
    try {
      blockers = [
        ...getOrganizationBlockers(detail.data),
        ...(snapshot ? getSnapshotBlockers(snapshot, organization.id) : [])
      ];
    } catch (error) {
      dataError = error;
    }
  }
  const { data } = detail;
  const fields = [
    ['Authored documents', data?.authoredCount],
    ['Published documents', data?.publishedCount],
    [
      'Explored caves',
      data
        ? (data.exploredEntrances?.length ?? 0) +
          (data.exploredNetworks?.length ?? 0)
        : null
    ],
    ['members', data?.cavers?.length]
  ];
  return (
    <Box
      data-testid={`organization-row-${organization.id}`}
      sx={{ borderBottom: 1, borderColor: 'divider', py: 2 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: 'minmax(0, 2fr) minmax(0, 3fr) auto'
          },
          gap: 2,
          alignItems: 'center'
        }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <OrganizationActionButtons
            organization={organization}
            onPreview={onPreview}
            showOpenLink
          />
          <Typography sx={{ overflowWrap: 'anywhere' }}>
            {organization.name} (#{organization.id})
          </Typography>
        </Stack>
        <Box
          component="dl"
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 1,
            m: 0
          }}>
          {fields.map(([label, count]) => (
            <Box key={label}>
              <Typography component="dt" variant="body2">
                {formatMessage({ id: label })}
              </Typography>
              <Typography
                component="dd"
                sx={{ m: 0, fontVariantNumeric: 'tabular-nums' }}>
                {count ?? '—'}
              </Typography>
            </Box>
          ))}
        </Box>
        <Button
          variant="outlined"
          onClick={() => onConvert(organization)}
          disabled={
            detail.isPending ||
            !!detail.error ||
            !!dataError ||
            blockers.length > 0 ||
            isLocked ||
            !isOnline
          }
          data-testid={`convert-organization-${organization.id}`}>
          {formatMessage({ id: 'organizationConversion.transform' })}
        </Button>
      </Box>
      {detail.isPending && <CircularProgress size={20} />}
      <Blockers blockers={blockers} />
      <CleanupError error={detail.error ?? dataError} />
      {detail.isError && (
        <Button onClick={() => detail.refetch()} disabled={!isOnline}>
          {formatMessage({ id: 'Retry' })}
        </Button>
      )}
    </Box>
  );
};

OrganizationRow.propTypes = {
  organization: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  onConvert: PropTypes.func.isRequired,
  isLocked: PropTypes.bool.isRequired,
  isOnline: PropTypes.bool.isRequired,
  snapshot: snapshotShape
};

const AuthorConversion = ({
  isActive,
  deletedIds = new Set(),
  onPreview,
  onDeleted
}) => {
  const { formatMessage, formatNumber, formatDate } = useIntl();
  const { onSuccess } = useNotification();
  const isOnline = useOnlineStatus();
  const accountId =
    useSelector(state => state.login.authTokenDecoded?.id) ?? 'moderator';
  const session = useCleanupSession(accountId, { enabled: isActive });
  const snapshot = session.isReady ? session.data : null;
  const [selected, setSelected] = useState(null);
  const [journal, setJournal] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [convertedIds, setConvertedIds] = useState(() => new Set());
  useEffect(() => {
    const load = event => {
      if (event && event.key !== journalKey(accountId)) return;
      try {
        setJournal(readJournal(accountId));
        setStorageError(null);
      } catch (error) {
        setStorageError(error);
      }
    };
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, [accountId]);
  const list = useInfiniteQuery({
    queryKey: organizationManagementKeys.other,
    queryFn: getOtherOrganizations,
    initialPageParam: 1,
    getNextPageParam: (last, pages) =>
      pages.reduce((sum, page) => sum + page.results.length, 0) <
      last.totalResults
        ? pages.length + 1
        : undefined,
    enabled: isActive,
    retry: false
  });
  const loadedOrganizations =
    list.data?.pages.flatMap(page => page.results) ?? [];
  const organizations = loadedOrganizations.filter(
    organization =>
      organization.type === 'OTHER' &&
      !convertedIds.has(String(organization.id)) &&
      !deletedIds.has(String(organization.id))
  );
  const hiddenCount = new Set(
    loadedOrganizations
      .filter(
        organization =>
          organization.type === 'OTHER' &&
          (convertedIds.has(String(organization.id)) ||
            deletedIds.has(String(organization.id)))
      )
      .map(organization => String(organization.id))
  ).size;
  const serverTotal = list.data?.pages[0]?.totalResults;
  // Keep the total current while search still returns a just-archived org.
  // Once a refreshed page omits it, the server's lower total stands on its own.
  const total =
    serverTotal == null ? null : Math.max(0, serverTotal - hiddenCount);
  const activeJournal = journal?.stage !== 'complete' ? journal : null;
  const handleDeleted = id => {
    setConvertedIds(previous => new Set(previous).add(String(id)));
    setSelected(null);
    onDeleted(id);
    onSuccess(formatMessage({ id: 'organizationConversion.success' }));
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h2">
        {formatMessage({ id: 'organizationConversion.heading' })}
        {total != null && (
          <Box
            component="span"
            data-testid="other-organizations-total"
            aria-live="polite">
            {' '}
            ({formatNumber(total)})
          </Box>
        )}
      </Typography>
      <Typography>
        {formatMessage({ id: 'organizationConversion.intro' })}
      </Typography>
      <Stack spacing={1} data-testid="conversion-global-check">
        {session.data && (
          <Alert severity="info">
            {formatMessage(
              { id: 'organizationConversion.sessionNotice' },
              {
                date: formatDate(session.data.analyzedAt, {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              }
            )}
          </Alert>
        )}
        {session.isFetching && (
          <>
            <Typography>
              {formatMessage({ id: 'organizationConversion.sessionChecking' })}
            </Typography>
            <Progress progress={session.progress} />
          </>
        )}
        <CleanupError error={session.error} />
        <Button
          variant="outlined"
          onClick={() => session.refresh()}
          disabled={!isOnline || session.isFetching}
          data-testid="conversion-refresh-global-check">
          {formatMessage({ id: 'organizationConversion.refresh' })}
        </Button>
      </Stack>
      <CleanupError error={storageError} />
      {activeJournal && (
        <Alert
          severity="info"
          action={
            <Button
              onClick={() => setSelected(activeJournal.organization)}
              disabled={!isOnline || !session.isReady}>
              {formatMessage({ id: 'organizationConversion.resume' })}
            </Button>
          }>
          {activeJournal.organization.name} ·{' '}
          {formatMessage({ id: 'organizationConversion.partial' })}
        </Alert>
      )}
      {list.isPending && isActive && <CircularProgress />}
      <CleanupError error={list.error} />
      {list.isError && (
        <Button onClick={() => list.refetch()} disabled={!isOnline}>
          {formatMessage({ id: 'Retry' })}
        </Button>
      )}
      {list.isSuccess && total === 0 && (
        <Typography>
          {formatMessage({ id: 'organizationConversion.empty' })}
        </Typography>
      )}
      {organizations.map(organization => (
        <OrganizationRow
          key={organization.id}
          organization={organization}
          onPreview={onPreview}
          onConvert={setSelected}
          isLocked={!!activeJournal || !!storageError || !session.isReady}
          isOnline={isOnline}
          snapshot={snapshot}
        />
      ))}
      {list.hasNextPage && (
        <Button
          variant="outlined"
          fullWidth
          loading={list.isFetchingNextPage}
          disabled={list.isFetching || !isOnline}
          onClick={() => list.fetchNextPage()}>
          {formatMessage({ id: 'Load more' })}
        </Button>
      )}
      {selected && !storageError && (
        <ConversionDialog
          key={selected.id}
          organization={selected}
          accountId={accountId}
          snapshot={snapshot}
          journal={
            activeJournal && sameId(activeJournal.organization.id, selected.id)
              ? activeJournal
              : null
          }
          onSaved={setJournal}
          onDeleted={handleDeleted}
          onClose={() => setSelected(null)}
        />
      )}
    </Stack>
  );
};

AuthorConversion.propTypes = {
  isActive: PropTypes.bool.isRequired,
  deletedIds: PropTypes.instanceOf(Set),
  onPreview: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired
};

export default AuthorConversion;
