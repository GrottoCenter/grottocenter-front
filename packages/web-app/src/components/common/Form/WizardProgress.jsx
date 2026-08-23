import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  LinearProgress,
  Step,
  StepLabel,
  Stepper,
  Typography
} from '@mui/material';

import { useIsDesktopLayout } from '@/hooks/useIsDesktopLayout';

const WizardProgress = ({ activeStep, steps, sx = undefined }) => {
  const { formatMessage } = useIntl();
  const isDesktop = useIsDesktopLayout();
  const currentStep = steps[activeStep];

  if (!currentStep) return null;

  const currentStepNumber = activeStep + 1;
  const progressLabel = formatMessage(
    { id: 'Step {current} of {total}' },
    { current: currentStepNumber, total: steps.length }
  );

  return (
    <Box sx={sx}>
      {isDesktop ? (
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            width: '100%',
            '& .MuiStep-root': { minWidth: 0 },
            '& .MuiStepLabel-label': { overflowWrap: 'anywhere' }
          }}>
          {steps.map((step, index) => (
            <Step
              aria-current={index === activeStep ? 'step' : undefined}
              key={step.id}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      ) : (
        <Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 1,
              mb: 0.75,
              minWidth: 0
            }}>
            <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
              {currentStep.label}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ flexShrink: 0 }}>
              {progressLabel}
            </Typography>
          </Box>
          <LinearProgress
            aria-label={progressLabel}
            variant="determinate"
            value={(currentStepNumber / steps.length) * 100}
          />
        </Box>
      )}
    </Box>
  );
};

WizardProgress.propTypes = {
  activeStep: PropTypes.number.isRequired,
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      label: PropTypes.node.isRequired
    })
  ).isRequired,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.bool, PropTypes.func, PropTypes.object])
    ),
    PropTypes.func,
    PropTypes.object
  ])
};

export default WizardProgress;
