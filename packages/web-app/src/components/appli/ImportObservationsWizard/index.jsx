import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Box, Button, Step, StepLabel, Stepper } from '@mui/material';

import {
  SET_WIZARD_STEP,
  RESET_WIZARD
} from '../../../actions/Observations/importWizard';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';

import UploadStep from './steps/UploadStep';
import DeviceSensorsStep from './steps/DeviceSensorsStep';
import MapColumnsStep from './steps/MapColumnsStep';
import ValidateStep from './steps/ValidateStep';
import ContextStep from './steps/ContextStep';
import SubmitStep from './steps/SubmitStep';

// ===== Navigation guard helpers =====

const isStep0NextDisabled = rawRows => rawRows.length === 0;

const isStep1NextDisabled = (
  confirmedDevice,
  sensorConfigs,
  sensorConfigsLoading
) =>
  confirmedDevice === null ||
  sensorConfigsLoading ||
  sensorConfigs.length === 0;

const isStep2NextDisabled = columnMappings => {
  if (columnMappings.length === 0) return true;

  // All columns must have a role
  const allHaveRole = columnMappings.every(
    m => m.role !== null && m.role !== undefined && m.role !== ''
  );
  if (!allHaveRole) return true;

  // At least one valid timestamp config must exist
  const timestampCols = columnMappings.filter(m => m.role === 'timestamp');
  const hasValidTimestamp = timestampCols.length > 0;
  if (!hasValidTimestamp) return true;

  // All measurement columns must have a sensorConfigurationId
  const measurementCols = columnMappings.filter(m => m.role === 'measurement');
  const allMeasurementsHaveSensor = measurementCols.every(
    m =>
      m.sensorConfigurationId !== null && m.sensorConfigurationId !== undefined
  );
  if (!allMeasurementsHaveSensor) return true;

  return false;
};

const isStep3NextDisabled = validationResult =>
  validationResult === null || validationResult.blockingErrors.length > 0;

const isStep4NextDisabled = context => {
  const {
    locationMode,
    pointLabel,
    caveId,
    licenseId,
    latitude,
    longitude,
    authorIds
  } = context;
  if (!licenseId) return true;
  if (!authorIds || authorIds.length === 0) return true;
  switch (locationMode) {
    case 'pointAndCave':
      return !pointLabel || !caveId;
    case 'pointOnly':
      return !pointLabel || latitude == null || longitude == null;
    case 'caveOnly':
      return !caveId;
    default:
      return true;
  }
};

// Step 5 (Submit) — Next is always disabled (last step)
const isStep5NextDisabled = () => true;

const getNextDisabled = (currentStep, wizardState) => {
  const {
    rawRows,
    confirmedDevice,
    sensorConfigs,
    sensorConfigsLoading,
    columnMappings,
    validationResult,
    context
  } = wizardState;
  switch (currentStep) {
    case 0:
      return isStep0NextDisabled(rawRows);
    case 1:
      return isStep1NextDisabled(
        confirmedDevice,
        sensorConfigs,
        sensorConfigsLoading
      );
    case 2:
      return isStep2NextDisabled(columnMappings);
    case 3:
      return isStep3NextDisabled(validationResult);
    case 4:
      return isStep4NextDisabled(context);
    case 5:
      return isStep5NextDisabled();
    default:
      return false;
  }
};

// ===== Step rendering =====

const STEP_COUNT = 6;

const renderStep = (step, initialCaveId, caveIdLocked) => {
  switch (step) {
    case 0:
      return <UploadStep />;
    case 1:
      return <DeviceSensorsStep />;
    case 2:
      return <MapColumnsStep />;
    case 3:
      return <ValidateStep />;
    case 4:
      return (
        <ContextStep
          initialCaveId={initialCaveId}
          caveIdLocked={caveIdLocked}
        />
      );
    case 5:
      return <SubmitStep />;
    default:
      return null;
  }
};

// ===== ImportObservationsWizard =====

const ImportObservationsWizard = ({ initialCaveId, caveIdLocked }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  // Reset wizard state on mount so re-entering starts fresh
  useEffect(() => {
    dispatch({ type: RESET_WIZARD });
  }, [dispatch]);

  const wizardState = useSelector(state => state.importWizard);
  const { currentStep } = wizardState;

  const stepLabels = [
    formatMessage({ id: 'ImportObservationsWizard.step.upload' }),
    formatMessage({ id: 'ImportObservationsWizard.step.deviceSensors' }),
    formatMessage({ id: 'ImportObservationsWizard.step.mapColumns' }),
    formatMessage({ id: 'ImportObservationsWizard.step.validate' }),
    formatMessage({ id: 'ImportObservationsWizard.step.context' }),
    formatMessage({ id: 'ImportObservationsWizard.step.submit' })
  ];

  const handleBack = () => {
    dispatch({ type: SET_WIZARD_STEP, step: currentStep - 1 });
  };

  const handleNext = () => {
    dispatch({ type: SET_WIZARD_STEP, step: currentStep + 1 });
  };

  const handleStartOver = () => {
    dispatch({ type: RESET_WIZARD });
  };

  const isBackDisabled = currentStep === 0;
  const isNextDisabled = getNextDisabled(currentStep, wizardState);

  return (
    <FixedContent
      title={formatMessage({ id: 'Import observations' })}
      icon={<EntityIcon iconType="scientific_observation" />}
      content={
        <>
          <Stepper activeStep={currentStep} sx={{ mb: 3 }}>
            {stepLabels.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mb: 3 }}>
            {renderStep(currentStep, initialCaveId, caveIdLocked)}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              data-testid="back-button"
              disabled={isBackDisabled}
              onClick={handleBack}
              variant="outlined">
              {formatMessage({ id: 'ImportObservationsWizard.back' })}
            </Button>

            <Button
              color="secondary"
              data-testid="start-over-button"
              onClick={handleStartOver}
              variant="outlined">
              {formatMessage({ id: 'ImportObservationsWizard.startOver' })}
            </Button>

            {currentStep < STEP_COUNT - 1 && (
              <Button
                data-testid="next-button"
                disabled={isNextDisabled}
                onClick={handleNext}
                variant="contained"
                sx={{ ml: 'auto' }}>
                {formatMessage({ id: 'ImportObservationsWizard.next' })}
              </Button>
            )}
          </Box>
        </>
      }
    />
  );
};

ImportObservationsWizard.propTypes = {
  initialCaveId: PropTypes.number,
  caveIdLocked: PropTypes.bool
};

export default ImportObservationsWizard;
