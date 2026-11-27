import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useQueries } from '@tanstack/react-query';
import { Alert, Box, Button, Card, Stack, Typography } from '@mui/material';
import CompareIcon from '@mui/icons-material/Compare';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import CloseIcon from '@mui/icons-material/Close';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

import { apiGet, apiPost } from '@/api/client';
import { organizationKeys } from '@/api/queryKeys';
import { advancedSearchUrl, getOrganizationUrl } from '@/conf/apiRoutes';
import { STALE } from '@/conf/queryClient';
import { useDeleteOrganization, useOnlineStatus } from '@/hooks';
import { useDuplicateScan } from '@/hooks/queries/useDuplicateScan';
import useLocalStorage from '@/hooks/useLocalStorage';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import StandardDialog from '@/components/common/StandardDialog';
import DuplicateScanControls from '@/components/common/DuplicateScanControls';
import DuplicateComparisonPanel, {
  ComparisonField,
  COMPARISON_GRID_SX,
  COMPARISON_ACTIONS_SX
} from '@/components/common/DuplicateComparisonPanel';
import AppLink from '@/components/common/AppLink';
import DuplicateMergeResult from '@/components/common/DuplicateMergeResult';
import { findOrganizationDuplicates } from '@/utils/organizationDuplicates';
import { getOrganizationTypeLabelId } from '@/utils/organizationTypes';
import { scanSearchPages } from '@/utils/scanSearchPages';
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
  onKeep,
  isDisabled,
  deleteAction = null,
  isKept = false
}) => {
  const { formatMessage } = useIntl();
  const { data, isPending, error } = query;
  const values = data ? getComparisonValues(data) : null;

  return (
    <DuplicateComparisonPanel
      testId={`duplicate-comparison-${organization.id}`}
      title={`${organization.name} (#${organization.id})`}
      headerActions={
        <OrganizationActionButtons
          organization={organization}
          onPreview={onPreview}
          isDisabled={isDisabled}
        />
      }
      isPending={isPending}
      error={error}
      onRetry={() => query.refetch()}
      isKept={isKept}
      onKeep={onKeep}
      isDisabled={isDisabled}
      deleteAction={deleteAction}>
      {data &&
        COMPARISON_FIELDS.map(({ key, label }) => (
          <ComparisonField
            key={key}
            testId={`comparison-field-${key}`}
            label={label ? formatMessage({ id: label }) : null}
            isDifferent={differingFields.has(key)}>
            {key === 'type' ? formatMessage({ id: values[key] }) : values[key]}
          </ComparisonField>
        ))}
    </DuplicateComparisonPanel>
  );
};

