import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { isNil, keys, prop, length } from 'ramda';
import {
  Button as MuiButton,
  Step,
  StepContent,
  StepLabel,
  Stepper
} from '@material-ui/core';
import Icon from '@material-ui/core/Icon';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import useGeolocation from 'react-hook-geolocation';

import { useBoolean } from '../../../../hooks';
import ActionButton from '../../../common/ActionButton';
import { postEntrance } from '../../../../actions/Entry';
import Translate from '../../../common/Translate';

import Cave from './Cave';
import Entrance from './Entrance';
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

const GlobalButtonWrapper = styled.div`
  display: flex;
`;

const defaultValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  language: 'fra',
  caveId: null,
  caveName: null,
  country: 'FR'
};

export const EntranceForm = ({ entranceValues = null }) => {
  const { latitude, longitude } = useGeolocation();
  const { formatMessage } = useIntl();
  const { languages: allLanguages } = useSelector(state => state.language);
  const { error } = useSelector(state => state.entrancePost);
  const dispatch = useDispatch();
  const {
    handleSubmit,
    reset,
    control,
    getValues,
    trigger,
    setFocus,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: entranceValues || { ...defaultValues, latitude, longitude }
  });

  // TODO set latitude & longitude from the selected Entry
  // TODO set country from position
  useEffect(() => {
    if (isNil(entranceValues?.latitude) || isNil(entranceValues?.longitude)) {
      reset({ ...getValues(), latitude, longitude });
    }
  }, [entranceValues, getValues, latitude, longitude, reset]);

  const [activeStep, setActiveStep] = useState(0);
  const hasFinish = useBoolean();
  const stepExpanded = useBoolean();

  const steps = {
    cave: <Cave control={control} errors={errors} />,
    entrance: (
      <Entrance
        control={control}
        allLanguages={allLanguages}
        errors={errors}
        setFocus={setFocus}
      />
    ),
    details: <Details control={control} errors={errors} />
  };
  const stepKeys = keys(steps);

  const handleReset = useCallback(() => {
    reset(defaultValues);
    stepExpanded.close();
    setActiveStep(0);
  }, [reset, stepExpanded]);

  const handleNext = async () => {
    const result = await trigger(
      [
        'name',
        'language',
        'caveId',
        'caveName',
        'longitude',
        'latitude',
        'country',
        'depth',
        'length',
        'temperature',
        'isDiving'
      ],
      { shouldFocus: true }
    );
    if (result) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
      if (stepKeys.length - 1 === activeStep) {
        stepExpanded.open();
        hasFinish.true();
      }
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const onSubmit = async data => {
    const transformedData = {
      name: {
        language: data.language,
        text: data.name
      },
      cave: data.caveId,
      country: data.country,
      depth: data.depth,
      isDiving: data.isDiving,
      length: data.length,
      longitude: data.longitude,
      latitude: data.latitude,
      temperature: data.temperature
    };
    return dispatch(postEntrance(transformedData));
  };

  return isSubmitSuccessful && isNil(error) ? (
    <FormWrapper>
      <Translate>New entrance successfully created!</Translate>
      <Button onClick={handleReset} color="primary">
        {formatMessage({ id: 'Create a new Entrance' })}
      </Button>
    </FormWrapper>
  ) : (
    <FormWrapper autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <Stepper activeStep={activeStep} orientation="vertical">
        {stepKeys.map(label => (
          <Step
            key={formatMessage({ id: label })}
            expanded={stepExpanded.isOpen}>
            <StepLabel>{formatMessage({ id: label })}</StepLabel>
            <StepContent>
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                {prop(label, steps)}
              </div>
              {!stepExpanded.isOpen && (
                <ButtonWrapper>
                  <Button disabled={activeStep === 0} onClick={handleBack}>
                    {formatMessage({ id: 'back' })}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}>
                    {formatMessage({
                      id:
                        activeStep === length(stepKeys) - 1 ? 'Review' : 'Next'
                    })}
                  </Button>
                </ButtonWrapper>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
      <GlobalButtonWrapper>
        <Button disabled={!isDirty} onClick={handleReset}>
          {formatMessage({ id: 'Reset' })}
        </Button>
        <ActionButton
          label={formatMessage({ id: 'Create' })}
          loading={isSubmitting}
          disabled={!hasFinish.isTrue}
          color="primary"
          icon={<Icon>send</Icon>}
          style={{ margin: '8px', marginLeft: 'auto' }}
          type="submit"
        />
      </GlobalButtonWrapper>
    </FormWrapper>
  );
};

EntranceForm.propTypes = {
  entranceValues: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    descriptionTitle: PropTypes.string,
    language: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number,
    isDiving: PropTypes.bool,
    depth: PropTypes.number,
    length: PropTypes.number
  })
};

export default EntranceForm;
