import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  CircularProgress,
  Fade,
  FilledInput,
  FormControl,
  IconButton,
  InputLabel,
  Step,
  StepLabel,
  Stepper,
  Tooltip,
  Typography
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Alert from '../../common/Alert';
import { useNotification } from '../../../hooks';
import { postMfaEnroll, postMfaVerify, clearMfaState } from '../../../actions/Mfa';
import { normalizeOtp } from '../../../utils/otpHelpers';

// ─── Step 1: Install authenticator ───────────────────────────────────────────

const StepInstall = ({ onContinue, isLoading, error }) => {
  const { formatMessage } = useIntl();
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="body1">
        {formatMessage({ id: 'mfaEnrollmentStep1Body' })}
      </Typography>
      {error && (
        <Fade in>
          {/* div needed: custom Alert lacks forwardRef required by Fade */}
          <div>
            <Alert
              disableMargins
              severity="error"
              content={formatMessage({ id: 'An error occurred. Please try again.' })}
            />
          </div>
        </Fade>
      )}
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={onContinue}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}>
          {formatMessage({ id: 'Continue' })}
        </Button>
      </Box>
    </Box>
  );
};

StepInstall.propTypes = {
  onContinue: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

// ─── Step 2: Scan QR code ─────────────────────────────────────────────────────

const StepScanQr = ({ otpauthUri, secret, onContinue, onBack }) => {
  const { formatMessage } = useIntl();
  const { onSuccess, onError } = useNotification();

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret).then(
      () => onSuccess(formatMessage({ id: 'mfaCopySecret' })),
      () => onError(formatMessage({ id: 'mfaCopyFailed' }))
    );
  };

  return (
    <Box display="flex" flexDirection="column" gap={3} alignItems="center">
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {formatMessage({ id: 'mfaEnrollmentStep2Body' })}
      </Typography>
      <Box
        sx={{
          p: 2,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'inline-flex'
        }}>
        <QRCodeSVG value={otpauthUri} size={180} />
      </Box>
      <Box sx={{ width: '100%' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
          {formatMessage({ id: 'mfaSecretLabel' })}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'action.hover',
            borderRadius: 1,
            px: 2,
            py: 1
          }}>
          <Typography
            variant="caption"
            component="code"
            sx={{ fontFamily: 'monospace', flexGrow: 1, wordBreak: 'break-all' }}>
            {secret}
          </Typography>
          <Tooltip title={formatMessage({ id: 'mfaCopySecret' })}>
            <IconButton size="small" onClick={handleCopySecret}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" width="100%">
        <Button variant="text" onClick={onBack}>
          {formatMessage({ id: 'Back' })}
        </Button>
        <Button variant="contained" onClick={onContinue}>
          {formatMessage({ id: 'Continue' })}
        </Button>
      </Box>
    </Box>
  );
};

StepScanQr.propTypes = {
  otpauthUri: PropTypes.string.isRequired,
  secret: PropTypes.string.isRequired,
  onContinue: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired
};

// ─── Step 3: Verify code ──────────────────────────────────────────────────────

const StepVerify = ({ onSubmit, isLoading, error, isEnrollmentTokenExpired, onBack, onBackToLogin }) => {
  const { formatMessage } = useIntl();
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    if (error) setCode('');
  }, [error]);

  const handleChange = event => {
    const value = normalizeOtp(event.target.value);
    setCode(value);
    if (value.length === 6) onSubmit(value);
  };

  const handlePaste = event => {
    event.preventDefault();
    const value = normalizeOtp(event.clipboardData.getData('text'));
    setCode(value);
    if (value.length === 6) onSubmit(value);
  };

  const errorMessage = () => {
    if (isEnrollmentTokenExpired)
      return formatMessage({ id: 'mfaEnrollmentTokenExpired' });
    if (error === 'TotpAlreadyUsed')
      return formatMessage({ id: 'mfaAlreadyUsedCode' });
    if (error) return formatMessage({ id: 'mfaInvalidCode' });
    return null;
  };

  const msg = errorMessage();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="body2" color="text.secondary">
        {formatMessage({ id: 'mfaEnrollmentStep3Body' })}
      </Typography>
      <FormControl variant="filled">
        <InputLabel htmlFor="mfa-verify-input">
          {formatMessage({ id: 'mfaCodeLabel' })}
        </InputLabel>
        <FilledInput
          id="mfa-verify-input"
          value={code}
          onChange={handleChange}
          onPaste={handlePaste}
          inputProps={{
            inputMode: 'numeric',
            maxLength: 6,
            autoComplete: 'one-time-code',
            'aria-label': formatMessage({ id: 'mfaCodeLabel' })
          }}
          autoFocus
          disabled={isLoading}
          endAdornment={isLoading ? <CircularProgress size={20} /> : null}
        />
      </FormControl>
      {msg && (
        <Fade in>
          {/* div needed: custom Alert lacks forwardRef required by Fade */}
          <div>
            <Alert
              disableMargins
              severity={isEnrollmentTokenExpired ? 'warning' : 'error'}
              action={
                isEnrollmentTokenExpired ? (
                  <Button color="inherit" size="small" onClick={onBackToLogin}>
                    {formatMessage({ id: 'mfaEnrollmentTokenExpiredAction' })}
                  </Button>
                ) : null
              }
              content={msg}
            />
          </div>
        </Fade>
      )}
      {!isEnrollmentTokenExpired && (
        <Box>
          <Button variant="text" size="small" onClick={onBack} disabled={isLoading}>
            {formatMessage({ id: 'Back' })}
          </Button>
        </Box>
      )}
    </Box>
  );
};

StepVerify.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  isEnrollmentTokenExpired: PropTypes.bool,
  onBack: PropTypes.func.isRequired,
  onBackToLogin: PropTypes.func.isRequired
};

// ─── Wizard root ──────────────────────────────────────────────────────────────

const MfaEnrollment = ({ onBack }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { enroll, verify } = useSelector(state => state.mfa);
  const [activeStep, setActiveStep] = React.useState(0);

  useEffect(
    () => () => {
      dispatch(clearMfaState());
    },
    [dispatch]
  );

  const handleInstallContinue = () => {
    dispatch(postMfaEnroll()).then(success => {
      if (success) setActiveStep(1);
    });
  };

  const handleScanContinue = () => {
    setActiveStep(2);
  };

  const handleStepBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleVerifySubmit = code => {
    dispatch(postMfaVerify(code));
  };

  const steps = [
    formatMessage({ id: 'mfaEnrollmentStep1Title' }),
    formatMessage({ id: 'mfaEnrollmentStep2Title' }),
    formatMessage({ id: 'mfaEnrollmentStep3Title' })
  ];

  const stepContent = [
    <StepInstall
      key="install"
      onContinue={handleInstallContinue}
      isLoading={enroll.isLoading}
      error={enroll.error}
    />,
    <StepScanQr
      key="scan"
      otpauthUri={enroll.otpauthUri ?? ''}
      secret={enroll.secret ?? ''}
      onContinue={handleScanContinue}
      onBack={handleStepBack}
    />,
    <StepVerify
      key="verify"
      onSubmit={handleVerifySubmit}
      isLoading={verify.isLoading}
      error={verify.error}
      isEnrollmentTokenExpired={verify.isEnrollmentTokenExpired}
      onBack={handleStepBack}
      onBackToLogin={onBack}
    />
  ];

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {stepContent[activeStep]}
    </Box>
  );
};

MfaEnrollment.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default MfaEnrollment;
