import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useQueries } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Radio,
  RadioGroup,
  Stack,
  Typography
} from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import { apiGet } from '@/api/client';
import { organizationKeys } from '@/api/queryKeys';
import { getOrganizationUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { useDeleteOrganization, useOnlineStatus } from '@/hooks';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import StandardDialog from '@/components/common/StandardDialog';
import { findOrganizationDuplicates } from '@/utils/organizationDuplicates';
import { getOrganizationTypeLabelId } from '@/utils/organizationTypes';
import OrganizationActionButtons from './OrganizationActionButtons';

const organizationShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  name: PropTypes.string.isRequired,
  city: PropTypes.string,
  country: PropTypes.string,
  postalCode: PropTypes.string,
  mail: PropTypes.string,
  url: PropTypes.string,
  nbCavers: PropTypes.number
});

const Comparison = ({ organization, query, status = null }) => {
  const { formatMessage } = useIntl();
  const { data, isPending, error } = query;

  return (
    <Box
      data-testid={`duplicate-comparison-${organization.id}`}
      sx={{
        position: 'relative',
        flex: '1 1 18rem',
        minWidth: 0,
        p: 1.5,
        pb: status ? 5 : 1.5,
        border: 2,
        borderColor: status ? `${status}.main` : 'divider',
        borderRadius: 1
      }}>
      <Typography variant="h5" component="h3">
        {organization.name} (#{organization.id})
      </Typography>
      {isPending && <CircularProgress size={20} />}
      {error && <FormSubmissionError error={error} />}
      {data && (
        <Stack spacing={0.5}>
          <Typography>
            {formatMessage({ id: 'Type' })}:{' '}
            {formatMessage({ id: getOrganizationTypeLabelId(data.type) })}
          </Typography>
          <Typography>
            {[data.address, data.postalCode, data.city, data.country]
              .filter(Boolean)
              .join(' · ') || '—'}
          </Typography>
          <Typography>
            {formatMessage({ id: 'Email' })}: {data.mail || '—'}
          </Typography>
          <Typography>
            {formatMessage({ id: 'Website' })}: {data.url || '—'}
          </Typography>
          <Typography>
            {formatMessage({ id: 'members' })}: {data.cavers?.length ?? 0}
          </Typography>
          <Typography>
            {formatMessage({ id: 'Documents' })}:{' '}
            {(data.authoredCount ?? 0) + (data.publishedCount ?? 0)}
          </Typography>
          <Typography>
            {formatMessage({ id: 'Explored caves' })}:{' '}
            {(data.exploredEntrances?.length ?? 0) +
              (data.exploredNetworks?.length ?? 0)}
          </Typography>
          <Typography>
            {formatMessage({ id: 'Managed entities' })}:{' '}
            {(data.managedCountries?.length ?? 0) +
              (data.managedRegions?.length ?? 0) +
              (data.managedMassifs?.length ?? 0)}
          </Typography>
        </Stack>
      )}
      {status && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            color: `${status}.main`,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {formatMessage({
              id: status === 'success' ? 'duplicates.keep' : 'duplicates.remove'
            })}
          </Typography>
          {status === 'success' ? (
            <CheckIcon sx={{ fontSize: 24 }} />
          ) : (
            <CloseIcon sx={{ fontSize: 24 }} />
          )}
        </Box>
      )}
    </Box>
  );
};

Comparison.propTypes = {
  organization: organizationShape.isRequired,
  status: PropTypes.oneOf(['success', 'error']),
  query: PropTypes.shape({
    data: PropTypes.shape({
      address: PropTypes.string,
      postalCode: PropTypes.string,
      city: PropTypes.string,
      country: PropTypes.string,
      type: PropTypes.string,
      mail: PropTypes.string,
      url: PropTypes.string,
      cavers: PropTypes.arrayOf(PropTypes.shape({})),
      authoredCount: PropTypes.number,
      publishedCount: PropTypes.number,
      exploredEntrances: PropTypes.arrayOf(PropTypes.shape({})),
      exploredNetworks: PropTypes.arrayOf(PropTypes.shape({})),
      managedCountries: PropTypes.arrayOf(PropTypes.shape({})),
      managedRegions: PropTypes.arrayOf(PropTypes.shape({})),
      managedMassifs: PropTypes.arrayOf(PropTypes.shape({}))
    }),
    isPending: PropTypes.bool,
    error: PropTypes.shape({})
  }).isRequired
};

