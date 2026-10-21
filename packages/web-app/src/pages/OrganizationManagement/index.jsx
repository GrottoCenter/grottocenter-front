import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import BusinessIcon from '@mui/icons-material/Business';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { apiGet, apiPost } from '@/api/client';
import { organizationManagementKeys } from '@/api/queryKeys';
import { advancedSearchUrl, getOrganizationUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import Organization from '@/components/appli/Organization';
import StandardDialog from '@/components/common/StandardDialog';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import CustomIcon from '@/components/common/CustomIcon';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import PageTabs from '@/components/common/Layouts/PageTabs';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import {
  useOnlineStatus,
  useOrganization,
  usePermissions,
  useUpdateOrganization
} from '@/hooks';
import {
  getOrganizationTypeLabelId,
  ORGANIZATION_TYPE_VALUES
} from '@/utils/organizationTypes';
import { useNotification } from '@/hooks/useNotification';
import DuplicatesSection from './DuplicatesSection';
import OrganizationActionButtons from './OrganizationActionButtons';
import DeletedOrganizationsSection from './DeletedOrganizationsSection';

const PAGE_SIZE = 100;
const CLASSIFICATION_BATCH_SIZE = 50;

const getOrganizationsPage = ({ pageParam, signal }) =>
  apiPost(
    advancedSearchUrl,
    {
      entity: 'organizations',
      query: '',
      filter: {},
      matchAllFields: true,
      page: pageParam,
      size: PAGE_SIZE
    },
    { signal }
  );

const getNextPage = (lastPage, pages) => {
  const loaded = pages.reduce((count, page) => count + page.results.length, 0);
  return lastPage.results.length && loaded < lastPage.totalResults
    ? pages.length + 1
    : undefined;
};

// PUT replaces other organization fields even when the request only changes
// the type, so preserve every field that the controller reads from the body.
export const makeTypeUpdate = (organization, type) => ({
  id: organization.id,
  type,
  address: organization.address,
  city: organization.city,
  country: organization.country ? { id: organization.country } : null,
  county: organization.county,
  customMessage: organization.customMessage,
  latitude: organization.latitude,
  longitude: organization.longitude,
  mail: organization.mail,
  postalCode: organization.postalCode,
  region: organization.region,
  url: organization.url,
  yearBirth: organization.yearBirth
});

const OrganizationPreview = ({ id, onClose }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data, error, isFetching, isPaused } = useOrganization(id);

  return (
    <StandardDialog
      open
      onClose={onClose}
      title={formatMessage({ id: 'Organization' })}
      fullWidth
      fullScreen={isMobile}
      maxWidth="xl"
      scrollable>
      <Organization
        key={id}
        organization={data}
        error={error}
        isLoading={isFetching}
        isPaused={isPaused}
        isPreview
      />
    </StandardDialog>
  );
};

OrganizationPreview.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onClose: PropTypes.func.isRequired
};

