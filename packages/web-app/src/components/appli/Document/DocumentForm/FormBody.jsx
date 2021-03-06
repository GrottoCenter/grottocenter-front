import React from 'react';
import PropTypes from 'prop-types';

import Step1 from './formSteps/Step1';
import Step2 from './formSteps/Step2';
import Step3 from './formSteps/Step3';
import Step4 from './formSteps/Step4';

const FormBody = ({ currentFormStepId }) => {
  return (
    <>
      {currentFormStepId === 1 && <Step1 stepId={1} />}
      {currentFormStepId === 2 && <Step2 stepId={2} />}
      {currentFormStepId === 3 && <Step3 stepId={3} />}
      {currentFormStepId === 4 && <Step4 stepId={4} />}
    </>
  );
};

FormBody.propTypes = {
  currentFormStepId: PropTypes.number.isRequired
};

export default FormBody;
