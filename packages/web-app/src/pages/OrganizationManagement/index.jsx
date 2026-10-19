import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { apiGet, apiPost } from '@/api/client';
import { organizationManagementKeys } from '@/api/queryKeys';
import { advancedSearchUrl, getOrganizationUrl } from '@/conf/apiRoutes';
import Organization from '@/components/appli/Organization';
import StandardDialog from '@/components/common/StandardDialog';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
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

const PAGE_SIZE = 100;

const getOrganizationsPage = ({ pageParam }) =>
  apiPost(advancedSearchUrl, {
    entity: 'organizations',
    query: '',
    filter: {},
    matchAllFields: true,
    page: pageParam,
    size: PAGE_SIZE
  });

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
  const viewLabel = formatMessage(
    { id: 'View organization {name}' },
    { name: organization.name }
  );

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
      <Tooltip title={viewLabel}>
        <IconButton
          aria-label={viewLabel}
          onClick={() => onPreview(organization.id)}>
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
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
              {formatMessage({ id: getOrganizationTypeLabelId(value) })}
            </MenuItem>
          ))}
        </TextField>
        <Button
          size="small"
          variant="contained"
          disabled={!type || isSaving || !isOnline}
          onClick={() => onSave(organization.id, type)}>
          {isSaving ? (
            <CircularProgress size={20} />
          ) : (
            formatMessage({ id: 'Save' })
          )}
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
  const navigate = useNavigate();
  const { isAuth, isModerator } = usePermissions();
  const isOnline = useOnlineStatus();
  const { onSuccess } = useNotification();
  const update = useUpdateOrganization();
  const [previewId, setPreviewId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savedIds, setSavedIds] = useState(() => new Set());
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
    enabled: canAccess,
    gcTime: 60 * 1000
  });

  useEffect(() => {
    if (!canAccess) navigate('/ui/dashboard', { replace: true });
  }, [canAccess, navigate]);

  useEffect(() => {
    if (hasNextPage && !isFetching && !isError) fetchNextPage();
  }, [hasNextPage, isFetching, isError, fetchNextPage]);

  const pages = data?.pages ?? [];
  const loaded = pages.reduce((count, page) => count + page.results.length, 0);
  const total = pages[0]?.totalResults ?? 0;
  const unclassified = pages
    .flatMap(page => page.results)
    .filter(
      organization =>
        organization.type == null && !savedIds.has(String(organization.id))
    );

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
    <Layout
      title={formatMessage({ id: 'Organization management' })}
      content={
        <Box sx={{ py: 2 }}>
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
          {hasNextPage && !isError && (
            <CircularProgress size={24} sx={{ mt: 2 }} />
          )}
          {previewId != null && (
            <OrganizationPreview
              id={previewId}
              onClose={() => setPreviewId(null)}
            />
          )}
        </Box>
      }
    />
  );
};

export default OrganizationManagement;
