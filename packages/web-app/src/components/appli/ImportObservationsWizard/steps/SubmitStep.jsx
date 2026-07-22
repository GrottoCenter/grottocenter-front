import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';

import { submitObservationsImport } from '../../../../actions/Observations/importWizard';
import { exportProfile, deriveProfileFileName } from '../utils/profileManager';

// ===== SubmitStep component =====

const SubmitStep = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const file = useSelector(state => state.importWizard.file);
  const context = useSelector(state => state.importWizard.context);
  const sensorConfigs = useSelector(state => state.importWizard.sensorConfigs);
  const validationResult = useSelector(
    state => state.importWizard.validationResult
  );
  const submission = useSelector(state => state.importWizard.submission);
  const importWizardState = useSelector(state => state.importWizard);

  // Track whether a submission was initiated during this mount
  const submittedRef = useRef(false);

  // Redirect on success — only if the submission happened during this mount
  useEffect(() => {
    if (
      submittedRef.current &&
      submission.status === 'SUCCEEDED' &&
      submission.documentId
    ) {
      navigate(`/ui/documents/${submission.documentId}`, { replace: true });
    }
  }, [submission.status, submission.documentId, navigate]);

  // ===== Handlers =====

  const handleSubmit = () => {
    submittedRef.current = true;
    const profileJson = exportProfile(importWizardState);
    dispatch(submitObservationsImport(file, profileJson));
  };

  const handleExportProfile = () => {
    const profileJson = exportProfile(importWizardState);
    const fileName = deriveProfileFileName(context.pointLabel || '');
    const blob = new Blob([JSON.stringify(profileJson, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  // ===== Derived values =====

  const isLoading = submission.status === 'LOADING';
  const isFailed = submission.status === 'FAILED';

  const fileName = file
    ? file.name
    : formatMessage({
        id: 'ImportObservationsWizard.SubmitStep.noFile'
      });

  const validRowCount =
    validationResult && validationResult.validRows !== undefined
      ? validationResult.validRows
      : null;

  const errorDetails =
    isFailed && submission.error?.details?.length > 0
      ? submission.error.details
      : [];

  // ===== Render =====

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      data-testid="submit-step">
      {/* Summary section */}
      <Box>
        <Typography variant="h6" gutterBottom>
          {formatMessage({
            id: 'ImportObservationsWizard.SubmitStep.summaryTitle'
          })}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            pl: 0.5
          }}>
          {/* File name */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 160 }}>
              {formatMessage({
                id: 'ImportObservationsWizard.SubmitStep.summary.fileName'
              })}
            </Typography>
            <Typography variant="body2" data-testid="summary-file-name">
              {fileName}
            </Typography>
          </Box>

          {/* Cave ID */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 160 }}>
              {formatMessage({
                id: 'ImportObservationsWizard.SubmitStep.summary.caveId'
              })}
            </Typography>
            <Typography variant="body2" data-testid="summary-cave-id">
              {context.caveId !== null && context.caveId !== undefined
                ? context.caveId
                : formatMessage({
                    id: 'ImportObservationsWizard.SubmitStep.notSet'
                  })}
            </Typography>
          </Box>

          {/* Point label */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 160 }}>
              {formatMessage({
                id: 'ImportObservationsWizard.SubmitStep.summary.pointLabel'
              })}
            </Typography>
            <Typography variant="body2" data-testid="summary-point-label">
              {context.pointLabel ||
                formatMessage({
                  id: 'ImportObservationsWizard.SubmitStep.notSet'
                })}
            </Typography>
          </Box>

          {/* Sensor configs count */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ minWidth: 160 }}>
              {formatMessage({
                id: 'ImportObservationsWizard.SubmitStep.summary.sensorConfigs'
              })}
            </Typography>
            <Typography variant="body2" data-testid="summary-sensor-configs">
              {sensorConfigs.length}
            </Typography>
          </Box>

          {/* Valid row count */}
          {validRowCount !== null && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ minWidth: 160 }}>
                {formatMessage({
                  id: 'ImportObservationsWizard.SubmitStep.summary.validRows'
                })}
              </Typography>
              <Typography variant="body2" data-testid="summary-valid-rows">
                {validRowCount}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
      <Divider />
      {/* Error display — inline message and details */}
      {isFailed && submission.error && (
        <Alert severity="error" data-testid="submit-error-details">
          {(() => {
            const translatedMessage = submission.error.code
              ? formatMessage({
                  id: submission.error.code,
                  defaultMessage: submission.error.message
                })
              : null;
            const rawMessage = submission.error.message;
            const showRaw = rawMessage && rawMessage !== translatedMessage;

            return (
              <>
                {translatedMessage && (
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    sx={{ mb: showRaw || errorDetails.length > 0 ? 0.5 : 0.25 }}>
                    {translatedMessage}
                  </Typography>
                )}
                {showRaw && (
                  <Typography variant="body2" sx={{ mb: errorDetails.length > 0 ? 0.5 : 0.25 }}>
                    {rawMessage}
                  </Typography>
                )}
              </>
            );
          })()}
          {errorDetails.length > 0 && (
            <List dense disablePadding>
              {/* Error details have no stable unique ID — field may repeat */}
              {/* eslint-disable-next-line react/no-array-index-key */}
              {errorDetails.map((detail, index) => (
                <ListItem key={detail.field ? `${detail.field}-${index}` : index} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText
                    primary={
                      detail.field
                        ? `${detail.field}: ${detail.message || detail.value}`
                        : detail.message || detail.value
                    }
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {!submission.error.message && !submission.error.code && errorDetails.length === 0 && (
            <Typography variant="body2">
              {formatMessage({
                id: 'ImportObservationsWizard.SubmitStep.unknownError'
              })}
            </Typography>
          )}
          {submission.error.referenceId && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.5, display: 'block' }}>
              {formatMessage(
                { id: 'ImportObservationsWizard.SubmitStep.referenceId' },
                { id: submission.error.referenceId }
              )}
            </Typography>
          )}
        </Alert>
      )}
      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={isLoading}
          onClick={handleSubmit}
          startIcon={
            isLoading ? (
              <CircularProgress
                size={18}
                color="inherit"
                data-testid="submit-spinner"
              />
            ) : (
              <SendIcon />
            )
          }
          data-testid="submit-button">
          {isLoading
            ? formatMessage({
                id: 'ImportObservationsWizard.SubmitStep.submitting'
              })
            : formatMessage({
                id: 'ImportObservationsWizard.SubmitStep.submit'
              })}
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExportProfile}
          data-testid="export-profile-button">
          {formatMessage({
            id: 'ImportObservationsWizard.SubmitStep.exportProfile'
          })}
        </Button>
      </Box>
    </Box>
  );
};

export default SubmitStep;
