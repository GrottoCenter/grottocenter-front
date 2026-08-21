import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  checkRowsDocumentsUrl,
  checkRowsEntrancesUrl,
  importRowsDocumentsUrl,
  importRowsEntrancesUrl,
  jobStatusUrl
} from '../conf/apiRoutes';
import { apiGet, apiPost } from '../api/client';
import { importKeys } from '../api/queryKeys';
import { ENTRANCE, DOCUMENT } from '../components/appli/ImportCSV/constants';

const JOB_FAILED_ERROR = 'csvImport.jobFailedError';
const POLL_FAILED_ERROR = 'csvImport.pollFailedError';
const POLL_INTERVAL_MS = 3000;
const MAX_CONSECUTIVE_ERRORS = 3;

const checkUrlFor = selectedType => {
  if (selectedType === ENTRANCE) return checkRowsEntrancesUrl;
  if (selectedType === DOCUMENT) return checkRowsDocumentsUrl;
  return null;
};

const importUrlFor = selectedType => {
  if (selectedType === ENTRANCE) return importRowsEntrancesUrl;
  if (selectedType === DOCUMENT) return importRowsDocumentsUrl;
  return null;
};

/**
 * One-shot CSV import session, wrapping the check → import → poll flow.
 *
 * The whole thing was a Redux slice (importCsv) with a hand-rolled polling
 * hook (useJobPolling). RQ replaces both: mutations for check + import, a
 * useQuery with refetchInterval for the job poll. The local state below only
 * threads the two mutation outcomes back into a single "session" shape so
 * Step4/Step5 have the same fields the reducer used to expose.
 */
