import React, { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { isNil, keys, prop, length, reject, equals } from 'ramda';
import {
  Box,
  Button as MuiButton,
  CircularProgress,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Typography
} from '@material-ui/core';
import Icon from '@material-ui/core/Icon';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useGeolocation } from 'rooks';

import { useBoolean } from '../../../../hooks';
import ActionButton from '../../../common/ActionButton';
import Alert from '../../../common/Alert';
import { postMassif, updateMassif } from '../../../../actions/Massif';

import Massif from './Massif';
import PolygonMap from './PolygonMap/Polygon';
//import PolygonMap from './PolygonMap/Polygon';

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const defaultMassifValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  language: 'fra',
  geogPolygon: ''
};

export const MassifForm = ({ massifValues = null }) => {
  const isNewMassif = massifValues === null;
  const geolocation = useGeolocation();
  const latitude = geolocation?.lat;
  const longitude = geolocation?.lng;

  const { formatMessage } = useIntl();
  const { languages: allLanguages } = useSelector(state => state.language);
  const { error: massifError, loading: massifLoading } = useSelector(state =>
    isNewMassif ? state.massifPost : state.massifePut
  );
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
    defaultValues: {
      massif: massifValues || defaultMassifValues
    }
  });

  const [activeStep, setActiveStep] = useState(0);
  const hasFinish = useBoolean();
  const stepExpanded = useBoolean();

  const handleReset = useCallback(() => {
    reset({ massif: defaultMassifValues });
    stepExpanded.close();
    setActiveStep(0);
  }, [reset, stepExpanded]);

  const steps = {
    massif: (
      <Massif
        allLanguages={allLanguages}
        control={control}
        disabled={!isNewMassif}
        errors={errors}
        reset={handleReset}
      />
    ),
    maps: (
      <PolygonMap />
    ) /*
    details: (
      <Details
        control={control}
        errors={errors}
        isReadonly={!isNewEntrance && entityType === ENTRANCE_ONLY}
      />
    )*/
  };
  const stepKeys = keys(steps);

  const handleNext = async () => {
    const result = await trigger(
      [
        'massif.description',
        'massif.descriptionTitle',
        'massif.name',
        'massif.language'
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
    /*
    const Data = {
      ...makeCaveData(data),
      id: caveValues?.id
    };
    const entranceData = {
      ...makeEntranceData(data, entityType),
      id: entranceValues?.id
    };
    if (isNewEntrance) {
      if (entityType === ENTRANCE_AND_CAVE) {
        dispatch(postCaveAndEntrance(caveData, entranceData));
      } else {
        dispatch(postEntrance(entranceData));
      }
    } else if (entityType === ENTRANCE_AND_CAVE) {
      dispatch(updateCaveAndEntrance(caveData, entranceData));
    } else {
      dispatch(updateEntrance(entranceData));
    }*/
  };

  return isSubmitSuccessful && isNil(massifError) ? (
    <Box display="flex" justifyContent="center" flexDirection="column">
      {massifLoading && (
        <>
          <Typography>
            {formatMessage({
              id: isNewMassif ? 'Creating massif...' : 'Updating massif...'
            })}
          </Typography>
          <CircularProgress />
        </>
      )}
      {!massifLoading && (
        <form>
          <Alert
            severity="success"
            title={formatMessage({
              id: isNewMassif
                ? 'Massif successfully created!'
                : 'Massif successfully updated!'
            })}
          />
          {isNewMassif && (
            <Button onClick={handleReset} color="primary">
              {formatMessage({
                id: 'Create a new Massif'
              })}
            </Button>
          )}
        </form>
      )}
    </Box>
  ) : (
    <Box display="flex" justifyContent="center" flexDirection="column">
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {stepKeys.map(label => (
            <Step
              key={formatMessage({ id: label })}
              expanded={stepExpanded.isOpen}>
              <StepLabel>
                {formatMessage({
                  id: label[0].toUpperCase() + label.substring(1)
                })}
              </StepLabel>
              <StepContent>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  {prop(label, steps)}
                </div>
                {!stepExpanded.isOpen && (
                  <Box display="flex" justifyContent="center">
                    <Button disabled={activeStep === 0} onClick={handleBack}>
                      {formatMessage({ id: 'Back' })}
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleNext}>
                      {formatMessage({
                        id:
                          activeStep === length(stepKeys) - 1
                            ? 'Review'
                            : 'Next'
                      })}
                    </Button>
                  </Box>
                )}
              </StepContent>
            </Step>
          ))}
        </Stepper>
        <Box display="flex">
          {isNewMassif && (
            <Button disabled={!isDirty} onClick={handleReset}>
              {formatMessage({ id: 'Reset' })}
            </Button>
          )}
          <ActionButton
            label={formatMessage({
              id: isNewMassif ? 'Create' : 'Update'
            })}
            loading={isSubmitting}
            disabled={!hasFinish.isTrue}
            color="primary"
            icon={<Icon>send</Icon>}
            style={{ margin: '8px', marginLeft: 'auto' }}
            type="submit"
          />
        </Box>
      </form>
    </Box>
  );
};

MassifForm.propTypes = {
  massifValues: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    descriptionTitle: PropTypes.string,
    geogPolygon: PropTypes.string
  })
};

export default MassifForm;