const DuplicateComparison = ({ group, onDeleted, actions }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState(null);
  const mutation = useDeleteOrganization();
  const details = useQueries({
    queries: group.organizations.map(org => ({
      queryKey: organizationKeys.detail(org.id),
      queryFn: () => apiGet(`${getOrganizationUrl}${org.id}`),
      staleTime: STALE.STANDARD
    }))
  });
  const areDetailsReady = details.every(
    query => query.data && !query.data.isDeleted && !query.error
  );
  const source = group.organizations.find(org => String(org.id) === sourceId);
  const target = group.organizations.find(org => String(org.id) === targetId);

  const handleDelete = async () => {
    if (
      !isOnline ||
      !source ||
      !target ||
      sourceId === targetId ||
      mutation.isPending
    )
      return;
    setError(null);
    try {
      const [freshSource, freshTarget] = await Promise.all([
        apiGet(`${getOrganizationUrl}${sourceId}`),
        apiGet(`${getOrganizationUrl}${targetId}`)
      ]);
      if (
        freshSource.isDeleted ||
        freshTarget.isDeleted ||
        String(freshSource.id) !== sourceId ||
        String(freshTarget.id) !== targetId
      ) {
        throw new Error(
          formatMessage({ id: 'duplicates.organizationChanged' })
        );
      }
      await mutation.mutateAsync({
        id: sourceId,
        entityId: targetId,
        isPermanent: false
      });
      setIsConfirming(false);
      onDeleted(source, target);
    } catch (deleteError) {
      setError(deleteError);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {group.organizations.map((org, index) => {
          let status = null;
          if (targetId) {
            status = String(org.id) === targetId ? 'success' : 'error';
          }
          return (
            <Comparison
              key={org.id}
              organization={org}
              query={details[index]}
              status={status}
            />
          );
        })}
      </Stack>
      <FormControl sx={{ mt: 2 }}>
        <Typography component="span" variant="subtitle2">
          {formatMessage({ id: 'duplicates.keep' })}
        </Typography>
        <RadioGroup
          aria-label={formatMessage({ id: 'duplicates.keep' })}
          value={targetId}
          onChange={event => setTargetId(event.target.value)}>
          {group.organizations.map(org => (
            <FormControlLabel
              key={org.id}
              value={String(org.id)}
              control={<Radio />}
              label={`${org.name} (#${org.id})`}
            />
          ))}
        </RadioGroup>
      </FormControl>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
        {target &&
          group.organizations
            .filter(org => String(org.id) !== targetId)
            .map(org => (
              <Button
                key={org.id}
                color="error"
                variant="contained"
                startIcon={<MergeTypeIcon />}
                disabled={!isOnline || !areDetailsReady}
                onClick={() => {
                  setSourceId(String(org.id));
                  setIsConfirming(true);
                }}>
                {formatMessage({ id: 'duplicates.deleteAndRedirect' })} (#
                {org.id})
              </Button>
            ))}
        {actions}
      </Box>
      {error && <FormSubmissionError error={error} />}
      <StandardDialog
        open={isConfirming}
        onClose={mutation.isPending ? undefined : () => setIsConfirming(false)}
        title={formatMessage({ id: 'duplicates.confirmTitle' })}
        actions={
          <>
            <Button
              variant="outlined"
              disabled={mutation.isPending}
              onClick={() => setIsConfirming(false)}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              color="error"
              variant="contained"
              startIcon={
                mutation.isPending ? (
                  <CircularProgress size={20} />
                ) : (
                  <DeleteRoundedIcon />
                )
              }
              disabled={mutation.isPending || !isOnline}
              onClick={handleDelete}>
              {formatMessage({ id: 'Delete' })}
            </Button>
          </>
        }>
        <Typography>
          {formatMessage(
            { id: 'duplicates.confirmSoftDelete' },
            {
              source: source ? `${source.name} (#${source.id})` : '',
              target: target ? `${target.name} (#${target.id})` : ''
            }
          )}
        </Typography>
        {error && <FormSubmissionError error={error} />}
      </StandardDialog>
    </Box>
  );
};

DuplicateComparison.propTypes = {
  group: PropTypes.shape({
    key: PropTypes.string.isRequired,
    organizations: PropTypes.arrayOf(organizationShape).isRequired,
    reasons: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  onDeleted: PropTypes.func.isRequired,
  actions: PropTypes.node.isRequired
};

const DuplicateGroup = ({ group, onPreview, onIgnored, onDeleted }) => {
  const { formatMessage } = useIntl();
  const [isExpanded, setIsExpanded] = useState(false);
  const actions = (
    <>
      <Button
        variant={isExpanded ? 'outlined' : 'contained'}
        startIcon={isExpanded ? <CloseIcon /> : <CompareIcon />}
        onClick={() => setIsExpanded(value => !value)}>
        {formatMessage({ id: isExpanded ? 'Close' : 'duplicates.compare' })}
      </Button>
      <Button
        variant="outlined"
        color="secondary"
        startIcon={<DoNotDisturbIcon />}
        onClick={() => onIgnored(group.key)}>
        {formatMessage({ id: 'duplicates.ignoreForSession' })}
      </Button>
    </>
  );

  return (
    <Card variant="outlined" sx={{ p: 2, mb: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {group.reasons
          .map(reason => formatMessage({ id: `duplicates.${reason}` }))
          .join(' · ')}
        {group.nameSimilarity != null &&
          ` · ${formatMessage(
            { id: 'duplicates.nameSimilarity' },
            { percent: group.nameSimilarity }
          )}`}
      </Typography>
      {group.organizations.map(org => (
        <Box
          key={org.id}
          sx={{
            display: 'flex',
            gap: 1,
            py: 0.5,
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
          <OrganizationActionButtons
            organization={org}
            onPreview={onPreview}
            showIdInLabel
          />
          <Typography
            sx={{ fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}>
            {org.name}{' '}
            <Box
              component="span"
              sx={{ fontWeight: 400, color: 'text.secondary' }}>
              #{org.id}
            </Box>
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ overflowWrap: 'anywhere' }}>
            {[org.city, org.country, org.mail, org.url]
              .filter(Boolean)
              .join(' · ')}
            {org.nbCavers != null &&
              ` · ${formatMessage({ id: 'members' })}: ${org.nbCavers}`}
          </Typography>
        </Box>
      ))}
      {!isExpanded && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
          {actions}
        </Box>
      )}
      {isExpanded && (
        <DuplicateComparison
          group={group}
          onDeleted={onDeleted}
          actions={actions}
        />
      )}
    </Card>
  );
};

DuplicateGroup.propTypes = {
  group: PropTypes.shape({
    key: PropTypes.string.isRequired,
    organizations: PropTypes.arrayOf(organizationShape).isRequired,
    reasons: PropTypes.arrayOf(PropTypes.string).isRequired,
    nameSimilarity: PropTypes.number
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  onIgnored: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired
};

const SESSION_KEY = 'organizationManagement.ignoredDuplicates';
const readIgnored = () => {
  const value = sessionStorage.getItem(SESSION_KEY);
  return new Set(value ? value.split(',') : []);
};

const DuplicatesSection = ({
  organizations,
  isLoading,
  hasStarted,
  hasCompleted,
  progress,
  error,
  onAnalyze,
  onCancel,
  isOnline,
  onPreview,
  onDeleted
}) => {
  const { formatMessage } = useIntl();
  const [ignored, setIgnored] = useState(readIgnored);
  const [visibleCount, setVisibleCount] = useState(10);
  const [completed, setCompleted] = useState([]);
  const allGroups = hasCompleted
    ? findOrganizationDuplicates(organizations)
    : [];
  const candidates = allGroups.filter(group => !ignored.has(group.key));
  const hasIgnored = allGroups.some(group => ignored.has(group.key));

  const handleIgnore = key => {
    const next = new Set(ignored).add(key);
    sessionStorage.setItem(SESSION_KEY, [...next].join(','));
    setIgnored(next);
  };

  const handleDeleted = (source, target) => {
    setCompleted(previous => [...previous, { source, target }]);
    onDeleted(source.id);
  };

  return (
    <Box
      component="section"
      aria-label={formatMessage({ id: 'duplicates.heading' })}
      sx={{ minWidth: 0 }}>
      <Typography variant="h2" sx={{ mb: 1 }}>
        {formatMessage({ id: 'duplicates.heading' })}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatMessage({ id: 'duplicates.suggestionsNotice' })}
      </Typography>
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <Typography>
            {formatMessage(
              { id: 'Organizations scanned: {loaded} of {total}' },
              progress
            )}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <LinearProgress
              variant={progress.total > 0 ? 'determinate' : 'indeterminate'}
              value={
                progress.total > 0
                  ? Math.min(100, (progress.loaded / progress.total) * 100)
                  : undefined
              }
              sx={{ flexGrow: 1, minWidth: 0 }}
            />
            <Button variant="outlined" color="error" onClick={onCancel}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
          </Box>
        </Box>
      )}
      {hasStarted && !isLoading && !hasCompleted && !error && (
        <Typography>
          {formatMessage({ id: 'duplicates.cancelledScan' })}
        </Typography>
      )}
      {!isLoading && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          <Button onClick={onAnalyze} disabled={!isOnline}>
            {formatMessage({ id: 'duplicates.analyze' })}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            disabled={!hasIgnored}
            onClick={() => {
              sessionStorage.removeItem(SESSION_KEY);
              setIgnored(new Set());
            }}>
            {formatMessage({ id: 'duplicates.showIgnored' })}
          </Button>
        </Box>
      )}
      {error && <FormSubmissionError error={error} />}
      {hasCompleted && (
        <Typography variant="body2" sx={{ mb: 2 }}>
          {formatMessage(
            { id: 'duplicates.scanComplete' },
            { count: progress.loaded }
          )}
        </Typography>
      )}
      {completed.map(({ source, target }) => (
        <Card
          key={source.id}
          variant="outlined"
          role="status"
          data-testid={`duplicate-success-${source.id}`}
          sx={{ borderColor: 'success.main', p: 2, mb: 2 }}>
          <Typography color="success.main" sx={{ fontWeight: 600, mb: 1 }}>
            {formatMessage(
              { id: 'duplicates.redirectSuccess' },
              {
                source: `${source.name} (#${source.id})`,
                target: `${target.name} (#${target.id})`
              }
            )}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap'
            }}>
            <OrganizationActionButtons
              organization={target}
              onPreview={onPreview}
              showIdInLabel
            />
            <Typography sx={{ fontWeight: 600 }}>
              {target.name} (#{target.id})
            </Typography>
            <Button
              variant="outlined"
              color="success"
              sx={{ ml: { sm: 'auto' } }}
              onClick={() =>
                setCompleted(previous =>
                  previous.filter(entry => entry.source.id !== source.id)
                )
              }>
              {formatMessage({ id: 'duplicates.acknowledge' })}
            </Button>
          </Box>
        </Card>
      ))}
      {hasCompleted && candidates.length === 0 && (
        <Alert severity="info">
          {formatMessage({ id: 'duplicates.noCandidates' })}
        </Alert>
      )}
      {candidates.slice(0, visibleCount).map(group => (
        <DuplicateGroup
          key={group.key}
          group={group}
          onPreview={onPreview}
          onIgnored={handleIgnore}
          onDeleted={handleDeleted}
        />
      ))}
      {candidates.length > visibleCount && (
        <Button
          variant="outlined"
          fullWidth
          sx={{ mt: 2 }}
          onClick={() => setVisibleCount(count => count + 10)}>
          {formatMessage({ id: 'Load more' })}
        </Button>
      )}
    </Box>
  );
};

DuplicatesSection.propTypes = {
  organizations: PropTypes.arrayOf(organizationShape).isRequired,
  isLoading: PropTypes.bool.isRequired,
  hasStarted: PropTypes.bool.isRequired,
  hasCompleted: PropTypes.bool.isRequired,
  progress: PropTypes.shape({
    loaded: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  }).isRequired,
  error: PropTypes.shape({}),
  onAnalyze: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOnline: PropTypes.bool.isRequired,
  onPreview: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired
};

export default DuplicatesSection;
