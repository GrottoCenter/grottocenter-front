import React, { useContext, useEffect } from 'react';
import { isMobileOnly } from 'react-device-detect';
import styled from 'styled-components';
import {
  Button,
  Divider,
  FormControl,
  LinearProgress as MuiLinearProgress,
  Typography
} from '@material-ui/core';
import { includes } from 'ramda';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';

import { DocumentFormContext } from './Provider';
import { DocumentFormTypes } from './types';

import { bbsLink, wikiBBSLinks } from '../../../../conf/Config';
import Translate from '../../../common/Translate';
import InternationalizedLink from '../../../common/InternationalizedLink';
import Stepper from '../../../common/Form/Stepper';

import FormBody from './FormBody';

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

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledDivider = styled(Divider)`
  margin: ${({ theme }) => theme.spacing(3)}px 0;
`;

const SubmitButton = styled(Button)`
  display: block;
  margin: auto;
`;

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const BbsHeader = styled.div`
  display: flex;
  align-items: center;
`;

const BbsIcon = styled.img`
  height: 60px;
  width: 60px;
`;

const BbsInfoText = styled(Typography)`
  flex: 1;
  font-style: italic;
  margin-bottom: 0;
  margin-left: ${({ theme }) => theme.spacing(3)}px;
`;

const DocumentForm = ({ isLoading, onSubmit, onUpdate }) => {
  const {
    docAttributes,
    isFormValid,
    currentStep: currentFormStep,
    validatedSteps,
    updateCurrentStep,
    docAttributes: { formSteps, isNewDocument }
  } = useContext(DocumentFormContext);
  const [isNextStepDisabled, setIsNextStepDisabled] = React.useState(true);

  const handleSubmit = event => {
    event.preventDefault();
    onSubmit(docAttributes);
  };

  const handleUpdate = event => {
    event.preventDefault();
    onUpdate(docAttributes);
  };

  useEffect(() => {
    setIsNextStepDisabled(
      currentFormStep === formSteps.length ||
        !includes(currentFormStep, validatedSteps)
    );
  }, [validatedSteps, currentFormStep, formSteps, setIsNextStepDisabled]);

  const handleStepNext = () => {
    updateCurrentStep(prevFormStep => prevFormStep + 1);
  };

  const handleStepBack = () => {
    updateCurrentStep(prevFormStep => prevFormStep - 1);
  };

  return (
    <>
      <BbsHeader>
        <BbsIcon src="/images/bbs_logo.png" alt="BBS logo" />
        <BbsInfoText variant="body1" paragraph>
          <Translate>
            The BBS is now directly integrated in Grottocenter and provides a
            summary of any document published on paper or online.
          </Translate>
          <br />
          <InternationalizedLink links={wikiBBSLinks}>
            <Translate>
              You can find more info about the BBS on the dedicated
              Grottocenter-wiki page.
            </Translate>
          </InternationalizedLink>
          <br />
          <InternationalizedLink links={bbsLink}>
            <Translate>Or directly on the BBS website.</Translate>
          </InternationalizedLink>
        </BbsInfoText>
      </BbsHeader>

      <hr />

      <LinearProgress $isLoading={isLoading} />

      <div style={isLoading ? { opacity: '0.6' } : {}}>
        <Stepper
          currentFormStepId={currentFormStep}
          completedSteps={validatedSteps}
          formSteps={formSteps}
          isNextStepButtonDisabled={isNextStepDisabled}
          handleStepBack={handleStepBack}
          handleStepNext={handleStepNext}
        />

        <StyledDivider />

        <FormWrapper onSubmit={isNewDocument ? handleSubmit : handleUpdate}>
          <FormBody formSteps={formSteps} currentFormStepId={currentFormStep} />

          {isMobileOnly && (
            <ChangeStepWrapper>
              <PreviousStepButton
                disabled={currentFormStep === 1}
                onClick={handleStepBack}
              />
              <NextStepButton
                disabled={isNextStepDisabled}
                onClick={handleStepNext}
                style={{ float: 'right' }}
              />
            </ChangeStepWrapper>
          )}

          {currentFormStep === formSteps.length && (
            <FormControl>
              <SubmitButton
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={!isFormValid}>
                {isNewDocument ? (
                  <Translate>Submit</Translate>
                ) : (
                  <Translate>Update</Translate>
                )}
              </SubmitButton>
            </FormControl>
          )}
        </FormWrapper>
      </div>
    </>
  );
};

DocumentForm.propTypes = {
  ...DocumentFormTypes
};

export default DocumentForm;
