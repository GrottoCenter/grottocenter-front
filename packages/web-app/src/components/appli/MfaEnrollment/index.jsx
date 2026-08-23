import React from 'react';
import PropTypes from 'prop-types';
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
  Tooltip,
  Typography
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import WizardProgress from '@/components/common/Form/WizardProgress';

import Alert from '../../common/Alert';
import { useMfaEnroll, useMfaVerify, useNotification } from '../../../hooks';
import { normalizeOtp } from '../../../utils/otpHelpers';

// ─── Step 1: Install authenticator ───────────────────────────────────────────

const StepInstall = ({ onContinue, isLoading, error }) => {
  const { formatMessage } = useIntl();
  return (
    <Box display="flex" flexDirection="column" gap={2}>
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
              content={formatMessage({ id: 'genericError' })}
            />
          </div>
        </Fade>
      )}
      <Box display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          onClick={onContinue}
          disabled={isLoading}
          startIcon={
            isLoading ? <CircularProgress size={16} color="inherit" /> : null
          }>
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
    <Box display="flex" flexDirection="column" gap={2} alignItems="center">
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {formatMessage({ id: 'mfaEnrollmentStep2Body' })}
      </Typography>
      <Box
        sx={{
          p: 1,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'inline-flex'
        }}>
        <QRCodeSVG value={otpauthUri} size={180} />
      </Box>
      <Box sx={{ width: '100%' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block'
          }}>
          {formatMessage({ id: 'mfaSecretLabel' })}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            bgcolor: 'action.hover',
            borderRadius: 1,
            px: 1,
            py: 0.5
          }}>
          <Typography
            variant="caption"
            component="code"
            sx={{
              fontFamily: 'monospace',
              flexGrow: 1,
              wordBreak: 'break-all'
            }}>
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

const StepVerify = ({
  onSubmit,
  isLoading,
  error,
  isEnrollmentTokenExpired,
  onBack,
  onBackToLogin
}) => {
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
    <Box display="flex" flexDirection="column" gap={1}>
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
          <Button
            variant="text"
            size="small"
            onClick={onBack}
            disabled={isLoading}>
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
  const { formatMessage } = useIntl();
  const enrollMutation = useMfaEnroll();
  const verifyMutation = useMfaVerify();
  const [activeStep, setActiveStep] = React.useState(0);

  const handleInstallContinue = () => {
    enrollMutation.mutate(undefined, {
      onSuccess: () => setActiveStep(1)
    });
  };

  const handleScanContinue = () => {
    setActiveStep(2);
  };

  const handleStepBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleVerifySubmit = code => {
    verifyMutation.mutate(code);
  };

  const enrollData = enrollMutation.data;
  const verifyError = verifyMutation.error;

  const steps = [
    {
      id: 'install',
      label: formatMessage({ id: 'mfaEnrollmentStep1Title' })
    },
    {
      id: 'scan',
      label: formatMessage({ id: 'mfaEnrollmentStep2Title' })
    },
    {
      id: 'verify',
      label: formatMessage({ id: 'mfaEnrollmentStep3Title' })
    }
  ];

  const stepContent = [
    <StepInstall
      key="install"
      onContinue={handleInstallContinue}
      isLoading={enrollMutation.isPending}
      error={enrollMutation.error?.status ?? enrollMutation.error?.message}
    />,
    <StepScanQr
      key="scan"
      otpauthUri={enrollData?.otpauthUri ?? ''}
      secret={enrollData?.secret ?? ''}
      onContinue={handleScanContinue}
      onBack={handleStepBack}
    />,
    <StepVerify
      key="verify"
      onSubmit={handleVerifySubmit}
      isLoading={verifyMutation.isPending}
      error={verifyError?.body?.status ?? verifyError?.message}
      isEnrollmentTokenExpired={verifyError?.isEnrollmentTokenExpired ?? false}
      onBack={handleStepBack}
      onBackToLogin={onBack}
    />
  ];

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <WizardProgress activeStep={activeStep} steps={steps} />
      {stepContent[activeStep]}
    </Box>
  );
};

MfaEnrollment.propTypes = {
  onBack: PropTypes.func.isRequired
};

export default MfaEnrollment;
