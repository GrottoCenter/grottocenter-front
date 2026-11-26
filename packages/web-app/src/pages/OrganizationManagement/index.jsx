import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@mui/material';
import CallMergeIcon from '@mui/icons-material/CallMerge';
import BusinessIcon from '@mui/icons-material/Business';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { apiPost } from '@/api/client';
import { organizationManagementKeys } from '@/api/queryKeys';
import { advancedSearchUrl } from '@/conf/apiRoutes';
import Organization from '@/components/appli/Organization';
import StandardDialog from '@/components/common/StandardDialog';
import CustomIcon from '@/components/common/CustomIcon';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import PageTabs from '@/components/common/Layouts/PageTabs';
import { useOnlineStatus, useOrganization, usePermissions } from '@/hooks';
import DuplicatesSection from './DuplicatesSection';
import AuthorConversion from './AuthorConversion';

const PAGE_SIZE = 100;

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
      fullScreen={isMobile}
      maxWidth="xl">
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

const OrganizationManagementContent = () => {
  const { formatMessage } = useIntl();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');
  const isConversionTab = activeTab !== 'duplicates';
  const tabs = useMemo(
    () => [
      {
        id: 'authors',
        label: formatMessage({ id: 'organizationConversion.heading' }),
        icon: <CustomIcon type="organization" size={20} />
      },
      {
        id: 'duplicates',
        label: formatMessage({ id: 'duplicates.heading' }),
        icon: <CallMergeIcon />
      }
    ],
    [formatMessage]
  );
  const navigate = useNavigate();
  const { isAuth, isModerator } = usePermissions();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [previewId, setPreviewId] = useState(null);
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [scanStarted, setScanStarted] = useState(false);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [scanProgress, setScanProgress] = useState({ loaded: 0, total: 0 });
  const scanRun = useRef(0);
  const canAccess = isAuth && isModerator;
  const scan = useQuery({
    queryKey: organizationManagementKeys.duplicates,
    enabled: false,
    retry: false,
    gcTime: 60 * 1000,
    queryFn: async ({ signal }) => {
      const allOrganizations = [];
      let scanned = 0;
      let total = 0;
      let pageNumber = 1;
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

  if (!canAccess) return null;

  return (
    <PageContainer>
      <PageHeader
        title={formatMessage({ id: 'Organization management' })}
        icon={<BusinessIcon />}
      />
      <PageTabs tabs={tabs}>
        <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
          <AuthorConversion
            isActive={isConversionTab}
            deletedIds={deletedIds}
            onPreview={setPreviewId}
            onDeleted={id =>
              setDeletedIds(previous => new Set(previous).add(String(id)))
            }
          />
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

const OrganizationManagement = () => {
  const [searchParams] = useSearchParams();
  if (searchParams.get('tab') === 'deleted') {
    return <Navigate to="/ui/deleted-entities?type=organizations" replace />;
  }
  return <OrganizationManagementContent />;
};

export default OrganizationManagement;
