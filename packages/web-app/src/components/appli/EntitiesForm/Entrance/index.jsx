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
import { postEntrance, updateEntrance } from '../../../../actions/Entry';
import {
  postCaveAndEntrance,
  updateCaveAndEntrance
} from '../../../../actions/CaveAndEntrance';

import Cave from './Cave';
import Entrance from './Entrance';
import Details from './Cave/Details';
import { makeCaveData, makeEntranceData } from './transformers';
import { ENTRANCE_ONLY, ENTRANCE_AND_CAVE } from './caveType';

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const defaultCaveValues = {
  language: '',
  name: '',
  descriptions: undefined,
  isDiving: undefined,
  depth: null,
  length: null,
  temperature: null,
  massif: undefined,
  country: ''
};

const defaultEntranceValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  language: 'fra',
  latitude: '',
  longitude: '',
  country: 'FR'
};

export const EntranceForm = ({ caveValues = null, entranceValues = null }) => {
  const isNewEntrance = entranceValues === null || caveValues === null;
  const geolocation = useGeolocation();
  const latitude = geolocation?.lat;
  const longitude = geolocation?.lng;

  const { formatMessage } = useIntl();
  const { languages: allLanguages } = useSelector(state => state.language);
  const {
    error: entranceError,
    loading: entranceLoading
  } = useSelector(state =>
    isNewEntrance ? state.entrancePost : state.entrancePut
  );
  const { error: caveError, loading: caveLoading } = useSelector(state =>
    isNewEntrance ? state.cavePost : state.cavePut
  );
  const dispatch = useDispatch();
  const entityTypeInitialValue = useMemo(() => {
    return caveValues?.entrances.length > 1 ? ENTRANCE_ONLY : ENTRANCE_AND_CAVE;
  }, [caveValues?.entrances.length]);
  const [entityType, setEntityType] = useState(entityTypeInitialValue);

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
      entrance: entranceValues || defaultEntranceValues,
      cave: caveValues || defaultCaveValues
    }
  });

  const [activeStep, setActiveStep] = useState(0);
  const hasFinish = useBoolean();
  const stepExpanded = useBoolean();

  // TODO set latitude & longitude from the selected Entry
  // TODO set country from position
  useEffect(() => {
    if (isNil(entranceValues?.latitude) || isNil(entranceValues?.longitude)) {
      const values = getValues();
      reset({
        ...values,
        entrance: {
          ...values.entrance,
          latitude,
          longitude
        }
      });
    }
  }, [entranceValues, getValues, latitude, longitude, reset]);

  const handleUpdateEntityType = type => {
    setEntityType(type);
    reset({ ...getValues() });
  };

  const handleReset = useCallback(() => {
    reset({ cave: defaultCaveValues, entrance: defaultEntranceValues });
    stepExpanded.close();
    setActiveStep(0);
  }, [reset, stepExpanded]);

  const steps = {
    cave: (
      <Cave
        allLanguages={allLanguages}
        allowMoveFromCave={!isNewEntrance}
        control={control}
        entityType={entityType}
        entranceId={entranceValues?.id}
        disabled={!isNewEntrance}
        errors={errors}
        updateEntityType={handleUpdateEntityType}
        reset={handleReset}
      />
    ),
    entrance: (
      <Entrance
        control={control}
        allLanguages={allLanguages}
        errors={errors}
        setFocus={setFocus}
        entityType={entityType}
      />
    ),
    details: (
      <Details
        control={control}
        errors={errors}
        isReadonly={!isNewEntrance && entityType === ENTRANCE_ONLY}
      />
    )
  };
  const stepKeys =
    entityType === ENTRANCE_AND_CAVE
      ? keys(steps)
      : reject(equals('details'), keys(steps));

  const handleNext = async () => {
    const result = await trigger(
      [
        'cave.country',
        'cave.depth',
        'cave.descriptions',
        'cave.id',
        'cave.isDiving',
        'cave.language',
        'cave.length',
        'cave.massif',
        'cave.name',
        'cave.temperature',
        'entrance.country',
        'entrance.description',
        'entrance.descriptionTitle',
        'entrance.name',
        'entrance.language',
        'entrance.latitude',
        'entrance.longitude'
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
    const caveData = {
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
    }
  };

  return isSubmitSuccessful && isNil(entranceError) && isNil(caveError) ? (
    <Box display="flex" justifyContent="center" flexDirection="column">
      {entranceLoading && (
        <>
          <Typography>
            {formatMessage({
              id: isNewEntrance
                ? 'Creating entrance...'
                : 'Updating entrance...'
            })}
          </Typography>
          <CircularProgress />
        </>
      )}
      {caveLoading && (
        <>
          <Typography>
            {formatMessage({
              id: isNewEntrance ? 'Creating cave...' : 'Updating cave...'
            })}
          </Typography>
          <CircularProgress />
        </>
      )}
      {!caveLoading && !entranceLoading && (
        <form>
          <Alert
            severity="success"
            title={formatMessage({
              id: isNewEntrance
                ? 'Entrance successfully created!'
                : 'Entrance successfully updated!'
            })}
          />
          {isNewEntrance && (
            <Button onClick={handleReset} color="primary">
              {formatMessage({
                id: 'Create a new Entrance'
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
          {isNewEntrance && (
            <Button disabled={!isDirty} onClick={handleReset}>
              {formatMessage({ id: 'Reset' })}
            </Button>
          )}
          <ActionButton
            label={formatMessage({
              id: isNewEntrance ? 'Create' : 'Update'
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

EntranceForm.propTypes = {
  entranceValues: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    descriptionTitle: PropTypes.string,
    language: PropTypes.string,
    latitude: PropTypes.number,
    longitude: PropTypes.number
  }),
  caveValues: PropTypes.shape({
    name: PropTypes.string,
    language: PropTypes.string,
    isDiving: PropTypes.bool,
    depth: PropTypes.number,
    length: PropTypes.number
  })
};

export default EntranceForm;
