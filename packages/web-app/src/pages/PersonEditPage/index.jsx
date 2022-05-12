import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { makeStyles } from '@material-ui/core/styles';
import { useForm } from 'react-hook-form';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import PersonEditForm from './PersonForm';
import EditOrganizations from './PersonOrganizationForm';
// import { any } from 'prop-types';
import Summary from './Summary';

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%'
  },
  button: {
    marginRight: theme.spacing(1)
  },
  instructions: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1)
  }
}));

function getSteps() {
  return ['Edit your profile', 'Connection to an organisation', 'Summary'];
}

function getStepContent(step, userTest, control, errors) {
  switch (step) {
    case 0:
      return (
        <PersonEditForm
          control={control}
          errors={errors}
          user={userTest}
          onEmailChange=""
          onNameChange=""
          onNicknameChange=""
          onPasswordChange=""
          onPasswordConfirmationChange=""
          onPersonEdit=""
          onSurnameChange=""
          loading=""
          PersonEditRequestSucceeded
        />
      );
    case 1:
      return <EditOrganizations user={userTest} />;
    case 2:
      return <Summary user={userTest} />;
    default:
      return 'Unknown step';
  }
}

const PersonEditPage = ({ isFetching, userValues = null }) => {
  const orga = [
    {
      key: 0,
      email: 'testemail1',
      name: 'testname1',
      nickname: 'testnickname',
      surname: 'testsurname'
    },
    {
      key: 1,
      email: 'testemail',
      name: 'testname2',
      nickname: 'testnickname',
      surname: 'testsurname'
    },
    {
      key: 4,
      email: 'testemail',
      name: 'testname3',
      nickname: 'testnickname',
      surname: 'testsurname'
    }
  ];
  const userTest = {
    name: 'testname',
    nickname: 'testnickname',
    surname: 'testsurname',
    email: 'testemail@orange.fr',
    password: 'testpassword',
    passwordConfirmation: 'testpassword',
    organizations: orga
  };

  const {
    control,
    trigger,
    formState: { errors }
  } = useForm({
    defaultValues: {
      user: userValues
    }
  });
  const classes = useStyles();
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set());
  const steps = getSteps();

  const isStepOptional = step => {
    return step === 1;
  };

  const isStepSkipped = step => {
    return skipped.has(step);
  };
  /*
  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep(prevActiveStep => prevActiveStep + 1);
    setSkipped(newSkipped);
  };
  */

  const handleNext = async () => {
    const result = await trigger('user.name', { shouldFocus: true });
    if (result) {
      let newSkipped = skipped;
      if (isStepSkipped(activeStep)) {
        newSkipped = new Set(newSkipped.values());
        newSkipped.delete(activeStep);
      }

      setActiveStep(prevActiveStep => prevActiveStep + 1);
      setSkipped(newSkipped);
    }
  };

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep(prevActiveStep => prevActiveStep + 1);
    setSkipped(prevSkipped => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  if (isNil(userValues)) {
    return (
      <Typography variant="h3">
        user Error, the person you are looking for is not available.
      </Typography>
    );
  }

  if (!isFetching) {
    return (
      <Typography variant="h3">
        fetching Error, the person you are looking for is not available.
      </Typography>
    );
  }

  return (
    <div className={classes.root}>
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          if (isStepOptional(index)) {
            labelProps.optional = (
              <Typography variant="caption">Optional</Typography>
            );
          }
          if (isStepSkipped(index)) {
            stepProps.completed = false;
          }
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
            <Typography className={classes.instructions}>
              All steps completed - you&apos;re finished
            </Typography>
            <Button onClick={handleReset} className={classes.button}>
              Reset
            </Button>
          </div>
        ) : (
          <div>
            <Typography className={classes.instructions}>
              {getStepContent(activeStep, userTest, control, errors)}
            </Typography>
            <div>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                className={classes.button}>
                Back
              </Button>
              {isStepOptional(activeStep) && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSkip}
                  className={classes.button}>
                  Skip
                </Button>
              )}

              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                className={classes.button}>
                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PersonEditPage.propTypes = {
  isFetching: PropTypes.bool,
  userValues: PropTypes.shape({
    name: PropTypes.string
  })
};

export default PersonEditPage;
