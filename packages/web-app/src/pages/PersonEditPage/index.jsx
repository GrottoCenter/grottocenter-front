import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { isNil } from 'ramda';
import {
  Stepper,
  Step,
  StepLabel,
  Button,
  Icon,
  Typography,
  CircularProgress,
  Box
} from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useWatch, useForm } from 'react-hook-form';

import { useDispatch, useSelector } from 'react-redux';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ActionButton from '../../components/common/ActionButton';
import Alert from '../../components/common/Alert';

import { useBoolean, useDebounce } from '../../hooks';
import PersonEditForm from './PersonForm';
import makeUserData from './transformer';
import { updateUser } from '../../actions/UpdateUser';
import { postChangePassword } from '../../actions/ChangePassword';
import { postChangeEmail } from '../../actions/ChangeEmail';
import Summary from './Summary';

const StyledTypography = styled(Typography)`
  margintop: theme.spacing(1);
  marginbottom: theme.spacing(1);
`;
const StyledActionButton = styled(ActionButton)`
  margin-top: ${({ theme }) => theme.spacing(1)}px;
  margin-bottom: ${({ theme }) => theme.spacing(1)}px;
`;
const StyledButton = styled(Button)`
  marginright: theme.spacing(1);
`;

function getSteps() {
  return ['Edit your profile', 'Summary'];
}
const steps = getSteps();

function getStepContent(step, userValues, control, errors, watch) {
  switch (step) {
    case 0:
      return <PersonEditForm control={control} errors={errors} watch={watch} />;
    case 1:
      return <Summary control={control} defautValues={userValues} />;
    default:
      return 'Unknown step';
  }
}

let defautValues = {
  name: '',
  surname: '',
  nickname: '',
  email: '',
  emailConfirmation: '',
  password: '',
  passwordConfirmation: ''
};

const PersonEditPage = ({ userValues }) => {
  defautValues = userValues || defautValues;
  const history = useHistory();
  const { formatMessage } = useIntl();
  const isValid = useBoolean();
  const {
    handleSubmit,
    reset,
    control,
    watch,
    trigger,
    formState: { errors, isSubmitted, isSubmitting, isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      user: defautValues
    }
  });
  const { error: UserError, loading: UserLoading } = useSelector(
    state => state.updateUser
  );
  const dispatch = useDispatch();

  const [activeStep, setActiveStep] = React.useState(0);

  const debouncedName = useDebounce(
    useWatch({ control, name: 'user.name' }),
    300
  );
  const debouncedSurname = useDebounce(
    useWatch({ control, name: 'user.surname' }),
    300
  );
  const debouncedNickname = useDebounce(
    useWatch({ control, name: 'user.nickname' }),
    300
  );

  const debouncedMail = useDebounce(
    useWatch({ control, name: 'user.email' }),
    300
  );
  const debouncedPassword = useDebounce(
    useWatch({ control, name: 'user.password' }),
    300
  );
  const isChanged = () => {
    if (
      debouncedName !== defautValues.name ||
      debouncedSurname !== defautValues.surname ||
      debouncedNickname !== defautValues.nickname ||
      (debouncedMail !== undefined && debouncedMail !== '') ||
      (debouncedPassword !== undefined && debouncedPassword !== '')
    ) {
      return true;
    }
    return false;
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
    isValid.true();
    if (result && isChanged()) {
      setActiveStep(prevActiveStep => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const onSubmit = async data => {
    setActiveStep(prevActiveStep => prevActiveStep + 1);

    const User = makeUserData(data);

    dispatch(updateUser(User));

    if (data.user.email !== undefined && data.user.email !== '') {
      dispatch(postChangeEmail(data.user.email));
    }
    let token;
    if (data.user.password !== undefined && data.user.password !== '') {
      dispatch(postChangePassword(data.user.password, token));
    }
  };

  const handleReset = () => {
    reset({ user: defautValues });
    setActiveStep(0);
  };

  const handleFinish = () => {
    history.push(`/ui/persons/${userValues.id}`);
  };

  return (
    <Layout
      title={formatMessage({ id: 'Edit your profile' })}
      content={
        isSubmitted && isNil(UserError) ? (
          <Box display="flex" justifyContent="center" flexDirection="column">
            {UserLoading && (
              <>
                <Typography>
                  {formatMessage({
                    id: 'Updating user...'
                  })}
                </Typography>
                <CircularProgress />
              </>
            )}
            {!UserLoading && isSubmitSuccessful && (
              <Alert
                severity="success"
                title={formatMessage({
                  id: 'User successfully updated'
                })}
              />
            )}
            {!UserLoading && !isSubmitSuccessful && (
              <Alert
                severity="error"
                title={formatMessage({
                  id: 'An error occurred when updating the user!'
                })}
              />
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

              <div>
                {activeStep === steps.length ? (
                  <div>
                    <StyledTypography>
                      {formatMessage({ id: 'All steps completed' })}
                    </StyledTypography>
                    <StyledButton onClick={handleReset}>
                      {formatMessage({ id: 'Reset' })}
                    </StyledButton>
                    <StyledButton onClick={handleFinish}>
                      {formatMessage({ id: 'Finish' })}
                    </StyledButton>
                  </div>
                ) : (
                  <div>
                    <StyledTypography component="div">
                      {getStepContent(
                        activeStep,
                        defautValues,
                        control,
                        errors,
                        watch
                      )}
                    </StyledTypography>
                    <div>
                      <StyledButton
                        disabled={activeStep === 0}
                        onClick={handleBack}>
                        Back
                      </StyledButton>
                      {activeStep === steps.length - 1 ? (
                        <StyledActionButton
                          label={formatMessage({ id: 'Update' })}
                          loading={isSubmitting}
                          color="primary"
                          icon={<Icon>send</Icon>}
                          type="submit"
                        />
                      ) : (
                        <StyledButton
                          variant="contained"
                          color="primary"
                          onClick={handleNext}>
                          {activeStep === steps.length - 1
                            ? formatMessage({ id: 'Finish' })
                            : formatMessage({ id: 'Next' })}
                        </StyledButton>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Box>
        )
      }
    />
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
