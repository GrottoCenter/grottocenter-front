import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Alert, Box, Button, Card, Typography } from '@mui/material';
import AuthorIcon from '@/components/common/AuthorIcon';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import DuplicateScanControls from '@/components/common/DuplicateScanControls';
import DuplicateMergeResult from '@/components/common/DuplicateMergeResult';
import AppLink from '@/components/common/AppLink';
import {
  useAuthorDuplicateScan,
  usePermissions,
  useOnlineStatus
} from '@/hooks';
import useLocalStorage from '@/hooks/useLocalStorage';
import { getPersonName } from '@/utils/personDuplicates';
import DuplicatePair from './DuplicatePair';

const AuthorManagementContent = () => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const scan = useAuthorDuplicateScan({ enabled: isOnline });
  const [ignored, setIgnored] = useLocalStorage(
    'authorManagement.ignoredDuplicates.v1',
    new Set(),
    {
      serialize: value => [...value].join(','),
      deserialize: value => new Set(value.split(',').filter(Boolean))
    }
  );
  const [deletedIds, setDeletedIds] = useState(() => new Set());
  const [completed, setCompleted] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isLocked, setIsLocked] = useState(false);
  const pairs = scan.hasCompleted ? (scan.query.data ?? []) : [];
  const completedByPair = new Map(
    completed.map(result => [result.pairKey, result])
  );
  const candidates = pairs.filter(
    pair =>
      !ignored.has(pair.key) &&
      pair.persons.every(person => !deletedIds.has(String(person.id)))
  );
  // Preserve scan order: a completed pair becomes a receipt in its own slot.
  // Advancing immediately to the next homonym makes a successful merge look idle.
  const candidateKeys = new Set(candidates.map(pair => pair.key));
  const rows = pairs.filter(
    pair => completedByPair.has(pair.key) || candidateKeys.has(pair.key)
  );
  const error =
    scan.hasStarted && !scan.query.isFetching ? scan.query.error : null;
  // Locally generated errors carry translation IDs; API errors keep their
  // structured status/body so shared error handling preserves their meaning.
  const displayError =
    error && !error.status
      ? {
          code:
            error.message === 'duplicates.incompleteScan'
              ? error.message
              : 'authorDuplicates.analysisFailed'
        }
      : error;
  const handleMerged = (pairKey, source, target) => {
    setDeletedIds(previous => new Set(previous).add(String(source.id)));
    setCompleted(previous => [
      ...previous.map(entry =>
        String(entry.target.id) === String(source.id)
          ? { ...entry, target }
          : entry
      ),
      { pairKey, source, target }
    ]);
    setIsLocked(false);
  };
  return (
    <PageContainer>
      <PageHeader
        title={formatMessage({ id: 'authorDuplicates.title' })}
        icon={<AuthorIcon />}
      />
      <Card
        component="section"
        aria-label={formatMessage({ id: 'duplicates.heading' })}
        sx={{ minWidth: 0, p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          {formatMessage({ id: 'duplicates.heading' })}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {formatMessage({ id: 'authorDuplicates.notice' })}
        </Typography>
        <Typography
          id="author-ignore-notice"
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}>
          {formatMessage({ id: 'duplicates.ignoreNotice' })}
        </Typography>
        <DuplicateScanControls
          isLoading={scan.query.isFetching}
          hasStarted={scan.hasStarted}
          hasCompleted={scan.hasCompleted}
          progress={scan.progress}
          progressMessageId={
            scan.progress.phase === 'matching'
              ? 'authorDuplicates.matchingProgress'
              : 'authorDuplicates.loadingProgress'
          }
          error={displayError}
          isOnline={isOnline}
          hasIgnored={pairs.some(pair => ignored.has(pair.key))}
          onAnalyze={() => {
            setVisibleCount(10);
            scan.analyze();
          }}
          onCancel={scan.cancel}
          onShowIgnored={() => setIgnored(new Set())}
          isDisabled={isLocked}
        />
        <Box aria-live="polite">
          {scan.hasCompleted && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              {formatMessage(
                { id: 'duplicates.scanComplete' },
                { count: scan.progress.loaded, suggestions: candidates.length }
              )}
            </Typography>
          )}
          {scan.hasCompleted && rows.length === 0 && (
            <Alert severity="info">
              {formatMessage({ id: 'duplicates.noCandidates' })}
            </Alert>
          )}
        </Box>
        {rows.slice(0, visibleCount).map(pair => {
          const result = completedByPair.get(pair.key);
          if (result) {
            const { source, target } = result;
            return (
              <Card
                key={pair.key}
                variant="outlined"
                data-testid={`author-merge-success-${source.id}`}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: 2,
                  borderColor: 'success.main'
                }}>
                <DuplicateMergeResult
                  isDisabled={isLocked}
                  onAcknowledge={() =>
                    setCompleted(previous =>
                      previous.filter(entry => entry.pairKey !== pair.key)
                    )
                  }>
                  <Typography sx={{ fontWeight: 600 }}>
                    {formatMessage(
                      { id: 'authorDuplicates.success' },
                      {
                        source: `${getPersonName(source)} (#${source.id})`,
                        target: (
                          <AppLink
                            to={`/ui/persons/${target.id}`}
                            openInNewTabDesktop>
                            {getPersonName(target)} (#{target.id})
                          </AppLink>
                        )
                      }
                    )}
                  </Typography>
                </DuplicateMergeResult>
              </Card>
            );
          }
          return (
            <DuplicatePair
              key={pair.key}
              pair={pair}
              isLocked={isLocked}
              onLock={setIsLocked}
              onIgnore={key =>
                setIgnored(previous => new Set(previous).add(key))
              }
              onMerged={(source, target) =>
                handleMerged(pair.key, source, target)
              }
            />
          );
        })}
        {rows.length > visibleCount && (
          <Button
            variant="outlined"
            fullWidth
            disabled={isLocked}
            onClick={() => setVisibleCount(count => count + 10)}>
            {formatMessage({ id: 'Load more' })}
          </Button>
        )}
      </Card>
    </PageContainer>
  );
};

const AuthorManagement = () => {
  const { isAuth, isModerator } = usePermissions();
  return isAuth && isModerator ? (
    <AuthorManagementContent />
  ) : (
    <Navigate to="/ui/dashboard" replace />
  );
};

export default AuthorManagement;
