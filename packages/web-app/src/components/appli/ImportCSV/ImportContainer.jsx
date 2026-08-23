import { useContext, useEffect, useCallback, useMemo } from 'react';
import { includes } from 'ramda';
import { Box, Button, Divider, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import PublishIcon from '@mui/icons-material/Publish';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import WizardProgress from '@/components/common/Form/WizardProgress';

import ImportTabs from './ImportTabs';
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

const StyledLinearProgress = styled(LinearProgress, {
  shouldForwardProp: prop => !prop.startsWith('$')
})(({ $isLoading }) => ({
  visibility: $isLoading ? 'visible' : 'hidden'
}));

const StyledDivider = styled(Divider)`
  margin: ${({ theme }) => theme.spacing(2)};
`;

const ImportContainer = () => {
  const {
    isTrue: isNextStepDisabled,
    true: enableNextStep,
    false: disableNextStep
  } = useBoolean(true);
  const {
    currentStep: currentFormStep,
    validatedSteps,
    updateCurrentStep,
    selectedType,
    importAttributes: { formSteps },
    importSession
  } = useContext(ImportPageContentContext);
  const { isLoading } = importSession;

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
  const progressSteps = useMemo(
    () =>
      formSteps.map(step => ({
        id: step.id,
        label: <Translate>{step.name}</Translate>
      })),
    [formSteps]
  );
  const activeStep = formSteps.findIndex(step => step.id === currentFormStep);

  return (
    <FixedContent
      title={<Translate>{title}</Translate>}
      icon={<PublishIcon fontSize="large" color="secondary" />}
      content={
        <>
          <ImportTabs />
          <StyledLinearProgress $isLoading={isLoading} />
          <div style={isLoading ? { opacity: '0.6' } : {}}>
            <WizardProgress activeStep={activeStep} steps={progressSteps} />
            {(showBackButton || showNextButton) && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 1,
                  mt: 1,
                  width: '100%'
                }}>
                {showBackButton && (
                  <Button
                    disabled={currentFormStep === STEP_GENERAL}
                    onClick={handleStepBack}
                    variant="outlined"
                    color="primary"
                    startIcon={<NavigateBeforeIcon />}>
                    <Translate>Back</Translate>
                  </Button>
                )}
                {showNextButton && (
                  <Button
                    disabled={isNextStepDisabled}
                    onClick={handleStepNext}
                    variant="contained"
                    color="primary"
                    endIcon={<NavigateNextIcon />}
                    sx={{ ml: 'auto' }}>
                    <Translate>Next</Translate>
                  </Button>
                )}
              </Box>
            )}
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
