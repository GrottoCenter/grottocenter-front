import PropTypes from 'prop-types';
import { Box, Link, Paper, Typography, useTheme } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CancelIcon from '@mui/icons-material/Cancel';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import Alert from '../../common/Alert';
import AppLink from '../../common/AppLink';

// Single terminal-state recap for the async import job. Reads its counts from
// `progress` — the only payload guaranteed present on BOTH terminal states
// (`completed` and `failed`) — so the breakdown is always shown, even when the
// backend reports `failed` with a null `result`. Report download links come
// from `reportUrls` when the (completed) flow provides them.

// A single count tile: icon + number + label, and an optional report link when
// the backend exposes a signed URL for that category.
const RecapTile = ({ icon, color, count, label, reportUrl, downloadLabel }) => (
  <Paper
    variant="outlined"
    sx={{
      flex: '1 1 120px',
      minWidth: 120,
      p: 1.5,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      textAlign: 'center'
    }}>
    <Box sx={{ color, display: 'flex' }}>{icon}</Box>
    <Typography variant="h5" sx={{ color, fontWeight: 'bold', lineHeight: 1 }}>
      {count}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    {reportUrl && (
      <Link
        href={reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        variant="caption">
        {downloadLabel}
      </Link>
    )}
  </Paper>
);

RecapTile.propTypes = {
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  reportUrl: PropTypes.string,
  downloadLabel: PropTypes.string.isRequired
};

const ImportResultRecap = ({ progress, status, reportUrls = null }) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();

  const {
    totalRows = 0,
    processedRows = 0,
    successes = 0,
    duplicates = 0,
    failures = 0
  } = progress || {};

  const imported = successes + duplicates;

  // The job `status` is authoritative: a `failed` job is an error, full stop —
  // even if the counts look fine. On a `completed` job we refine the tone with
  // the counts (partial when some rows failed).
  let severity = 'info';
  let titleId = 'csvImport.recapTitleEmpty';
  if (status === 'failed') {
    severity = 'error';
    titleId = 'csvImport.recapTitleFailure';
  } else if (failures > 0 && imported > 0) {
    severity = 'warning';
    titleId = 'csvImport.recapTitlePartial';
  } else if (imported > 0) {
    severity = 'success';
    titleId = 'csvImport.recapTitleSuccess';
  }

  // Honesty note: the job is `failed` yet the counts show rows were actually
  // recorded — surface what went through instead of leaving the user in doubt.
  const hasInconsistency = status === 'failed' && imported > 0;

  return (
    <Box
      data-testid="csv-import-recap"
      sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Alert
        data-testid="csv-import-recap-banner"
        disableMargins
        severity={severity}
        title={formatMessage({ id: titleId })}
        content={
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">
              {formatMessage(
                { id: 'csvImport.recapSubtitle' },
                { processed: processedRows, total: totalRows }
              )}
            </Typography>
            {hasInconsistency && (
              <Typography variant="caption" color="text.secondary">
                {formatMessage({ id: 'csvImport.recapInconsistencyNote' })}
              </Typography>
            )}
          </Box>
        }
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        <RecapTile
          icon={<FormatListNumberedIcon />}
          color={theme.palette.text.secondary}
          count={totalRows}
          label={formatMessage({ id: 'csvImport.recapTotal' })}
          downloadLabel=""
        />
        <RecapTile
          icon={<CheckCircleIcon />}
          color={theme.palette.success.main}
          count={successes}
          label={formatMessage({ id: 'csvImport.recapImported' })}
          reportUrl={reportUrls?.success}
          downloadLabel={formatMessage({ id: 'csvImport.downloadSuccess' })}
        />
        <RecapTile
          icon={<ContentCopyIcon />}
          color={theme.palette.warning.main}
          count={duplicates}
          label={formatMessage({ id: 'csvImport.recapDuplicates' })}
          reportUrl={reportUrls?.duplicates}
          downloadLabel={formatMessage({ id: 'csvImport.downloadDuplicates' })}
        />
        <RecapTile
          icon={<CancelIcon />}
          color={theme.palette.error.main}
          count={failures}
          label={formatMessage({ id: 'csvImport.recapFailures' })}
          reportUrl={reportUrls?.failures}
          downloadLabel={formatMessage({ id: 'csvImport.downloadFailures' })}
        />
      </Box>

      {reportUrls && (
        <Typography variant="caption" color="text.secondary">
          <FormattedMessage
            id="csvImport.postImportInfo"
            defaultMessage="A copy of this summary has been sent to your notifications, and by email if you enabled it in your {settingsLink}. Report download links expire after 7 days."
            values={{
              settingsLink: (
                <Link
                  component={AppLink}
                  to="/ui/account"
                  openInNewTabDesktop
                  variant="caption">
                  {formatMessage({
                    id: 'csvImport.notificationSettingsLink',
                    defaultMessage: 'notification settings'
                  })}
                </Link>
              )
            }}
          />
        </Typography>
      )}
    </Box>
  );
};

ImportResultRecap.propTypes = {
  progress: PropTypes.shape({
    totalRows: PropTypes.number,
    processedRows: PropTypes.number,
    successes: PropTypes.number,
    duplicates: PropTypes.number,
    failures: PropTypes.number
  }).isRequired,
  status: PropTypes.string.isRequired,
  reportUrls: PropTypes.shape({
    success: PropTypes.string,
    duplicates: PropTypes.string,
    failures: PropTypes.string
  })
};

export default ImportResultRecap;
