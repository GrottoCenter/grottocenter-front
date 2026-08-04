import React, { useContext, useEffect, useCallback } from 'react';
import { includes } from 'ramda';
import { Divider, LinearProgress as MuiLinearProgress } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { styled } from '@mui/material/styles';
import PublishIcon from '@mui/icons-material/Publish';
import { useSelector } from 'react-redux';
import ImportTabs from './ImportTabs';
import Stepper from '../../common/Form/Stepper';
import Provider, { ImportPageContentContext } from './Provider';
import ImportPageContent from './ImportPageContent';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import Translate from '../../common/Translate';
import { useBoolean } from '../../../hooks';
import {
  ENTRANCE,
  DOCUMENT,
  STEP_GENERAL,
  STEP_CONFIRM,
  STEP_IMPORT
} from './constants';

const useStyles = makeStyles({
  stepper: {
    margin: '0 0 0.625rem 0'
  }
});

const LinearProgress = styled(MuiLinearProgress, {
  shouldForwardProp: prop => !prop.startsWith('$')
})(({ $isLoading }) => ({
  visibility: $isLoading ? 'visible' : 'hidden'
}));

const StyledDivider = styled(Divider)`
  margin: ${({ theme }) => theme.spacing(2)};
`;

const ImportContainer = () => {
  const classes = useStyles();
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

  // Steps 1–3 navigate with the generic Next; the Confirm step (4) moves
  // forward only through its own "Import" button (which advances to step 5
  // once the submission is accepted), and the Import/result step (5) is
  // terminal — no Back (it must not re-run the dry-run or undo an import) and
  // no Next. The result step offers its own "New import" reset instead.
  const showNextButton = currentFormStep < STEP_CONFIRM;
  const showBackButton =
    currentFormStep !== STEP_GENERAL && currentFormStep !== STEP_IMPORT;

  return (
    <FixedContent
      title={<Translate>{title}</Translate>}
      icon={<PublishIcon fontSize="large" color="secondary" />}
      content={
        <>
          <ImportTabs />
          <LinearProgress $isLoading={isLoading} />
          <div style={isLoading ? { opacity: '0.6' } : {}}>
            <Stepper
              className={classes.stepper}
              currentFormStepId={currentFormStep}
              formSteps={formSteps}
              isNextStepButtonDisabled={isNextStepDisabled}
              handleStepBack={handleStepBack}
              handleStepNext={handleStepNext}
              showBackButton={showBackButton}
              showNextButton={showNextButton}
            />
            <StyledDivider />
            <ImportPageContent currentFormStepId={currentFormStep} />
          </div>
        </>
      }
    />
  );
};
const HydratedImportContainer = () => (
  <Provider>
    <ImportContainer />
  </Provider>
);

HydratedImportContainer.propTypes = {};

export default HydratedImportContainer;
