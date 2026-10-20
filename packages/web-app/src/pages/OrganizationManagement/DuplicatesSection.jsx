import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useQueries } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
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
import AppLink from '@/components/common/AppLink';
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

const CONFIRMATION_FORMATTERS = {
  p: chunks => <Typography>{chunks}</Typography>,
  strong: chunks => <strong>{chunks}</strong>
};

const RESULT_FORMATTERS = {
  p: chunks => <Typography sx={{ fontWeight: 600 }}>{chunks}</Typography>,
  note: chunks => (
    <Typography variant="body2" color="text.secondary">
      {chunks}
    </Typography>
  )
};

const COMPARISON_FIELDS = [
  { key: 'type', label: 'Type' },
  { key: 'address' },
  { key: 'mail', label: 'Email' },
  { key: 'url', label: 'Website' },
  { key: 'members', label: 'members' },
  { key: 'documents', label: 'Documents' },
  { key: 'caves', label: 'Explored caves' },
  { key: 'managed', label: 'Managed entities' }
];

const getComparisonValues = data => ({
  type: getOrganizationTypeLabelId(data.type),
  address:
    [data.address, data.postalCode, data.city, data.country]
      .filter(Boolean)
      .join(' · ') || '—',
  mail: data.mail || '—',
  url: data.url || '—',
  members: data.cavers?.length ?? 0,
  documents: (data.authoredCount ?? 0) + (data.publishedCount ?? 0),
  caves:
    (data.exploredEntrances?.length ?? 0) +
    (data.exploredNetworks?.length ?? 0),
  managed:
    (data.managedCountries?.length ?? 0) +
    (data.managedRegions?.length ?? 0) +
    (data.managedMassifs?.length ?? 0)
});

const Comparison = ({
  organization,
  query,
  differingFields,
  onPreview,
  selection,
  deleteAction = null,
  isKept = false
}) => {
  const { formatMessage } = useIntl();
  const { data, isPending, error } = query;
  const values = data ? getComparisonValues(data) : null;

  return (
    <Box
      data-testid={`duplicate-comparison-${organization.id}`}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 18rem',
        minWidth: 0,
        p: 1.5,
        border: 2,
        borderColor: isKept ? 'success.main' : 'divider',
        borderRadius: 1
      }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          alignItems: 'center'
        }}>
        <Typography
          variant="h5"
          component="h3"
          sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          {organization.name} (#{organization.id})
        </Typography>
        <OrganizationActionButtons
          organization={organization}
          onPreview={onPreview}
          showIdInLabel
          showOpenLink
        />
      </Box>
      {isPending && <CircularProgress size={20} />}
      {error && <FormSubmissionError error={error} />}
      {data && (
        <Stack
          spacing={0.5}
          sx={{ mt: 1, flexGrow: 1, overflowWrap: 'anywhere' }}>
          {COMPARISON_FIELDS.map(({ key, label }) => (
            <Typography
              key={key}
              data-testid={`comparison-field-${key}`}
              sx={{
                px: 0.5,
                py: 0.25,
                borderRadius: 0.5,
                bgcolor: differingFields.has(key)
                  ? 'action.hover'
                  : 'transparent'
              }}>
              {label && `${formatMessage({ id: label })}: `}
              <Box component={differingFields.has(key) ? 'strong' : 'span'}>
                {key === 'type'
                  ? formatMessage({ id: values[key] })
                  : values[key]}
              </Box>
            </Typography>
          ))}
        </Stack>
      )}
      <Stack spacing={1} sx={{ mt: 2 }}>
        {selection}
        {deleteAction}
      </Stack>
    </Box>
  );
};

