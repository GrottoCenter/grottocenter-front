import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import {
  Button as MuiButton,
  Step,
  StepContent,
  StepLabel,
  Stepper
} from '@material-ui/core';
import Icon from '@material-ui/core/Icon';
import styled from 'styled-components';
import { keys, prop, length } from 'ramda';
import Descriptions from './Description';
import Position from './Position';
import Details from './Details';

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const ButtonWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const defaultValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  language: 'fra'
};

export const EntryForm = ({ isNew = true, allLanguages }) => {
  const { formatMessage } = useIntl();
  const {
    handleSubmit,
    reset,
    control,
    trigger,
    formState: { errors }
  } = useForm({ defaultValues });
  const [activeStep, setActiveStep] = useState(0);
  const [isExpanded, setExpanded] = useState(false);

  const handleNext = async () => {
    const result = await trigger(
      [
        'name',
        'language',
        'descriptionTitle',
        'description',
        'longitude',
        'latitude',
        'depth',
        'length',
        'temperature'
      ],
      { shouldFocus: true }
    );
    if (result) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };

  const handleExpand = () => {
    setExpanded(prev => !prev);
  };
  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const onSubmit = data => {
    console.log(data);
  };
  const handleReset = () => {
    reset(defaultValues);
  };

  const steps = {
    descriptions: (
      <Descriptions
        control={control}
        allLanguages={allLanguages}
        errors={errors}
      />
    ),
    position: <Position control={control} errors={errors} />,
    details: <Details control={control} errors={errors} />
  };
  const stepKeys = keys(steps);

  return (
    <FormWrapper autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {stepKeys.map(label => (
          <Step key={formatMessage({ id: label })} expanded={isExpanded}>
            <StepLabel>{formatMessage({ id: label })}</StepLabel>
            <StepContent>
              {prop(label, steps)}
              <ButtonWrapper>
                <Button disabled={activeStep === 0} onClick={handleBack}>
                  {formatMessage({ id: 'back' })}
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleNext}>
                  {formatMessage({
                    id: activeStep === length(stepKeys) - 1 ? 'Finish' : 'Next'
                  })}
                </Button>
              </ButtonWrapper>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      <div>
        <Button onClick={handleExpand}>
          {formatMessage({ id: isExpanded ? 'hide all' : 'expand all' })}
        </Button>
        <Button onClick={handleReset}>{formatMessage({ id: 'Reset' })}</Button>
        <Button type="submit" endIcon={<Icon>send</Icon>} color="primary">
          {formatMessage({ id: 'Create' })}
        </Button>
      </div>
    </FormWrapper>
  );
};

EntryForm.propTypes = {
  isNew: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  )
};

export default EntryForm;
