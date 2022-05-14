import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useForm } from 'react-hook-form';
import { isNil, keys, prop, length } from 'ramda';
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
import { useSelector, useDispatch } from 'react-redux';

import { useBoolean } from '../../../../hooks';
import ActionButton from '../../../common/ActionButton';
import Alert from '../../../common/Alert';
import { postMassif, updateMassif } from '../../../../actions/Massif';

import Massif from './Massif';
import PolygonContainer from './PolygonContainer';
import { makeMassifPostData, makeMassifPutData } from './transformers';

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

let defaultMassifValues = {
  name: '',
  description: '',
  descriptionTitle: '',
  language: '',
  geoJson: null
};

export const MassifForm = ({ massifValues }) => {
  const isNewMassif = !massifValues;
  defaultMassifValues = massifValues || defaultMassifValues;
  const { formatMessage } = useIntl();
  const { languages: allLanguages } = useSelector(state => state.language);
  const {
    error: massifError,
    loading: massifLoading,
    massif
  } = useSelector(state => (isNewMassif ? state.massifPost : state.massifPut));
  const dispatch = useDispatch();

  const {
    handleSubmit,
    reset,
    control,
    trigger,
    formState: {
      errors,
      isDirty,
      isSubmitted,
      isSubmitting,
      isSubmitSuccessful
    }
  } = useForm({
    defaultValues: {
      massif: defaultMassifValues
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
      <Massif allLanguages={allLanguages} control={control} errors={errors} />
    ),
    location: (
      <PolygonContainer
        control={control}
        errors={errors}
        geoJson={defaultMassifValues.geoJson}
      />
    )
  };
  const stepKeys = keys(steps);

  const handleNext = async () => {
    const result = await trigger(
      [
        'massif.description',
        'massif.descriptionTitle',
        'massif.name',
        'massif.language',
        'massif.geoJson'
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
    if (isNewMassif) {
      const massifToPost = makeMassifPostData(data);
      console.log('post');
      console.log(massifToPost);
      dispatch(postMassif(massifToPost));
    } else {
      const massifToUpdate = makeMassifPutData(data);
      console.log('edit');
      dispatch(updateMassif(massifToUpdate));
    }
  };

  return isSubmitted && isNil(massifError) ? (
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
      {!massifLoading && isSubmitSuccessful && (
        <form>
          <Alert
            severity="success"
            title={formatMessage({
              id: isNewMassif
                ? 'Massif successfully created!'
                : 'Massif successfully updated!'
            })}
          />
          <h1>{JSON.stringify(massif)}</h1>
          {isNewMassif && (
            <Button onClick={handleReset} color="primary">
              {formatMessage({
                id: 'Create a new Massif'
              })}
            </Button>
          )}
        </form>
      )}

      {!massifLoading && !isSubmitSuccessful && (
        <form>
          <Alert
            severity="error"
            title={formatMessage({
              id: isNewMassif
                ? 'An error occurred when creating a massif!'
                : 'An error occurred when updating a massif!'
            })}
          />
          {isNewMassif && (
            <Button onClick={handleReset} color="primary">
              {formatMessage({
                id: 'Retry'
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
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
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
          <Button disabled={!isDirty} onClick={handleReset}>
            {formatMessage({ id: 'Reset' })}
          </Button>

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
    geoJson: PropTypes.string
  })
};

export default MassifForm;
