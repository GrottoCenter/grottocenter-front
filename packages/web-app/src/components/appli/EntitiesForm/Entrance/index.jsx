import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { isNil, keys, prop, length, reject, equals } from 'ramda';
import {
  Box,
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
import { postCaveAndEntrance } from '../../../../actions/CaveAndEntrance';
import Translate from '../../../common/Translate';

import Cave from './Cave';
import Entrance from './Entrance';
import Details from './Details';
import { makeCaveData, makeEntranceData } from './transformers';

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const defaultCaveValues = {
  language: 'fra',
  name: '',
  latitude: undefined,
  longitude: undefined,
  descriptions: undefined,
  isDiving: undefined,
  depth: null,
  length: null,
  temperature: null,
  massif: undefined,
  country: 'FR'
};

const defaultEntranceValues = {
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
  const { error: entranceError } = useSelector(state => state.entrancePost);
  const { error: caveError } = useSelector(state => state.cavePost);
  const dispatch = useDispatch();
  const [creationType, setCreationType] = useState('cave');
  const {
    handleSubmit,
    reset,
    control,
    getValues,
    trigger,
    setFocus,
    formState: { errors, isDirty, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues:
      entranceValues ||
      (creationType === 'cave'
        ? { ...defaultCaveValues }
        : { ...defaultEntranceValues } && {
            latitude,
            longitude
          })
  });

  const [activeStep, setActiveStep] = useState(0);
  const hasFinish = useBoolean();
  const stepExpanded = useBoolean();

  // TODO set latitude & longitude from the selected Entry
  // TODO set country from position
  useEffect(() => {
    if (isNil(entranceValues?.latitude) || isNil(entranceValues?.longitude)) {
      reset({ ...getValues(), latitude, longitude });
    }
  }, [entranceValues, getValues, latitude, longitude, reset]);

  const handleUpdateCreationType = type => {
    setCreationType(type);
    reset({ ...getValues(), latitude, longitude });
  };

  const handleReset = useCallback(() => {
    reset(defaultEntranceValues);
    stepExpanded.close();
    setActiveStep(0);
  }, [reset, stepExpanded]);

  const steps = {
    cave: (
      <Cave
        control={control}
        errors={errors}
        creationType={creationType}
        updateCreationType={handleUpdateCreationType}
        allLanguages={allLanguages}
        reset={handleReset}
      />
    ),
    entrance: (
      <Entrance
        control={control}
        allLanguages={allLanguages}
        errors={errors}
        setFocus={setFocus}
        creationType={creationType}
      />
    ),
    details: <Details control={control} errors={errors} />
  };
  const stepKeys =
    creationType === 'cave'
      ? keys(steps)
      : reject(equals('details'), keys(steps));

  const handleNext = async () => {
    const result = await trigger(
      [
        'name',
        'language',
        'descriptions',
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
    if (creationType === 'cave') {
      dispatch(postCaveAndEntrance(makeCaveData(data), makeEntranceData(data)));
    } else {
      dispatch(postEntrance(makeEntranceData(data)));
    }
  };

  return isSubmitSuccessful && isNil(entranceError) && isNil(caveError) ? (
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
                <Box display="flex" justifyContent="center">
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
                </Box>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
      <Box display="flex">
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
      </Box>
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
