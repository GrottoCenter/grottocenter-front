import React from 'react';
import PropTypes from 'prop-types';
import { includes } from 'ramda';
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
    variant="contained"
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
  completedSteps,
  handleStepBack,
  handleStepNext,
  isNextStepButtonDisabled
}) => (
  <>
    <MuiStepper activeStep={currentFormStepId.id - 1} alternativeLabel>
      {formSteps.map(step => (
        <Step
          key={step.id}
          active={step.id === currentFormStepId}
          completed={includes(step.id, completedSteps)}>
          <StepLabel>
            <Translate>{step.name}</Translate>
          </StepLabel>
        </Step>
      ))}
    </MuiStepper>

    <ChangeStepWrapper>
      <PreviousStepButton
        disabled={currentFormStepId === 1}
        onClick={handleStepBack}
      />
      <NextStepButton
        disabled={isNextStepButtonDisabled}
        onClick={handleStepNext}
        style={{ float: 'right' }}
      />
    </ChangeStepWrapper>
  </>
);

Stepper.propTypes = {
  currentFormStepId: PropTypes.number.isRequired,
  formSteps: PropTypes.arrayOf(idNameType).isRequired,
  completedSteps: PropTypes.arrayOf(PropTypes.number).isRequired,
  handleStepBack: PropTypes.func.isRequired,
  handleStepNext: PropTypes.func.isRequired,
  isNextStepButtonDisabled: PropTypes.bool.isRequired
};

export default Stepper;
