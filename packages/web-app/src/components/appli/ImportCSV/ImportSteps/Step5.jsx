import React, { useContext } from 'react';
import { Box, Link, LinearProgress, Typography } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import { resetImportState } from '../../../../actions/ImportCsv';
import { useJobPolling } from '../../../../hooks';
import ActionButton from '../../../common/ActionButton';
import { ENTRANCE, FAILURE_IMPORT, SUCCESS_IMPORT } from '../constants';
import Alert from '../../../common/Alert';
import DownloadButton from '../DownloadButton';

// Step 5 — Import: runs the async job polling, shows live progress, then the
// terminal result (success/failure recaps + report links). This step is
// terminal in the wizard (no Back/Next); "New import" resets everything and
// returns to step 1.
const Step5 = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const importCsv = useSelector(state => state.importCsv);
  const { selectedType, resetContext } = useContext(ImportPageContentContext);

  const { batchId, isPolling, progress, resultImport, status } = importCsv;
  const isEntranceImport = selectedType === ENTRANCE;

  useJobPolling(batchId, isPolling);

  const handleNewImport = () => {
    dispatch(resetImportState());
    resetContext();
  };

  // The batch can reach completedChunks === totalChunks while
  // processedRows < totalRows when some chunks failed (processedRows only
  // counts fully successful chunks) — force 100% on any terminal status so the
  // bar doesn't stall.
  const isTerminal = status === 'completed' || status === 'failed';
  const hasTotal = progress && progress.totalRows > 0;
  const progressPercent = hasTotal
    ? Math.round((progress.processedRows / progress.totalRows) * 100)
    : 0;
  const progressValue = isTerminal ? 100 : progressPercent;

  // "Done" once we have a result (either flow) or a terminal failure — used to
  // reveal the "New import" reset.
  const isDone = !!resultImport || status === 'failed' || !!importCsv.error;

  return (
    <>
      {isEntranceImport && isPolling && (
        <Typography>
          {formatMessage({
            id: 'csvImport.submitted',
            defaultMessage:
              'Your import has been submitted and is being processed.'
          })}
        </Typography>
      )}

      {isEntranceImport && isPolling && (
        <Box
          data-testid="csv-import-progress"
          sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {hasTotal && (
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
          )}
          <LinearProgress
            variant={hasTotal ? 'determinate' : 'indeterminate'}
            value={progressValue}
            data-testid="csv-import-progress-bar"
          />
        </Box>
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

      {/* Poll failure or any error without the detailed failed-batch alert
          above. GrottoCenter uses the English string itself as the translation
          key, so formatMessage localizes known messages / keys and falls back
          to the raw text otherwise. */}
      {importCsv.error && !(status === 'failed' && progress) && (
        <Alert
          data-testid="csv-import-error-alert"
          severity="error"
          title={formatMessage({
            id: importCsv.error,
            defaultMessage: importCsv.error
          })}
        />
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

      {isDone && (
        <Box textAlign="center" sx={{ mt: 2 }}>
          <ActionButton
            data-testid="csv-import-new-import-button"
            label={formatMessage({
              id: 'csvImport.newImport',
              defaultMessage: 'Start a new import'
            })}
            onClick={handleNewImport}
            icon={<ReplayIcon />}
          />
        </Box>
      )}
    </>
  );
};

Step5.propTypes = {};

export default Step5;
