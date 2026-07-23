import React, { useContext, useEffect, useRef } from 'react';
import { Box, Link, LinearProgress, Typography } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import {
  checkRowsInBdd,
  importDocumentRows,
  importEntranceRows
} from '../../../../actions/ImportCsv';
import { useJobPolling } from '../../../../hooks';
import ActionButton from '../../../common/ActionButton';
import { ENTRANCE, FAILURE_IMPORT, SUCCESS_IMPORT } from '../constants';
import Alert from '../../../common/Alert';
import DownloadButton from '../DownloadButton';

const Step4 = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const importCsv = useSelector(state => state.importCsv);
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const {
    willBeCreated: willBeCreatedData,
    willBeCreatedAsDuplicates: willBeCreatedAsDuplicatesData,
    wontBeCreated: wontBeCreateData
  } = importCsv.resultCheck;
  const { batchId, isPolling, progress, resultImport, status } = importCsv;

  const isEntranceImport = selectedType === ENTRANCE;

  useJobPolling(batchId, isPolling);

  const handleOnClick = () => {
    const rows = [...willBeCreatedData, ...willBeCreatedAsDuplicatesData];
    if (isEntranceImport) {
      dispatch(importEntranceRows(rows));
    } else {
      dispatch(importDocumentRows(rows));
    }
  };

  // Only trigger the check-rows dry-run when landing on this step fresh. If
  // an import is already ongoing or completed (batchId/resultImport set —
  // e.g. the user navigated away mid-polling and came back), re-running it
  // here would fire another check-rows POST for thousands of rows on top of
  // the ongoing polling. Captured once so the guard doesn't flip after
  // IMPORT_ROWS_SUBMITTED updates the store.
  const skipInitialCheck = useRef(
    importCsv.batchId !== null || importCsv.resultImport !== null
  );

  useEffect(() => {
    if (!skipInitialCheck.current) {
      dispatch(checkRowsInBdd(selectedType, importData));
    }
  }, [dispatch, selectedType, importData]);

  const somethingWillBeCreated =
    (willBeCreatedData && willBeCreatedData.length > 0) ||
    (willBeCreatedAsDuplicatesData && willBeCreatedAsDuplicatesData.length > 0);

  // The batch can reach completedChunks === totalChunks while
  // processedRows < totalRows when some chunks failed (processedRows only
  // counts fully successful chunks) — force 100% on any terminal status so
  // the bar doesn't stall.
  const isTerminal = status === 'completed' || status === 'failed';
  const progressPercent =
    progress && progress.totalRows > 0
      ? Math.round((progress.processedRows / progress.totalRows) * 100)
      : 0;
  const progressValue = isTerminal ? 100 : progressPercent;

  return (
    <>
      <Typography>
        {formatMessage({
          id: 'The functionality to check for duplicates has not been fully implemented.'
        })}
        &nbsp;
        {formatMessage({
          id: 'Please be careful not to import any documents or entrances which are already present in Grottocenter.'
        })}
      </Typography>
      {importCsv.isLoading && !isEntranceImport && (
        <Typography>
          {formatMessage({ id: 'Processing, this may take some time...' })}
        </Typography>
      )}

      {isEntranceImport && importCsv.isLoading && (
        <Typography>
          {formatMessage({
            id: 'csvImport.submitting',
            defaultMessage: 'Submitting your import...'
          })}
        </Typography>
      )}

      {isEntranceImport && isPolling && (
        <Typography>
          {formatMessage({
            id: 'csvImport.submitted',
            defaultMessage:
              'Your import has been submitted and is being processed.'
          })}
        </Typography>
      )}

      {isEntranceImport && isPolling && progress && (
        <Box
          data-testid="csv-import-progress"
          sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {formatMessage(
              {
                id: 'csvImport.processing',
                defaultMessage: 'Processing: {processed}/{total} rows'
              },
              {
                processed: progress.processedRows,
                total: progress.totalRows
              }
            )}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            data-testid="csv-import-progress-bar"
          />
        </Box>
      )}

      {/* Localize the error: the async flow dispatches i18n keys (jobFailed /
          poll lost), while the synchronous documents flow still dispatches a
          raw API message — formatMessage falls back to it via defaultMessage.
          Suppressed for a failed job batch: the detailed alert below already
          reports the failure with its row count. */}
      {importCsv.error && !(status === 'failed' && progress) && (
        <Typography>
          {formatMessage({
            id: importCsv.error,
            defaultMessage: importCsv.error
          })}
        </Typography>
      )}

      {status === 'failed' && progress && (
        <Alert
          data-testid="csv-import-failed-alert"
          severity="error"
          title={formatMessage(
            {
              id: 'csvImport.jobFailed',
              defaultMessage:
                'The import failed. {number} rows could not be imported.'
            },
            { number: progress.failures }
          )}
        />
      )}

      {wontBeCreateData && wontBeCreateData.length > 0 && (
        <Alert
          severity="error"
          title={formatMessage(
            {
              id: 'csvImport.willNotBeImported',
              defaultMessage:
                "{number} entities are already present in Grottocenter and won't be imported."
            },
            {
              number: wontBeCreateData.length
            }
          )}
          content={`${formatMessage({
            id: wontBeCreateData.length === 1 ? 'Row:' : 'Rows:'
          })} ${wontBeCreateData.map(row => `${row.line}`).join(',')}`}
        />
      )}

      {willBeCreatedData && willBeCreatedData.length > 0 && (
        <Alert
          severity="info"
          title={formatMessage(
            {
              id: 'csvImport.willBeImported',
              defaultMessage: '{number} entities will be imported.'
            },
            {
              number: willBeCreatedData.length
            }
          )}
        />
      )}

      {willBeCreatedAsDuplicatesData &&
        willBeCreatedAsDuplicatesData.length > 0 && (
          <Alert
            severity="warning"
            title={formatMessage(
              {
                id: 'csvImport.willBeImportedAsDuplicates',
                defaultMessage:
                  '{number} entities will be imported as duplicates.'
              },
              {
                number: willBeCreatedAsDuplicatesData.length
              }
            )}
          />
        )}

      {somethingWillBeCreated && !batchId && !resultImport && (
        <Box textAlign="center">
          <ActionButton
            data-testid="csv-import-submit-button"
            label={formatMessage({ id: 'Import' })}
            onClick={handleOnClick}
            loading={importCsv.isLoading}
            icon={<PublishIcon />}
          />
        </Box>
      )}

      {/* Documents import stayed synchronous: resultImport keeps its legacy
          shape (total.*, successfulImport, failureImport, ...) and the
          in-memory CSV download buttons still apply. */}
      {!isEntranceImport &&
        resultImport &&
        resultImport.total.successfulImportAsDuplicates > 0 && (
          <Alert
            severity="warning"
            title={formatMessage(
              {
                id: 'csvImport.successAsDuplicatesRecap',
                defaultMessage:
                  '{number} entities have been imported as duplicates.'
              },
              {
                number: resultImport.total.successfulImportAsDuplicates
              }
            )}
            action={
              <DownloadButton
                data={resultImport.successfulImportAsDuplicates}
                filename={SUCCESS_IMPORT}
              />
            }
          />
        )}
      {!isEntranceImport && resultImport && resultImport.total.success > 0 && (
        <Alert
          severity="success"
          title={formatMessage(
            {
              id: 'csvImport.successRecap',
              defaultMessage: '{number} entities have been imported.'
            },
            {
              number: resultImport.total.success
            }
          )}
          action={
            <DownloadButton
              data={resultImport.successfulImport}
              filename={SUCCESS_IMPORT}
            />
          }
        />
      )}
      {!isEntranceImport && resultImport && resultImport.total.failure > 0 && (
        <Alert
          severity="error"
          title={formatMessage(
            {
              id: 'csvImport.errorRecap',
              defaultMessage: '{number} entities failed to be imported.'
            },
            {
              number: resultImport.total.failure
            }
          )}
          action={
            <DownloadButton
              data={resultImport.failureImport}
              filename={FAILURE_IMPORT}
            />
          }
        />
      )}

      {/* Entrance import: async job result — summary counts + links to the
          signed report URLs instead of in-memory CSV downloads. Each report
          URL is null when its category is empty. */}
      {isEntranceImport && status === 'completed' && resultImport && (
        <>
          {resultImport.summary.duplicates > 0 && (
            <Alert
              data-testid="csv-import-duplicates-alert"
              severity="warning"
              title={formatMessage(
                {
                  id: 'csvImport.successAsDuplicatesRecap',
                  defaultMessage:
                    '{number} entities have been imported as duplicates.'
                },
                { number: resultImport.summary.duplicates }
              )}
              action={
                resultImport.reportUrls.duplicates && (
                  <Link
                    href={resultImport.reportUrls.duplicates}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="csv-import-download-duplicates">
                    {formatMessage({ id: 'csvImport.downloadDuplicates' })}
                  </Link>
                )
              }
            />
          )}
          {resultImport.summary.successes > 0 && (
            <Alert
              data-testid="csv-import-success-alert"
              severity="success"
              title={formatMessage(
                {
                  id: 'csvImport.successRecap',
                  defaultMessage: '{number} entities have been imported.'
                },
                { number: resultImport.summary.successes }
              )}
              action={
                resultImport.reportUrls.success && (
                  <Link
                    href={resultImport.reportUrls.success}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="csv-import-download-success">
                    {formatMessage({ id: 'csvImport.downloadSuccess' })}
                  </Link>
                )
              }
            />
          )}
          {resultImport.summary.failures > 0 && (
            <Alert
              data-testid="csv-import-failures-alert"
              severity="error"
              title={formatMessage(
                {
                  id: 'csvImport.errorRecap',
                  defaultMessage: '{number} entities failed to be imported.'
                },
                { number: resultImport.summary.failures }
              )}
              action={
                resultImport.reportUrls.failures && (
                  <Link
                    href={resultImport.reportUrls.failures}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="csv-import-download-failures">
                    {formatMessage({ id: 'csvImport.downloadFailures' })}
                  </Link>
                )
              }
            />
          )}
          <Typography variant="caption" color="text.secondary">
            {formatMessage({
              id: 'csvImport.reportExpiry',
              defaultMessage: 'Report links expire after 7 days.'
            })}
          </Typography>
        </>
      )}
    </>
  );
};

Step4.propTypes = {};

export default Step4;
