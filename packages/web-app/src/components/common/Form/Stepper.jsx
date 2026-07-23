import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import {
  Button,
  FormControl,
  Step,
  StepLabel,
  Stepper as MuiStepper
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import Translate from '../Translate';
import idNameType from '../../../types/idName.type';

// ===================================
const NextStepButton = props => (
  <Button
    {...props}
    variant="contained"
    color="primary"
    endIcon={<NavigateNextIcon />}>
    <Translate>Next</Translate>
  </Button>
);

const PreviousStepButton = props => (
  <Button
    {...props}
    variant="outlined"
    color="primary"
    startIcon={<NavigateBeforeIcon />}>
    <Translate>Back</Translate>
  </Button>
);

const ChangeStepWrapper = styled(FormControl)`
  display: block;
`;

// ===================================

const Stepper = ({
  currentFormStepId,
  formSteps,
  handleStepBack,
  handleStepNext,
  isNextStepButtonDisabled,
  showBackButton = true,
  showNextButton = true
}) => (
  <>
    {/* Linear wizard: pass a 0-based activeStep and let MUI derive each step's
        active/completed state (and the connector fill) from it, exactly like
        the MFA enrollment stepper. Step ids are 1-based, hence the -1. */}
    <MuiStepper activeStep={currentFormStepId - 1} alternativeLabel>
      {formSteps.map(step => (
        <Step key={step.id}>
          <StepLabel>
            <Translate>{step.name}</Translate>
          </StepLabel>
        </Step>
      ))}
    </MuiStepper>

    <ChangeStepWrapper>
      {showBackButton && (
        <PreviousStepButton
          disabled={currentFormStepId === 1}
          onClick={handleStepBack}
        />
      )}
      {showNextButton && (
        <NextStepButton
          disabled={isNextStepButtonDisabled}
          onClick={handleStepNext}
          style={{ float: 'right' }}
        />
      )}
    </ChangeStepWrapper>
  </>
);

Stepper.propTypes = {
  currentFormStepId: PropTypes.number.isRequired,
  formSteps: PropTypes.arrayOf(idNameType).isRequired,
  handleStepBack: PropTypes.func.isRequired,
  handleStepNext: PropTypes.func.isRequired,
  isNextStepButtonDisabled: PropTypes.bool.isRequired,
  // Steps 4 (confirm) and 5 (import) drive their own actions instead of the
  // generic Next/Back, so the container can hide either button per step.
  showBackButton: PropTypes.bool,
  showNextButton: PropTypes.bool
};

export default Stepper;