Comparison.propTypes = {
  organization: organizationShape.isRequired,
  differingFields: PropTypes.instanceOf(Set).isRequired,
  onPreview: PropTypes.func.isRequired,
  onKeep: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool.isRequired,
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
    refetch: PropTypes.func,
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
        sx={COMPARISON_GRID_SX}>
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
              onKeep={() => onTargetChange(String(org.id))}
              isDisabled={isBusy}
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
      <Box sx={{ ...COMPARISON_ACTIONS_SX, mt: 2 }}>{actions}</Box>
      {error && <FormSubmissionError error={error} />}
      <StandardDialog
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        isBusy={isBusy}
        title={formatMessage({ id: 'duplicates.confirmTitle' })}
        actions={
          <>
            <Button
              variant="outlined"
              autoFocus
              disabled={isBusy}
              onClick={() => setIsConfirming(false)}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
            <Button
              color="error"
              variant="contained"
              startIcon={<DeleteRoundedIcon />}
              loading={isBusy}
              loadingPosition="start"
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
    <DuplicateMergeResult
      testId={`duplicate-success-${source.id}`}
      onAcknowledge={onAcknowledge}>
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
    </DuplicateMergeResult>
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
        aria-describedby="duplicate-ignore-notice"
        onClick={() => onIgnored(group.key)}>
        {formatMessage({ id: 'duplicates.ignoreInBrowser' })}
      </Button>
    </>
  );

  return (
    <Card
      variant="outlined"
      data-testid={`duplicate-group-${group.key}`}
      sx={{
        p: { xs: 1.5, sm: 2 },
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
            group.organizations.map(org => {
              const details = [org.city, org.country, org.mail, org.url]
                .map(value => value?.trim())
                .filter(value => value && !/^[-–—]+$/.test(value));
              return (
                <Box
                  key={org.id}
                  data-testid={`duplicate-summary-${org.id}`}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    alignItems: 'baseline',
                    columnGap: 1,
                    rowGap: 0.25,
                    py: 0.5,
                    minWidth: 0
                  }}>
                  <Typography
                    sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                    {org.name}{' '}
                    <Box
                      component="span"
                      sx={{ fontWeight: 400, color: 'text.secondary' }}>
                      #{org.id}
                    </Box>
                  </Typography>
                  {org.nbCavers != null && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap' }}>
                      {formatMessage({ id: 'members' })}: {org.nbCavers}
                    </Typography>
                  )}
                  {details.length > 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ gridColumn: '1 / -1', overflowWrap: 'anywhere' }}>
                      {details.join(' · ')}
                    </Typography>
                  )}
                </Box>
              );
            })}
          {!isExpanded && (
            <Box sx={{ ...COMPARISON_ACTIONS_SX, mt: 1 }}>{actions}</Box>
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

const IGNORED_DUPLICATES_KEY = 'organizationManagement.ignoredDuplicates';

const getOrganizationsPage = ({ pageParam, signal }) =>
  apiPost(
    advancedSearchUrl,
    {
      entity: 'organizations',
      query: '',
      filter: {},
      matchAllFields: true,
      page: pageParam,
      size: 100
    },
    { signal }
  );

const DuplicatesSection = ({ onPreview }) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const { query, hasStarted, hasCompleted, progress, analyze, cancel } =
    useDuplicateScan({
      queryKey: organizationKeys.duplicates,
      enabled: isOnline,
      load: ({ signal, onProgress }) =>
        scanSearchPages({
          getPage: getOrganizationsPage,
          signal,
          onProgress,
          incompleteMessage: formatMessage({ id: 'duplicates.incompleteScan' })
        })
    });
  const [ignored, setIgnored] = useLocalStorage(
    IGNORED_DUPLICATES_KEY,
    new Set(),
    {
      serialize: value => [...value].join(','),
      deserialize: value => new Set(value.split(',').filter(Boolean))
    }
  );
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [visibleCount, setVisibleCount] = useState(10);
  const [completed, setCompleted] = useState([]);
  const { data: organizations, error, isFetching } = query;
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
    setIgnored(previous => new Set(previous).add(key));
  };

  const handleDeleted = (groupKey, source, target) => {
    setCompleted(previous => [...previous, { groupKey, source, target }]);
    setDeletedIds(previous => new Set(previous).add(String(source.id)));
  };

  return (
    <Card
      component="section"
      aria-labelledby="organization-duplicates-heading"
      sx={{ minWidth: 0, p: { xs: 1.5, sm: 2 } }}>
      <Typography
        id="organization-duplicates-heading"
        variant="h2"
        sx={{ mb: 1 }}>
        {formatMessage({ id: 'duplicates.heading' })}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {formatMessage({ id: 'duplicates.suggestionsNotice' })}
      </Typography>
      <Typography
        id="duplicate-ignore-notice"
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}>
        {formatMessage({ id: 'duplicates.ignoreNotice' })}
      </Typography>
      <DuplicateScanControls
        isLoading={isFetching}
        hasStarted={hasStarted}
        hasCompleted={hasCompleted}
        progress={progress}
        progressMessageId="Organizations scanned: {loaded} of {total}"
        error={hasStarted && !isFetching ? error : null}
        isOnline={isOnline}
        hasIgnored={hasIgnored}
        onAnalyze={analyze}
        onCancel={cancel}
        onShowIgnored={() => setIgnored(new Set())}
      />
      <Box aria-live="polite">
        {hasCompleted && (
          <Typography variant="body2" sx={{ mb: 2 }}>
            {formatMessage(
              { id: 'duplicates.scanComplete' },
              {
                count: progress.loaded,
                suggestions: candidates.filter(
                  group => group.organizations.length > 1
                ).length
              }
            )}
          </Typography>
        )}
        {hasCompleted && candidates.length === 0 && (
          <Alert severity="info">
            {formatMessage({ id: 'duplicates.noCandidates' })}
          </Alert>
        )}
      </Box>
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
    </Card>
  );
};

DuplicatesSection.propTypes = {
  onPreview: PropTypes.func.isRequired
};

export default DuplicatesSection;