Comparison.propTypes = {
  organization: organizationShape.isRequired,
  differingFields: PropTypes.instanceOf(Set).isRequired,
  onPreview: PropTypes.func.isRequired,
  selection: PropTypes.node.isRequired,
  deleteAction: PropTypes.node,
  isKept: PropTypes.bool,
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

const DuplicateComparison = ({
  group,
  onDeleted,
  onPreview,
  actions,
  targetId,
  onTargetChange
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const [sourceId, setSourceId] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const mutation = useDeleteOrganization();
  const isBusy = isDeleting || mutation.isPending;
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
  const differingFields = new Set();
  if (areDetailsReady && details.length > 1) {
    const comparedValues = details.map(query =>
      getComparisonValues(query.data)
    );
    COMPARISON_FIELDS.forEach(({ key }) => {
      if (
        comparedValues.some(values => values[key] !== comparedValues[0][key])
      ) {
        differingFields.add(key);
      }
    });
  }
  const source = group.organizations.find(org => String(org.id) === sourceId);
  const target = group.organizations.find(org => String(org.id) === targetId);

  const handleDelete = async () => {
    if (!isOnline || !source || !target || sourceId === targetId || isBusy)
      return;
    setError(null);
    setIsDeleting(true);
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
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Stack
        role="group"
        aria-label={formatMessage({ id: 'duplicates.keep' })}
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}>
        {group.organizations.map((org, index) => {
          const isKept = String(org.id) === targetId;
          return (
            <Comparison
              key={org.id}
              organization={org}
              query={details[index]}
              differingFields={differingFields}
              onPreview={onPreview}
              isKept={isKept}
              selection={
                isKept ? (
                  <Box
                    role="status"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      py: 0.75,
                      color: 'success.main'
                    }}>
                    <CheckIcon fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMessage({ id: 'duplicates.kept' })}
                    </Typography>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    disabled={isBusy}
                    onClick={() => onTargetChange(String(org.id))}>
                    {formatMessage({ id: 'duplicates.keepAction' })}
                  </Button>
                )
              }
              deleteAction={
                target &&
                !isKept && (
                  <Button
                    color="error"
                    variant="contained"
                    startIcon={<DeleteRoundedIcon />}
                    aria-label={formatMessage(
                      { id: 'duplicates.redirectAction' },
                      {
                        source: `${org.name} (#${org.id})`,
                        target: `${target.name} (#${target.id})`
                      }
                    )}
                    disabled={!isOnline || !areDetailsReady || isBusy}
                    onClick={() => {
                      setSourceId(String(org.id));
                      setIsConfirming(true);
                    }}>
                    {formatMessage({ id: 'duplicates.deleteAndRedirect' })}
                  </Button>
                )
              }
            />
          );
        })}
      </Stack>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
        {actions}
      </Box>
      {error && <FormSubmissionError error={error} />}
      <StandardDialog
        open={isConfirming}
        onClose={isBusy ? undefined : () => setIsConfirming(false)}
        title={formatMessage({ id: 'duplicates.confirmTitle' })}
        actions={
          <>
            <Button
              variant="outlined"
              disabled={isBusy}
              onClick={() => setIsConfirming(false)}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              color="error"
              variant="contained"
              startIcon={
                isBusy ? <CircularProgress size={20} /> : <DeleteRoundedIcon />
              }
              disabled={isBusy || !isOnline}
              onClick={handleDelete}>
              {formatMessage({ id: 'Delete' })}
            </Button>
          </>
        }>
        <Stack spacing={1.5}>
          {formatMessage(
            { id: 'duplicates.confirmSoftDelete' },
            {
              source: source ? `${source.name} (#${source.id})` : '',
              target: target ? `${target.name} (#${target.id})` : '',
              ...CONFIRMATION_FORMATTERS
            }
          )}
        </Stack>
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
  onPreview: PropTypes.func.isRequired,
  actions: PropTypes.node.isRequired,
  targetId: PropTypes.string.isRequired,
  onTargetChange: PropTypes.func.isRequired
};

const DuplicateResult = ({ source, target, onAcknowledge }) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      role="status"
      data-testid={`duplicate-success-${source.id}`}
      sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
      <Stack
        spacing={1}
        sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
        {formatMessage(
          { id: 'duplicates.redirectSuccess' },
          {
            source: (
              <AppLink
                to={`/ui/organizations/${source.id}`}
                target="_blank"
                rel="noopener noreferrer">
                {source.name} (#{source.id})
              </AppLink>
            ),
            target: (
              <AppLink
                to={`/ui/organizations/${target.id}`}
                target="_blank"
                rel="noopener noreferrer">
                {target.name} (#{target.id})
              </AppLink>
            ),
            ...RESULT_FORMATTERS
          }
        )}
      </Stack>
      <Button
        variant="outlined"
        color="success"
        sx={{ flexShrink: 0 }}
        onClick={onAcknowledge}>
        {formatMessage({ id: 'duplicates.acknowledge' })}
      </Button>
    </Box>
  );
};

