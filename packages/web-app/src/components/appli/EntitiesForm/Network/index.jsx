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
import { updateCave } from '../../../../actions/Cave/UpdateCave';
import { updateEntrance } from '../../../../actions/Entrance/UpdateEntrance';

import Network from './Network';
import makeNetworkData from './transformers';
import idNameType from '../../../../types/idName.type';

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

// A Network can't be created. It's always starting wiht an entrance with a cave and then,
// entrance are being attached to the initial cave to form a network.
export const NetworkForm = ({ networkValues }) => {
  const { formatMessage } = useIntl();
  const { languages: allLanguages } = useSelector(state => state.language);
  const { error: networkError, loading: networkLoading } = useSelector(
    state => state.updateCave
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
    defaultValues: networkValues
  });

  const [activeStep, setActiveStep] = useState(0);
  const hasFinish = useBoolean();
  const stepExpanded = useBoolean();

  const handleReset = useCallback(() => {
    reset(networkValues);
    stepExpanded.close();
    setActiveStep(0);
  }, [networkValues, reset, stepExpanded]);

  const steps = {
    'Basic Informations': (
      <Network allLanguages={allLanguages} control={control} errors={errors} />
    )
  };
  const stepKeys = keys(steps);

  const handleNext = async () => {
    const result = await trigger(
      ['depth', 'isDiving', 'language', 'length', 'name', 'temperature'],
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
    const network = makeNetworkData(data);
    if (data.entrances.length === 1) {
      // Name must be the same for the only one entrance
      dispatch(
        updateEntrance({ id: data.entrances[0].id, name: network.name })
      );
    }
    dispatch(updateCave(network));
  };

  return isSubmitted && isNil(networkError) ? (
    <Box display="flex" justifyContent="center" flexDirection="column">
      {networkLoading && (
        <>
          <Typography>
            {formatMessage({
              id: 'Updating network...'
            })}
          </Typography>
          <CircularProgress />
        </>
      )}
      {!networkLoading && isSubmitSuccessful && (
        <form>
          <Alert
            severity="success"
            title={formatMessage({
              id: 'Network successfully updated!'
            })}
          />
        </form>
      )}

      {!networkLoading && !isSubmitSuccessful && (
        <form>
          <Alert
            severity="error"
            title={formatMessage({
              id: 'An error occurred when updating the network!'
            })}
          />
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
          <Button disabled={!isDirty} onClick={handleReset}>
            {formatMessage({ id: 'Reset' })}
          </Button>
          <ActionButton
            label={formatMessage({
              id: 'Update'
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

NetworkForm.propTypes = {
  networkValues: PropTypes.shape({
    depth: PropTypes.number,
    entrances: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired
      })
    ).isRequired,
    isDivingCave: PropTypes.bool,
    language: PropTypes.string.isRequired,
    length: PropTypes.number,
    massif: idNameType,
    name: PropTypes.string.isRequired,
    temperature: PropTypes.number
  }).isRequired
};

export default NetworkForm;
