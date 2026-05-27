import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Fade,
  FilledInput,
  FormControl,
  InputLabel,
  Step,
  StepLabel,
  Stepper,
  Typography
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNotification } from '../../../hooks';
import { postMfaEnroll, postMfaVerify, clearMfaState } from '../../../actions/Mfa';

// ─── Step 1: Install authenticator ───────────────────────────────────────────

const StepInstall = ({ onContinue, isLoading, error }) => {
  const { formatMessage } = useIntl();
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="body1">
        {formatMessage({ id: 'mfaEnrollmentStep1Body' })}
      </Typography>
      {error && (
        <Alert severity="error">
          {formatMessage({ id: 'An error occurred. Please try again.' })}
        </Alert>
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

const StepScanQr = ({ otpauthUri, secret, onContinue }) => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    onSuccess(formatMessage({ id: 'mfaCopySecret' }));
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
        <Typography variant="caption" color="text.secondary">
          {formatMessage({ id: 'mfaSecretLabel' })}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
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
        <Button
          size="small"
          startIcon={<ContentCopyIcon fontSize="small" />}
          onClick={handleCopySecret}
          sx={{ flexShrink: 0 }}>
          {formatMessage({ id: 'mfaCopySecret' })}
        </Button>
      </Box>
      <Box display="flex" justifyContent="flex-end" width="100%">
        <Button variant="contained" onClick={onContinue}>
          {formatMessage({ id: "I've scanned the code" })}
        </Button>
      </Box>
    </Box>
  );
};

StepScanQr.propTypes = {
  otpauthUri: PropTypes.string.isRequired,
  secret: PropTypes.string.isRequired,
  onContinue: PropTypes.func.isRequired
};

// ─── Step 3: Verify code ──────────────────────────────────────────────────────

const StepVerify = ({ onSubmit, isLoading, error, isEnrollmentTokenExpired, onBackToLogin }) => {
  const { formatMessage } = useIntl();
  const [code, setCode] = React.useState('');

  const handleChange = event => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    if (value.length === 6) {
      onSubmit(value);
    }
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
          <Alert
            severity={isEnrollmentTokenExpired ? 'warning' : 'error'}
            action={
              isEnrollmentTokenExpired ? (
                <Button color="inherit" size="small" onClick={onBackToLogin}>
                  {formatMessage({ id: 'mfaEnrollmentTokenExpiredAction' })}
                </Button>
              ) : null
            }>
            {msg}
          </Alert>
        </Fade>
      )}
    </Box>
  );
};

StepVerify.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  isEnrollmentTokenExpired: PropTypes.bool,
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
    />,
    <StepVerify
      key="verify"
      onSubmit={handleVerifySubmit}
      isLoading={verify.isLoading}
      error={verify.error}
      isEnrollmentTokenExpired={verify.isEnrollmentTokenExpired}
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
