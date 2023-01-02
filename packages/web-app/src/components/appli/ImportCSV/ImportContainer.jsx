import React, { useContext, useEffect, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import { includes } from 'ramda';
import {
  Card,
  CardContent,
  Divider,
  Typography,
  LinearProgress as MuiLinearProgress
} from '@mui/material';
import { useSelector } from 'react-redux';
import ImportTabs from './ImportTabs';
import Stepper from '../../common/Form/Stepper';
import Provider, { ImportPageContentContext } from './Provider';
import ImportPageContent from './ImportPageContent';
import Translate from '../../common/Translate';
import { useBoolean } from '../../../hooks';
import { ENTRANCE, DOCUMENT } from './constants';

const PREFIX = 'HydratedImportContainer';

const classes = {
  root: `${PREFIX}-root`,
  stepper: `${PREFIX}-stepper`
};

const StyledProvider = styled(Provider)({
  [`& .${classes.root}`]: {
    minWidth: 275
  },

  [`& .${classes.stepper}`]: {
    margin: '0 0 1rem 0'
  }
});

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const StyledDivider = styled(Divider)`
  margin: ${({ theme }) => theme.spacing(3)};
`;

const ImportContainer = () => {
  const {
    isTrue: isNextStepDisabled,
    true: enableNextStep,
    false: disableNextStep
  } = useBoolean(true);
  const { isLoading } = useSelector(state => state.importCsv);

  const {
    currentStep: currentFormStep,
    validatedSteps,
    updateCurrentStep,
    selectedType,
    importAttributes: { formSteps }
  } = useContext(ImportPageContentContext);

  const handleStepNext = useCallback(() => {
    updateCurrentStep(prevFormStep => prevFormStep + 1);
  }, [updateCurrentStep]);

  const handleStepBack = useCallback(() => {
    updateCurrentStep(prevFormStep => prevFormStep - 1);
  }, [updateCurrentStep]);

  useEffect(() => {
    if (
      currentFormStep === formSteps.length ||
      !includes(currentFormStep, validatedSteps)
    ) {
      enableNextStep();
    } else {
      disableNextStep();
    }
  }, [
    validatedSteps,
    currentFormStep,
    formSteps,
    enableNextStep,
    disableNextStep
  ]);
  let title = '';
  switch (selectedType) {
    case ENTRANCE:
      title = 'Entrances import';
      break;
    case DOCUMENT:
      title = 'Documents import';
      break;
    default:
      break;
  }

  return (
    <>
      <ImportTabs />
      <Card className={classes.root}>
        <CardContent>
          <Typography color="secondary" variant="h1">
            <Translate>{title}</Translate>
          </Typography>
          <LinearProgress $isLoading={isLoading} />

          <div style={isLoading ? { opacity: '0.6' } : {}}>
            <Stepper
              className={classes.stepper}
              currentFormStepId={currentFormStep}
              completedSteps={validatedSteps}
              formSteps={formSteps}
              isNextStepButtonDisabled={isNextStepDisabled}
              handleStepBack={handleStepBack}
              handleStepNext={handleStepNext}
            />
            <StyledDivider />
            <ImportPageContent currentFormStepId={currentFormStep} />
          </div>
        </CardContent>
      </Card>
    </>
  );
};
const HydratedImportContainer = () => (
  <StyledProvider>
    <ImportContainer />
  </StyledProvider>
);

HydratedImportContainer.propTypes = {};

export default HydratedImportContainer;
