import React, { useState, useCallback, useMemo } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import countryList from 'react-select-country-list';
import { useBoolean } from '../../../../hooks';
import ActionButton from '../../../common/ActionButton';
import Alert from '../../../common/Alert';
import postOrganization from '../../../../actions/CreateOrganization';
import updateOrganization from '../../../../actions/UpdateOrganization';
import BasicInformationsForm from './BasicInformationsForm';
import InformationsForm from './InformationsForm';
// import Uploader from './Uploader'; //To uncomment when api will have logo field
import Location from './Location/index';
import License from './License';
import makeOrganizationData from './transformers';

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)}px;
`;

const defaultOrganizationValues = {
  name: '',
  isPartner: false,
  description: '',
  descriptionTitle: '',
  language: '',
  firstAdress: '',
  secondAdress: '',
  zipCode: '',
  city: '',
  country: '',
  phone: '',
  mail: '',
  url: '',
  latitude: '',
  longitude: '',
  logo: ''
};

export const OrganizationForm = ({ organizationValues = null }) => {
  const isNewOrganization = organizationValues === null;
  const { formatMessage } = useIntl();
  const { languages: allLanguages } = useSelector(state => state.language);
  const allCountries = useMemo(() => countryList().getData(), []);
  const {
    error: organizationError,
    loading: organizationLoading
  } = useSelector(state =>
    isNewOrganization ? state.organizationPost : state.organizationPut
  );
  const dispatch = useDispatch();

  const {
    handleSubmit,
    reset,
    control,
    trigger,
    setFocus,
    formState: {
      errors,
      isDirty,
      isSubmitted,
      isSubmitting,
      isSubmitSuccessful
    }
  } = useForm({
    defaultValues: {
      organization: organizationValues || defaultOrganizationValues
    }
  });

  const [activeStep, setActiveStep] = useState(0);
  const hasFinish = useBoolean();
  const stepExpanded = useBoolean();

  const handleReset = useCallback(() => {
    reset({ organization: defaultOrganizationValues });
    stepExpanded.close();
    setActiveStep(0);
  }, [reset, stepExpanded]);

  const steps = {
    Organization: (
      <BasicInformationsForm
        allLanguages={allLanguages}
        control={control}
        errors={errors}
      />
    ),
    Informations: (
      <InformationsForm
        allCountries={allCountries}
        control={control}
        errors={errors}
      />
    ),
    Location: (
      <Location control={control} errors={errors} setFocus={setFocus} />
    ),
    // Logo: <Uploader control={control} errors={errors} />, // To uncomment when api will be ready to store logo
    Licenses: <License />
  };
  const stepKeys = keys(steps);

  const handleNext = async () => {
    const result = await trigger(
      [
        'organization.city',
        'oragnization.customMessage', // To remove when switch customMessage switch to description
        'organization.country',
        'organization.description',
        'organization.descriptionTitle',
        'organization.firstAdress',
        'organization.isPartner',
        'organization.latitude',
        'organization.language',
        'organization.longitude',
        'organization.logo',
        'organization.licensesAccepted',
        'organization.name',
        'organization.mail',
        'organization.phone',
        'organization.secondAdress',
        'organization.url',
        'organization.zipCode'
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
    const organization = makeOrganizationData(data);
    if (isNewOrganization) {
      dispatch(postOrganization(organization));
    } else {
      dispatch(updateOrganization(organization));
    }
  };

  return isSubmitted && isNil(organizationError) ? (
    <Box display="flex" justifyContent="center" flexDirection="column">
      {organizationLoading && (
        <>
          <Typography>
            {formatMessage({
              id: isNewOrganization
                ? 'Creating organization...'
                : 'Updating organization...'
            })}
          </Typography>
          <CircularProgress />
        </>
      )}
      {!organizationLoading && isSubmitSuccessful && (
        <form>
          <Alert
            severity="success"
            title={formatMessage({
              id: isNewOrganization
                ? 'Organization successfully created!'
                : 'Organization successfully updated!'
            })}
          />
          {isNewOrganization && (
            <Button onClick={handleReset} color="primary">
              {formatMessage({
                id: 'Create a new Organization'
              })}
            </Button>
          )}
        </form>
      )}

      {!organizationLoading && !isSubmitSuccessful && (
        <form>
          <Alert
            severity="error"
            title={formatMessage({
              id: isNewOrganization
                ? 'An error occurred when creating a organzation!'
                : 'An error occurred when updating a organization!'
            })}
          />
          {isNewOrganization && (
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
          {isNewOrganization && (
            <Button disabled={!isDirty} onClick={handleReset}>
              {formatMessage({ id: 'Reset' })}
            </Button>
          )}
          <ActionButton
            label={formatMessage({
              id: isNewOrganization ? 'Create' : 'Update'
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

OrganizationForm.propTypes = {
  organizationValues: PropTypes.shape({})
};

export default OrganizationForm;