DuplicateResult.propTypes = {
  source: organizationShape.isRequired,
  target: organizationShape.isRequired,
  onAcknowledge: PropTypes.func.isRequired
};

const DuplicateGroup = ({
  group,
  completed,
  onPreview,
  onIgnored,
  onDeleted,
  onAcknowledge
}) => {
  const { formatMessage } = useIntl();
  const [isExpanded, setIsExpanded] = useState(false);
  const [targetId, setTargetId] = useState('');
  const hasCandidates = group.organizations.length > 1;
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
    <Card
      variant="outlined"
      data-testid={`duplicate-group-${group.key}`}
      sx={{
        p: 2,
        mb: 1,
        borderColor: hasCandidates ? 'divider' : 'success.main'
      }}>
      {hasCandidates && (
        <>
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
          {!isExpanded &&
            group.organizations.map(org => (
              <Box
                key={org.id}
                sx={{
                  display: 'flex',
                  gap: 1,
                  py: 0.5,
                  flexWrap: 'wrap',
                  alignItems: 'center'
                }}>
                <Typography
                  sx={{
                    fontWeight: 600,
                    minWidth: 0,
                    overflowWrap: 'anywhere'
                  }}>
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
              onPreview={onPreview}
              onDeleted={(source, target) =>
                onDeleted(group.key, source, target)
              }
              actions={actions}
              targetId={targetId}
              onTargetChange={setTargetId}
            />
          )}
        </>
      )}
      {completed.length > 0 && (
        <Stack spacing={2} sx={{ mt: hasCandidates ? 2 : 0 }}>
          {completed.map(({ source, target }) => (
            <DuplicateResult
              key={source.id}
              source={source}
              target={target}
              onAcknowledge={() => onAcknowledge(source.id)}
            />
          ))}
        </Stack>
      )}
      {completed.length > 0 && hasCandidates && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          {formatMessage(
            { id: 'duplicates.remaining' },
            { count: group.organizations.length - 1 }
          )}
        </Typography>
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
  completed: PropTypes.arrayOf(
    PropTypes.shape({
      source: organizationShape.isRequired,
      target: organizationShape.isRequired
    })
  ).isRequired,
  onPreview: PropTypes.func.isRequired,
  onIgnored: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired,
  onAcknowledge: PropTypes.func.isRequired
};

const SESSION_KEY = 'organizationManagement.ignoredDuplicates';
const readIgnored = () => {
  const value = sessionStorage.getItem(SESSION_KEY);
  return new Set(value ? value.split(',') : []);
};

const DuplicatesSection = ({
  organizations,
  deletedIds,
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
  const allGroups = useMemo(
    () => (hasCompleted ? findOrganizationDuplicates(organizations) : []),
    [hasCompleted, organizations]
  );
  // Keep the scan's group keys and ordering while removing processed sources.
  // Rebuilding groups from the survivors would remount open comparisons.
  const candidates = allGroups
    .map(group => ({
      ...group,
      organizations: group.organizations.filter(
        organization => !deletedIds.has(String(organization.id))
      ),
      completed: completed.filter(result => result.groupKey === group.key)
    }))
    .filter(
      group =>
        !ignored.has(group.key) &&
        (group.organizations.length > 1 || group.completed.length > 0)
    );
  const hasIgnored = allGroups.some(group => ignored.has(group.key));

  const handleIgnore = key => {
    const next = new Set(ignored).add(key);
    sessionStorage.setItem(SESSION_KEY, [...next].join(','));
    setIgnored(next);
  };

  const handleDeleted = (groupKey, source, target) => {
    setCompleted(previous => [...previous, { groupKey, source, target }]);
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
      {hasCompleted && candidates.length === 0 && (
        <Alert severity="info">
          {formatMessage({ id: 'duplicates.noCandidates' })}
        </Alert>
      )}
      {candidates.slice(0, visibleCount).map(group => (
        <DuplicateGroup
          key={group.key}
          group={group}
          completed={group.completed}
          onPreview={onPreview}
          onIgnored={handleIgnore}
          onDeleted={handleDeleted}
          onAcknowledge={id =>
            setCompleted(previous =>
              previous.filter(entry => entry.source.id !== id)
            )
          }
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
  deletedIds: PropTypes.instanceOf(Set).isRequired,
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