export const useImportCsvSession = () => {
  // batchId is the switch that turns polling on; it comes from importMutation's
  // success payload and lives across the Step4 → Step5 navigation.
  const [batchId, setBatchId] = useState(null);
  // Synchronous import (documents, and the legacy entrance path before the
  // async queue) returns the result immediately — no batchId, no polling.
  const [syncResult, setSyncResult] = useState(null);
  // Seed of totalRows/totalChunks/... carried by the POST response so Step5
  // can render a determinate "0/N rows" bar during the ~3s gap before the
  // first poll returns. Legacy IMPORT_ROWS_SUBMITTED did the same.
  const [submitProgress, setSubmitProgress] = useState(null);
  // Consecutive tick failures. Legacy behaviour: give up after 3.
  // Only the setter is read: the counter drives the effect below, and the
  // running value is closed over via the functional updater.
  const [, setErrorCount] = useState(0);
  const [pollError, setPollError] = useState(null);

  const checkMutation = useMutation({
    mutationFn: ({ selectedType, rows }) => {
      const url = checkUrlFor(selectedType);
      if (!url) throw new Error('Invalid type of rows.');
      return apiPost(url, { data: rows });
    }
  });

  const importMutation = useMutation({
    mutationFn: ({ selectedType, rows }) => {
      const url = importUrlFor(selectedType);
      if (!url) throw new Error('Invalid type of rows.');
      return apiPost(url, { data: rows });
    },
    onSuccess: result => {
      // The entrance import is being migrated to an async job queue. Until
      // the new API is deployed it still answers synchronously (the documents
      // shape: `total`, `successfulImport`, ...) with no `batchId`. Route on
      // the presence of `batchId` — otherwise we'd start polling a job that
      // never exists.
      if (result?.batchId) {
        setBatchId(result.batchId);
        setSyncResult(null);
        // Seed progress from the POST response so Step5 shows a determinate
        // "0/N rows" bar during the ~3s gap before the first poll returns.
        setSubmitProgress(result.progress ?? null);
      } else {
        setBatchId(null);
        setSyncResult(result);
        setSubmitProgress(null);
      }
      setErrorCount(0);
      setPollError(null);
    }
  });

  const jobQuery = useQuery({
    queryKey: importKeys.batch(batchId),
    queryFn: () => apiGet(jobStatusUrl(batchId)),
    // Also freeze once pollError latches: refetchInterval alone doesn't stop
    // an enabled query, so the tick would keep hammering /jobStatus after the
    // 3-consecutive-errors banner shows (legacy useJobPolling.stop() parity).
    enabled: Boolean(batchId) && !pollError,
    // Terminal = stop polling; pending / running = keep polling.
    refetchInterval: query => {
      if (pollError) return false;
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return POLL_INTERVAL_MS;
    },
    // Retry limits are handled below via errorCount; disable RQ's own retry
    // so a single bad tick doesn't stall the loop with silent backoff.
    retry: false
  });

  // Legacy useJobPolling gave up after 3 consecutive tick failures. Replicate
  // via effects: bump on each failed tick, freeze polling once at threshold,
  // reset on the next clean tick. errorUpdatedAt is stable across renders that
  // don't correspond to a new tick, so the effect only fires per actual tick.
  const {
    error: jobError,
    errorUpdatedAt,
    dataUpdatedAt,
    isSuccess
  } = jobQuery;
  useEffect(() => {
    if (!jobError) return;
    setErrorCount(prev => {
      const next = prev + 1;
      if (next >= MAX_CONSECUTIVE_ERRORS) setPollError(POLL_FAILED_ERROR);
      return next;
    });
  }, [jobError, errorUpdatedAt]);
  useEffect(() => {
    if (isSuccess) setErrorCount(0);
  }, [isSuccess, dataUpdatedAt]);

  // RQ v5's useMutation returns a brand-new result object each render, so
  // `checkMutation`/`importMutation` as useCallback deps would recreate the
  // callbacks on every render — Step2's mount effect uses `reset` in its dep
  // list and would then infinite-loop (React #185). Hold the latest mutations
  // in refs so the exposed actions have a stable identity.
  const checkMutationRef = useRef(checkMutation);
  const importMutationRef = useRef(importMutation);
  checkMutationRef.current = checkMutation;
  importMutationRef.current = importMutation;

  const reset = useCallback(() => {
    setBatchId(null);
    setSyncResult(null);
    setSubmitProgress(null);
    setErrorCount(0);
    setPollError(null);
    checkMutationRef.current.reset();
    importMutationRef.current.reset();
  }, []);

  const checkRows = useCallback(
    (selectedType, rows) =>
      checkMutationRef.current.mutate({ selectedType, rows }),
    []
  );

  const importRows = useCallback(
    (selectedType, rows) =>
      importMutationRef.current.mutate({ selectedType, rows }),
    []
  );

  const jobData = jobQuery.data;
  const isJobTerminal =
    jobData?.status === 'completed' || jobData?.status === 'failed';
  const isPolling = Boolean(batchId) && !isJobTerminal && !pollError;

  // Merge async job outcome into a single `resultImport` field so consumers
  // don't have to know which flow (sync vs async) produced it.
  let resultImport = syncResult;
  if (batchId && jobData?.status === 'completed') {
    resultImport = jobData.result ?? null;
  }

  // Compose the error field to match the legacy reducer:
  //  - a bad check-rows or import-rows submission (network / 4xx) sets
  //    checkMutation.error / importMutation.error
  //  - a terminal 'failed' job status maps to JOB_FAILED_ERROR
  //  - a poll loop that ran out of retries maps to POLL_FAILED_ERROR
  let error = null;
  if (checkMutation.error) error = checkMutation.error?.message;
  else if (importMutation.error) error = importMutation.error?.message;
  else if (pollError) error = pollError;
  else if (jobData?.status === 'failed') error = JOB_FAILED_ERROR;

  return {
    // actions
    checkRows,
    importRows,
    reset,
    // check phase
    resultCheck: checkMutation.data ?? {
      willBeCreated: null,
      willBeCreatedAsDuplicates: null,
      wontBeCreated: null
    },
    isChecking: checkMutation.isPending,
    // import phase
    isImporting: importMutation.isPending,
    batchId,
    isPolling,
    status: jobData?.status ?? null,
    progress: jobData?.progress ?? submitProgress,
    resultImport,
    // combined
    isLoading: checkMutation.isPending || importMutation.isPending,
    error
  };
};
