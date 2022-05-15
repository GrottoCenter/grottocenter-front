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
import {
  updateDescription,
  postDescription
} from '../../../../actions/Description';
import { updateName } from '../../../../actions/Name';

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
  const isNewDescription = massifValues ? !massifValues.descriptionId : true;
  defaultMassifValues = massifValues || defaultMassifValues;
  const { formatMessage } = useIntl();
  const { languages: allLanguages } = useSelector(state => state.language);
  const { error: massifError, loading: massifLoading } = useSelector(state =>
    isNewMassif ? state.massifPost : state.massifPut
  );
  const { error: nameError, loading: nameLoading } = useSelector(
    state => state.namePatch
  );
  const {
    error: descriptionError,
    loading: descriptionLoading
  } = useSelector(state =>
    isNewDescription ? state.descriptionPost : state.descriptionPatch
  );
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
      <Massif
        allLanguages={allLanguages}
        control={control}
        errors={errors}
        isNewDescription={isNewDescription}
      />
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
      dispatch(postMassif(massifToPost));
    } else {
      if (data.massif.name !== defaultMassifValues.name) {
        const newName = {
          id: defaultMassifValues.nameId,
          name: data.massif.name
        };
        dispatch(updateName(newName));
      }

      if (
        data.massif.description !== defaultMassifValues.description ||
        data.massif.descriptionTitle !== defaultMassifValues.descriptionTitle
      ) {
        if (isNewDescription) {
          const newDescription = {
            body: data.massif.description,
            language: data.massif.language,
            title: data.massif.descriptionTitle,
            massifId: defaultMassifValues.massifId
          };
          dispatch(postDescription(newDescription));
        } else {
          const updatedDescription = {
            id: data.massif.descriptionId,
            body: data.massif.description,
            title: data.massif.descriptionTitle
          };
          dispatch(updateDescription(updatedDescription));
        }
      }

      const massifToUpdate = makeMassifPutData(data, defaultMassifValues);
      dispatch(updateMassif(massifToUpdate));
    }
  };

  return isSubmitted &&
    isNil(massifError) &&
    isNil(nameError) &&
    isNil(descriptionError) ? (
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
      {!massifLoading &&
        !nameLoading &&
        !descriptionLoading &&
        isSubmitSuccessful && (
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

      {!massifLoading &&
        !nameLoading &&
        !descriptionLoading &&
        !isSubmitSuccessful && (
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
