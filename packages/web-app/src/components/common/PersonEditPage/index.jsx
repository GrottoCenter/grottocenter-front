import React from 'react';
import { useParams, useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Icon,
  Typography,
  CircularProgress,
  Box
} from '@mui/material';
import CancelIconOutlined from '@mui/icons-material/CancelOutlined';

import { useForm } from 'react-hook-form';

import { useDispatch, useSelector } from 'react-redux';

import ActionButton from '../ActionButton';
import Alert from '../Alert';

import { useUserProperties } from '../../../hooks';
import PersonEditForm from './PersonForm';
import makeUserData from './transformer';
import { updatePerson } from '../../../actions/Person/UpdatePerson';
import { postChangePassword } from '../../../actions/ChangePassword';
import { postChangeEmail } from '../../../actions/ChangeEmail';
import Summary from './Summary';

const StyledActionButton = styled(ActionButton)`
  margin-top: ${({ theme }) => theme.spacing(1)};
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

function getSteps() {
  return ['Edit your profile', 'Summary'];
}
const steps = getSteps();

function getStepContent(step, userValues, control, errors, watch, isUser) {
  switch (step) {
    case 0:
      return (
        <PersonEditForm
          control={control}
          errors={errors}
          watch={watch}
          isUser={isUser}
        />
      );
    case 1:
      return <Summary control={control} defautValues={userValues} />;
    default:
      return 'Unknown step';
  }
}

const emptyDefaultValues = {
  name: '',
  surname: '',
  nickname: '',
  email: '',
  emailConfirmation: '',
  password: '',
  passwordConfirmation: ''
};

/**
 * Extract all values contained in emptyDefaultValues (userValues can contain way more properties than just the ones needed by the form).
 */
const extractDefaultValues = userValues =>
  Object.keys(emptyDefaultValues).reduce((res, key) => {
    res[key] = userValues[key];
    return res;
  }, {});

const PersonEditPage = ({ userValues }) => {
  const defaultValues = userValues
    ? extractDefaultValues(userValues)
    : emptyDefaultValues;
  const history = useHistory();
  const { personId } = useParams();

  const { id: userId } = useUserProperties();

  const { formatMessage } = useIntl();
  const isUser = userId.toString() === personId.toString();

  const {
    handleSubmit,
    control,
    reset,
    watch,
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
      user: defaultValues
    }
  });
  const { error: userError, isLoading: userLoading } = useSelector(
    state => state.updatePerson
  );
  const dispatch = useDispatch();

  const [activeStep, setActiveStep] = React.useState(0);

  const goBackToUserProfile = () => {
    history.push(`/ui/persons/${userValues.id}`);
  };

  const handleNext = async () => {
    const result = await trigger(
      [
        'user.name',
        'user.surname',
        'user.nickname',
        'user.email',
        'user.emailConfirmation',
        'user.password',
        'user.passwordConfirmation'
      ],

      {
        shouldFocus: true
      }
    );

    if (result) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleReset = () => {
    reset({ user: defaultValues });
    goBackToUserProfile();
  };

  const onSubmit = async data => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);

    const user = makeUserData(data);
    dispatch(updatePerson(userValues.id, user));

    if (data.user.email !== undefined && data.user.email !== '' && isUser) {
      dispatch(postChangeEmail(data.user.email));
    }
    let token;
    if (
      data.user.password !== undefined &&
      data.user.password !== '' &&
      isUser
    ) {
      dispatch(postChangePassword(data.user.password, token));
    }
  };

  return isSubmitted ? (
    <Box justifyContent="center" flexDirection="column">
      {userLoading && (
        <>
          <Typography>
            {formatMessage({
              id: 'Updating user...'
            })}
          </Typography>
          <CircularProgress />
        </>
      )}
      {!userLoading && isSubmitSuccessful && !userError && (
        <>
          <Alert
            severity="success"
            title={formatMessage({
              id: 'User successfully updated'
            })}
          />
          <Button onClick={goBackToUserProfile}>
            {formatMessage({ id: 'Go back to user profile' })}
          </Button>
        </>
      )}
      {!userLoading && userError && (
        <>
          <Alert
            severity="error"
            title={formatMessage({
              id: 'An error occurred when updating the user.'
            })}
          />
          <Button onClick={goBackToUserProfile}>
            {formatMessage({ id: 'Go back to user profile' })}
          </Button>
        </>
      )}
    </Box>
  ) : (
    <Box display="flex" justifyContent="center" flexDirection="column">
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <Stepper activeStep={activeStep}>
          {steps.map(label => {
            const stepProps = {};
            const labelProps = {};

            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>

        <Box display="flex" alignItems="center" flexDirection="column">
          {getStepContent(
            activeStep,
            defaultValues,
            control,
            errors,
            watch,
            isUser
          )}
          {activeStep === steps.length - 1 && (
            <Box mb={4}>
              <StyledActionButton
                label={
                  isUser
                    ? formatMessage({ id: 'Update my profile' })
                    : formatMessage({ id: 'Update user' })
                }
                loading={isSubmitting}
                color="primary"
                icon={<Icon>send</Icon>}
                type="submit"
              />
            </Box>
          )}
          <Box
            display="flex"
            justifyContent="space-between"
            width="170px"
            mb={4}>
            <Button disabled={activeStep === 0} onClick={handleBack}>
              {formatMessage({ id: 'Back' })}
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={!isDirty || activeStep === steps.length - 1}
              onClick={handleNext}>
              {formatMessage({ id: 'Next' })}
            </Button>
          </Box>
          <Button
            color="secondary"
            onClick={handleReset}
            startIcon={<CancelIconOutlined />}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

PersonEditPage.propTypes = {
  userValues: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string,
    surname: PropTypes.string,
    nickname: PropTypes.string
  })
};

export default PersonEditPage;
