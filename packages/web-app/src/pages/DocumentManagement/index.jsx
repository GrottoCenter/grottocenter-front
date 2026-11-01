import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  LinearProgress,
  Stack,
  Typography
} from '@mui/material';
import PermMediaIcon from '@mui/icons-material/PermMedia';
import EditIcon from '@mui/icons-material/Edit';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';

import AppLink from '@/components/common/AppLink';
import FetchErrorState from '@/components/common/FetchErrorState';
import PageContainer from '@/components/common/Layouts/PageContainer';
import PageHeader from '@/components/common/Layouts/PageHeader';
import { documentKeys } from '@/api/queryKeys';
import {
  useDocumentsWithoutPdfOffset,
  useOnlineStatus,
  usePermissions
} from '@/hooks';
import useLocalStorage from '@/hooks/useLocalStorage';
import { PDF_OFFSET_DOCUMENT_TYPES } from '@/utils/documentPdfOffsets';
import {
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON
} from '@/utils/documentTypeHelpers';

const BATCH_SIZE = 20;
const IGNORED_KEY = 'documentManagement.ignoredPdfOffsets';
const SCAN_KEY = documentKeys.missingPdfOffsets(PDF_OFFSET_DOCUMENT_TYPES);

const DocumentManagement = () => {
  const { formatMessage, formatNumber } = useIntl();
  const { isAuth, isModerator } = usePermissions();
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();
  const [hasStarted, setHasStarted] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const lastScanWasAll = useRef(false);
  const [visibleLimit, setVisibleLimit] = useState(BATCH_SIZE);
  const [ignored, setIgnored] = useLocalStorage(IGNORED_KEY, new Set(), {
    serialize: value => [...value].join(','),
    deserialize: value => new Set(value.split(',').filter(Boolean))
  });
  const scan = useDocumentsWithoutPdfOffset({ ignoredIds: ignored });
  const hasResults = hasCompleted && !!scan.data;
  const isAnalyzing = scan.isFetching || isAnalyzingAll;
  const progress = scan.isFetching
    ? scan.progress
    : (scan.data?.progress ?? scan.progress);
  const scanRun = useRef(0);
  const documents = hasResults ? scan.data.documents : [];
  const candidates = documents.filter(
    document => !ignored.has(String(document.id))
  );
  const hasIgnored = documents.some(document =>
    ignored.has(String(document.id))
  );
  const canContinue = hasResults && scan.hasNextPage;

  useEffect(
    () => () => {
      scanRun.current += 1;
      queryClient.cancelQueries({ queryKey: SCAN_KEY, exact: true });
    },
    [queryClient]
  );

  const handleScan = async ({
    continueScan = false,
    analyzeAll = false
  } = {}) => {
    if (
      !isAuth ||
      !isModerator ||
      !isOnline ||
      isAnalyzing ||
      (continueScan && !scan.hasNextPage)
    )
      return;
    const currentRun = ++scanRun.current;
    lastScanWasAll.current = analyzeAll;
    setIsAnalyzingAll(analyzeAll);
    setHasStarted(true);
    try {
      if (!continueScan) {
        setHasCompleted(false);
        setVisibleLimit(BATCH_SIZE);
        await queryClient.resetQueries({ queryKey: SCAN_KEY, exact: true });
        if (currentRun !== scanRun.current) return;
      }
      let result = await (continueScan ? scan.fetchNextPage() : scan.refetch());
      while (currentRun === scanRun.current && result.isSuccess) {
        setHasCompleted(true);
        if (!analyzeAll || !result.hasNextPage) break;
        // The next chunk starts only after the previous one has committed,
        // preserving completed results and allowing cancellation between chunks.
        // eslint-disable-next-line no-await-in-loop
        result = await scan.fetchNextPage();
      }
      if (
        continueScan &&
        !analyzeAll &&
        currentRun === scanRun.current &&
        result.isSuccess
      ) {
        setVisibleLimit(limit => limit + BATCH_SIZE);
      }
    } finally {
      if (currentRun === scanRun.current) setIsAnalyzingAll(false);
    }
  };

  const handleAnalyze = () => handleScan();
  const handleContinue = () => handleScan({ continueScan: true });
  const handleAnalyzeAll = () =>
    handleScan({ continueScan: !!canContinue, analyzeAll: true });
  const handleRetry = () =>
    handleScan({
      continueScan: scan.isFetchNextPageError,
      analyzeAll: lastScanWasAll.current
    });

  const handleCancel = () => {
    scanRun.current += 1;
    setIsAnalyzingAll(false);
    queryClient.cancelQueries({ queryKey: SCAN_KEY, exact: true });
  };

  if (!isAuth || !isModerator) return <Navigate to="/ui/dashboard" replace />;

  return (
    <PageContainer>
      <PageHeader
        title={formatMessage({ id: 'Document management' })}
        icon={<PermMediaIcon />}
      />
      <Card sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h2" sx={{ mb: 1 }}>
          {formatMessage({ id: 'PDFs without a page offset' })}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatMessage({ id: 'documentManagement.pdfOffsetsHelp' })}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {formatMessage({ id: 'Document type' })}:{' '}
          {PDF_OFFSET_DOCUMENT_TYPES.map(type =>
            formatMessage({ id: type })
          ).join(' · ')}
        </Typography>
        <Typography
          id="document-ignore-notice"
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}>
          {formatMessage({ id: 'duplicates.ignoreNotice' })}
        </Typography>
        {isAnalyzing && (
          <Box sx={{ mb: 2 }}>
            <Typography
              aria-live="polite"
              data-testid="documents-scan-progress">
              {formatMessage(
                { id: 'Documents scanned: {loaded} of {total}' },
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
              <Button variant="outlined" color="error" onClick={handleCancel}>
                {formatMessage({ id: 'Cancel' })}
              </Button>
            </Box>
          </Box>
        )}
        {hasStarted && !isAnalyzing && !hasCompleted && !scan.error && (
          <Typography sx={{ mb: 2 }}>
            {formatMessage({ id: 'duplicates.cancelledScan' })}
          </Typography>
        )}
        {!isAnalyzing && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              gap: 1,
              mb: 2
            }}>
            <Button
              onClick={canContinue ? handleContinue : handleAnalyze}
              disabled={!isOnline}>
              {formatMessage({
                id: canContinue
                  ? 'documentManagement.continue'
                  : 'duplicates.analyze'
              })}
            </Button>
            <Button
              variant="outlined"
              onClick={handleAnalyzeAll}
              disabled={!isOnline}>
              {formatMessage({ id: 'documentManagement.analyzeAll' })}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              disabled={!hasIgnored}
              onClick={() => setIgnored(new Set())}>
              {formatMessage({ id: 'duplicates.showIgnored' })}
            </Button>
          </Box>
        )}
        {hasStarted && (scan.error || scan.isPaused || !isOnline) && (
          <FetchErrorState
            error={scan.error}
            isPaused={scan.isPaused || !isOnline}
            messageId="unexpected error"
            onRetry={handleRetry}
          />
        )}
        {hasResults && !isAnalyzing && (
          <Typography
            variant="body2"
            sx={{ mb: 2 }}
            aria-live="polite"
            data-testid="documents-scan-progress">
            {formatMessage(
              { id: 'Documents scanned: {loaded} of {total}' },
              progress
            )}
            {' · '}
            {formatMessage(
              { id: 'results_count' },
              { count: candidates.length }
            )}
          </Typography>
        )}
        {hasResults && scan.hasNextPage && !isAnalyzing && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {formatMessage({ id: 'documentManagement.partial' })}
          </Typography>
        )}
        {hasResults && !isAnalyzing && (
          <Typography
            variant="body2"
            sx={{ mb: 2 }}
            data-testid="documents-type-breakdown">
            {PDF_OFFSET_DOCUMENT_TYPES.map(
              type =>
                `${formatMessage({ id: type })}: ${formatNumber(candidates.filter(document => document.type === type).length)}`
            ).join(' · ')}
          </Typography>
        )}
        {hasResults && candidates.length === 0 && !isAnalyzing && (
          <Alert severity="info">
            {formatMessage({
              id: scan.hasNextPage
                ? 'documentManagement.emptyBatch'
                : 'No PDFs without a page offset'
            })}
          </Alert>
        )}
        <Stack
          component="ul"
          spacing={2}
          sx={{ listStyle: 'none', p: 0, m: 0 }}>
          {candidates.slice(0, visibleLimit).map(document => {
            const TypeIcon =
              DOCUMENT_TYPE_ICONS[document.type] ?? DOCUMENT_TYPE_FALLBACK_ICON;
            return (
              <Card
                component="li"
                variant="outlined"
                key={document.id}
                data-testid={`document-offset-row-${document.id}`}
                sx={{ p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <TypeIcon
                    titleAccess={formatMessage({
                      id: document.type || 'unknown'
                    })}
                    fontSize="small"
                    color="action"
                    sx={{ flexShrink: 0, mt: 0.25 }}
                  />
                  <Typography
                    sx={{
                      fontWeight: 600,
                      overflowWrap: 'anywhere',
                      minWidth: 0
                    }}>
                    <AppLink
                      to={`/ui/documents/${document.id}`}
                      openInNewTabDesktop>
                      {document.title || `#${document.id}`}
                    </AppLink>{' '}
                    <Box
                      component="span"
                      sx={{ fontWeight: 400, color: 'text.secondary' }}>
                      #{document.id}
                    </Box>
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: { xs: 'grid', sm: 'flex' },
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    flexWrap: 'wrap',
                    gap: 1,
                    mt: 2
                  }}>
                  <Button
                    component={AppLink}
                    to={`/ui/documents/${document.id}/edit`}
                    openInNewTabDesktop
                    variant="contained"
                    startIcon={<EditIcon />}
                    sx={{ minWidth: 0 }}>
                    {formatMessage({ id: 'Edit document' })}
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    startIcon={<DoNotDisturbIcon />}
                    aria-describedby="document-ignore-notice"
                    onClick={() =>
                      setIgnored(previous =>
                        new Set(previous).add(String(document.id))
                      )
                    }
                    sx={{ minWidth: 0 }}>
                    {formatMessage({ id: 'duplicates.ignoreInBrowser' })}
                  </Button>
                </Box>
              </Card>
            );
          })}
        </Stack>
        {candidates.length > visibleLimit && (
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => setVisibleLimit(limit => limit + BATCH_SIZE)}>
            {formatMessage({ id: 'Load more' })}
          </Button>
        )}
      </Card>
    </PageContainer>
  );
};

export default DocumentManagement;
