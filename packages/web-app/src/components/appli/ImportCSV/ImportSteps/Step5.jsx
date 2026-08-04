import React, { useContext } from 'react';
import {
  Box,
  LinearProgress,
  Link as MuiLink,
  Typography
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import HomeIcon from '@mui/icons-material/Home';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import { resetImportState } from '../../../../actions/ImportCsv';
import { useJobPolling } from '../../../../hooks';
import ActionButton from '../../../common/ActionButton';
import AppLink from '../../../common/AppLink';
import { ENTRANCE, FAILURE_IMPORT, SUCCESS_IMPORT } from '../constants';
import Alert from '../../../common/Alert';
import DownloadButton from '../DownloadButton';
import ImportResultRecap from '../ImportResultRecap';

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

  // Async job recap: rendered on any terminal state that carries job `progress`,
  // except the synchronous result shape (`resultImport.total` — documents and
  // legacy entrance imports) which keeps its own alerts below.
  const showRecap =
    isTerminal && progress && !(resultImport && resultImport.total);

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

      {isEntranceImport && isPolling && (
        <Alert
          data-testid="csv-import-can-close-info"
          severity="info"
          icon={<NotificationsActiveOutlinedIcon fontSize="inherit" />}
          content={
            <Typography variant="body2">
              <FormattedMessage
                id="csvImport.canClosePage"
                defaultMessage="You can safely close this page. You'll receive an in-app notification when the import completes, and an email if you enabled it in your {settingsLink}. Report download links stay valid for 7 days."
                values={{
                  settingsLink: (
                    <MuiLink
                      component={AppLink}
                      to="/ui/account"
                      openInNewTabDesktop>
                      {formatMessage({
                        id: 'csvImport.notificationSettingsLink',
                        defaultMessage: 'notification settings'
                      })}
                    </MuiLink>
                  )
                }}
              />
            </Typography>
          }
        />
      )}

      {/* Unified async-job recap (success, duplicates, failures) built from the
          job `progress` counts — the single source of truth available on both
          terminal states — plus the report download links when the completed
          flow provides them. */}
      {showRecap && (
        <ImportResultRecap
          progress={progress}
          status={status}
          reportUrls={resultImport?.summary ? resultImport.reportUrls : null}
        />
      )}

      {/* Poll failure or any error without the detailed recap above. GrottoCenter
          uses the English string itself as the translation key, so formatMessage
          localizes known messages / keys and falls back to the raw text. */}
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

      {/* Synchronous result shape (`total.*`, successfulImport, ...): documents,
          and — until the async job API ships — legacy entrance imports too. The
          shape (presence of `total`), not the entity type, drives the rendering,
          so both flows work during the transition. In-memory CSV downloads. */}
      {resultImport &&
        resultImport.total &&
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
      {resultImport && resultImport.total && resultImport.total.success > 0 && (
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
      {resultImport && resultImport.total && resultImport.total.failure > 0 && (
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

      {isDone && (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'center',
            gap: 2
          }}>
          <ActionButton
            data-testid="csv-import-new-import-button"
            variant="outlined"
            label={formatMessage({
              id: 'csvImport.newImport',
              defaultMessage: 'Start a new import'
            })}
            onClick={handleNewImport}
            icon={<ReplayIcon />}
          />
          <ActionButton
            data-testid="csv-import-home-button"
            component={AppLink}
            to="/"
            variant="contained"
            label={formatMessage({ id: 'Go to home page' })}
            icon={<HomeIcon />}
          />
        </Box>
      )}
    </>
  );
};

Step5.propTypes = {};

export default Step5;