const OrganizationRow = ({
  organization,
  onPreview,
  onSave,
  isSaving,
  isOnline,
  error
}) => {
  const { formatMessage } = useIntl();
  const [type, setType] = useState('');

  return (
    <Box
      data-testid={`organization-row-${organization.id}`}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'auto minmax(0, 1fr)',
          md: 'auto minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr)'
        },
        gap: 1,
        alignItems: 'center',
        borderBottom: 1,
        borderColor: 'divider',
        py: 1
      }}>
      <OrganizationActionButtons
        organization={organization}
        onPreview={onPreview}
      />
      <Typography sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        {organization.name}
      </Typography>
      <Box sx={{ gridColumn: { xs: '2', md: 'auto' }, minWidth: 0 }}>
        <Typography variant="body2">
          {[organization.city, organization.country]
            .filter(Boolean)
            .join(' · ') || '—'}
          {organization.nbCavers != null &&
            ` · ${formatMessage({ id: 'members' })}: ${organization.nbCavers}`}
        </Typography>
        {(organization.mail || organization.url) && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: 'anywhere' }}>
            {[organization.mail, organization.url].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{ gridColumn: { xs: '2', md: 'auto' } }}>
        <TextField
          select
          size="small"
          label={formatMessage({ id: 'organizationType.label' })}
          value={type}
          onChange={event => setType(event.target.value)}
          sx={{ minWidth: 140, flexGrow: 1 }}>
          <MenuItem value="">
            {formatMessage({ id: 'organizationType.unspecified' })}
          </MenuItem>
          {ORGANIZATION_TYPE_VALUES.map(value => (
            <MenuItem key={value} value={value}>
              <Box
                component="span"
                sx={{ display: 'inline-flex', alignItems: 'center' }}>
                <OrganizationIcon organizationType={value} size={24} />
                {formatMessage({ id: getOrganizationTypeLabelId(value) })}
              </Box>
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          variant="contained"
          startIcon={isSaving ? <CircularProgress size={18} /> : <SaveIcon />}
          disabled={!type || isSaving || !isOnline}
          onClick={() => onSave(organization.id, type)}>
          {formatMessage({ id: 'Save' })}
        </Button>
      </Stack>
      {error && (
        <Box sx={{ gridColumn: '1 / -1' }}>
          <FormSubmissionError error={error} />
        </Box>
      )}
    </Box>
  );
};

OrganizationRow.propTypes = {
  organization: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    city: PropTypes.string,
    country: PropTypes.string,
    nbCavers: PropTypes.number,
    mail: PropTypes.string,
    url: PropTypes.string
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  isSaving: PropTypes.bool.isRequired,
  isOnline: PropTypes.bool.isRequired,
  error: PropTypes.shape({})
};

const OrganizationManagement = () => {
  const { formatMessage } = useIntl();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');
  const isClassifyTab = !['duplicates', 'deleted'].includes(activeTab);
  const tabs = useMemo(
    () => [
      {
        id: 'classify',
        label: formatMessage({ id: 'Organizations to classify' }),
        icon: <CustomIcon type="organization" size={20} />
      },
      {
        id: 'duplicates',
        label: formatMessage({ id: 'duplicates.heading' }),
        icon: <CallMergeIcon />
      },
      {
        id: 'deleted',
        label: formatMessage({ id: 'deletedOrganizations.heading' }),
        icon: <DeleteIcon />
      }
    ],
    [formatMessage]
  );
  const navigate = useNavigate();
  const { isAuth, isModerator } = usePermissions();
  const isOnline = useOnlineStatus();
  const { onSuccess } = useNotification();
  const queryClient = useQueryClient();
  const update = useUpdateOrganization();
  const [previewId, setPreviewId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [visibleLimit, setVisibleLimit] = useState(CLASSIFICATION_BATCH_SIZE);
  const [scanStarted, setScanStarted] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [scanProgress, setScanProgress] = useState({ loaded: 0, total: 0 });
  const scanRun = useRef(0);
  const canAccess = isAuth && isModerator;
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    hasNextPage,
    fetchNextPage,
    refetch
  } = useInfiniteQuery({
    queryKey: organizationManagementKeys.unclassified,
    queryFn: getOrganizationsPage,
    initialPageParam: 1,
    getNextPageParam: getNextPage,
    enabled: canAccess && isClassifyTab,
    staleTime: STALE.VOLATILE,
    gcTime: 60 * 1000
  });
  const scan = useQuery({
    queryKey: organizationManagementKeys.duplicates,
    enabled: false,
    retry: false,
    gcTime: 60 * 1000,
    queryFn: async ({ signal }) => {
      const cachedPages =
        queryClient.getQueryData(organizationManagementKeys.unclassified)
          ?.pages ?? [];
      const allOrganizations = cachedPages.flatMap(page => page.results);
      let scanned = allOrganizations.length;
      let total = cachedPages[0]?.totalResults ?? 0;
      let pageNumber = cachedPages.length + 1;
      setScanProgress({ loaded: scanned, total });
      while (pageNumber === 1 || scanned < total) {
        signal.throwIfAborted();
        // Requests are sequential so cancellation stops before the next page.
        // eslint-disable-next-line no-await-in-loop
        const page = await getOrganizationsPage({
          pageParam: pageNumber,
          signal
        });
        signal.throwIfAborted();
        total = page.totalResults;
        if (!page.results.length && scanned < total) {
          throw new Error(formatMessage({ id: 'duplicates.incompleteScan' }));
        }
        allOrganizations.push(...page.results);
        scanned += page.results.length;
        setScanProgress({ loaded: scanned, total });
        pageNumber += 1;
      }
      return allOrganizations;
    }
  });

  useEffect(() => {
    if (!canAccess) navigate('/ui/dashboard', { replace: true });
  }, [canAccess, navigate]);

  const pages = data?.pages ?? [];
  const loaded = pages.reduce((count, page) => count + page.results.length, 0);
  const total = pages[0]?.totalResults ?? 0;
  const foundUnclassified = pages
    .flatMap(page => page.results)
    .filter(organization => organization.type == null);
  const unclassified = foundUnclassified
    .filter(
      organization =>
        !savedIds.has(String(organization.id)) &&
        !deletedIds.has(String(organization.id))
    )
    .slice(0, visibleLimit);

  useEffect(() => {
    if (
      canAccess &&
      isClassifyTab &&
      foundUnclassified.length < visibleLimit &&
      hasNextPage &&
      !isFetching &&
      !isError
    ) {
      fetchNextPage();
    }
  }, [
    canAccess,
    isClassifyTab,
    foundUnclassified.length,
    visibleLimit,
    hasNextPage,
    isFetching,
    isError,
    fetchNextPage
  ]);

  useEffect(
    () => () => {
      scanRun.current += 1;
      queryClient.cancelQueries({
        queryKey: organizationManagementKeys.duplicates,
        exact: true
      });
    },
    [queryClient]
  );

  const handleAnalyze = async () => {
    if (scan.isFetching || !isOnline) return;
    const currentRun = ++scanRun.current;
    setScanStarted(true);
    setScanCompleted(false);
    setScanProgress({ loaded: 0, total: 0 });
    const result = await scan.refetch();
    if (currentRun === scanRun.current && result.isSuccess) {
      setScanCompleted(true);
    }
  };

  const handleCancelScan = () => {
    scanRun.current += 1;
    queryClient.cancelQueries({
      queryKey: organizationManagementKeys.duplicates,
      exact: true
    });
  };

  const handleSave = async (id, type) => {
    if (!isOnline || savingId != null) return;
    setSavingId(id);
    setSaveError(null);
    try {
      const organization = await apiGet(`${getOrganizationUrl}${id}`);
      if (organization.isDeleted || organization.type != null) {
        throw new Error(
          formatMessage({ id: 'Organization already classified' })
        );
      }
      await update.mutateAsync(makeTypeUpdate(organization, type));
      setSavedIds(previous => new Set(previous).add(String(id)));
      onSuccess(formatMessage({ id: 'Modification completed' }));
    } catch (saveFailure) {
      setSaveError({ id, error: saveFailure });
    } finally {
      setSavingId(null);
    }
  };

  if (!canAccess) return null;

  return (
    <PageContainer>
      <PageHeader
        title={formatMessage({ id: 'Organization management' })}
        icon={<BusinessIcon />}
      />
      <PageTabs tabs={tabs}>
        <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h2" sx={{ mb: 1 }}>
            {formatMessage({ id: 'Organizations to classify' })}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }} aria-live="polite">
            {formatMessage(
              { id: 'Organizations scanned: {loaded} of {total}' },
              { loaded, total }
            )}
          </Typography>
          {isPending && !isError && <CircularProgress />}
          {isError && (
            <Box>
              <FormSubmissionError error={error} />
              <Button
                onClick={() => (pages.length ? fetchNextPage() : refetch())}>
                {formatMessage({ id: 'Retry' })}
              </Button>
            </Box>
          )}
          {!isPending &&
            unclassified.length === 0 &&
            !hasNextPage &&
            !isError && (
              <Typography>
                {formatMessage({ id: 'No unclassified organizations' })}
              </Typography>
            )}
          {unclassified.length > 0 && (
            <Box
              sx={{
                display: { xs: 'none', md: 'grid' },
                gridTemplateColumns:
                  'auto minmax(0, 2fr) minmax(0, 2fr) minmax(0, 2fr)',
                gap: 1,
                borderBottom: 1,
                borderColor: 'divider',
                pb: 1
              }}>
              <Box sx={{ width: 40 }} />
              <Typography variant="subtitle2">
                {formatMessage({ id: 'Organization' })}
              </Typography>
              <Typography variant="subtitle2">
                {formatMessage({ id: 'Location' })}
              </Typography>
              <Typography variant="subtitle2">
                {formatMessage({ id: 'Type' })}
              </Typography>
            </Box>
          )}
          {unclassified.map(organization => (
            <OrganizationRow
              key={organization.id}
              organization={organization}
              onPreview={setPreviewId}
              onSave={handleSave}
              isSaving={savingId === organization.id}
              isOnline={isOnline}
              error={saveError?.id === organization.id ? saveError.error : null}
            />
          ))}
          {foundUnclassified.length < visibleLimit &&
            hasNextPage &&
            !isError && <CircularProgress size={24} sx={{ mt: 2 }} />}
          {!isError &&
            (hasNextPage || foundUnclassified.length > visibleLimit) && (
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                disabled={
                  isFetching ||
                  !isOnline ||
                  foundUnclassified.length < visibleLimit
                }
                onClick={() =>
                  setVisibleLimit(limit => limit + CLASSIFICATION_BATCH_SIZE)
                }>
                {formatMessage({ id: 'Load more' })}
              </Button>
            )}
        </Card>
        <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
          <DuplicatesSection
            organizations={scanCompleted ? scan.data : []}
            deletedIds={deletedIds}
            isLoading={scan.isFetching}
            hasStarted={scanStarted}
            hasCompleted={scanCompleted}
            progress={scanProgress}
            error={scanStarted && !scan.isFetching ? scan.error : null}
            onAnalyze={handleAnalyze}
            onCancel={handleCancelScan}
            isOnline={isOnline}
            onPreview={setPreviewId}
            onDeleted={id =>
              setDeletedIds(previous => new Set(previous).add(String(id)))
            }
          />
        </Card>
        <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
          <DeletedOrganizationsSection
            enabled={canAccess && activeTab === 'deleted'}
            onPreview={setPreviewId}
          />
        </Card>
      </PageTabs>
      {previewId != null && (
        <OrganizationPreview
          id={previewId}
          onClose={() => setPreviewId(null)}
        />
      )}
    </PageContainer>
  );
};

export default OrganizationManagement;
