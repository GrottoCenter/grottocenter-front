import { useState } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import countryList from 'react-select-country-list';
import {
  Autocomplete,
  CircularProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material';

import Alert from '../../../common/Alert';
import {
  FormContainer,
  FormActionRow,
  FormRow,
  FormSection
} from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';
import { useEntitySearch, useRegionsSearch } from '../../../../hooks';

import GuidelinePropTypes from '../../../../types/guideline.type';

const INSTRUCTIONS_CHARACTER_LIMIT = 500;
const INSTRUCTIONS_OVERFLOW_ALLOWANCE = 100;

const getDefaultValues = (language, associatedScope) => ({
  title: '',
  description: '',
  language,
  countries:
    associatedScope?.type === 'countries' ? [associatedScope.value] : [],
  regions: associatedScope?.type === 'regions' ? [associatedScope.value] : [],
  massifs: associatedScope?.type === 'massifs' ? [associatedScope.value] : []
});

const COUNTRY_OPTIONS = countryList()
  .getData()
  .sort((a, b) => a.label.localeCompare(b.label))
  .map(country => ({ id: country.value, name: country.label }));

const mergeSelectedOptions = (getId, selected = [], options = []) => [
  ...selected,
  ...options.filter(
    option =>
      !selected.some(value => String(getId(value)) === String(getId(option)))
  )
];

const getCountryId = country => country?.id ?? country;
const getRegionId = region => region?.iso ?? region?.id ?? region;
const getMassifId = massif => massif?.id ?? massif;
const getCountryLabel = country =>
  country?.name ?? country?.id ?? String(country);
const getRegionLabel = region => {
  const id = getRegionId(region);
  return region?.name ? `${region.name} (${id})` : String(id);
};
const getMassifLabel = massif => massif?.name ?? String(getMassifId(massif));

const GuidelineForm = ({
  closeForm,
  onSubmit,
  values,
  isNew,
  hideCancel = false,
  withScope = false,
  associatedScope = undefined
}) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  const { formatMessage } = useIntl();

  // When editing, normalize the language field to its ID since the API returns
  // a full language object but the backend expects just the language ID string.
  const normalizedValues = values
    ? { ...values, language: values.language?.id ?? values.language }
    : undefined;

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    mode: 'onChange',
    defaultValues:
      normalizedValues ??
      getDefaultValues(AVAILABLE_LANGUAGES[locale].id, associatedScope)
  });

  const [selectedCountries, selectedRegions, selectedMassifs] = useWatch({
    control,
    name: ['countries', 'regions', 'massifs']
  });
  const hasScope =
    (selectedCountries?.length ?? 0) +
      (selectedRegions?.length ?? 0) +
      (selectedMassifs?.length ?? 0) >
    0;
  const isFormValid = isValid && (!withScope || hasScope);

  const isTitleLengthValid = value => !value || value.length <= 150;

  const hasInstructions = value => Boolean(value?.trim());

  const [regionSearch, setRegionSearch] = useState('');
  const { data: regionOptions = [], isFetching: isLoadingRegions } =
    useRegionsSearch(withScope && !associatedScope ? regionSearch : '');
  const {
    inputValue: massifSearch,
    setInputValue: setMassifSearch,
    results: massifOptions,
    isLoading: isLoadingMassifs
  } = useEntitySearch(['massifs'], {
    enabled: withScope && !associatedScope
  });

  const handleValidSubmit = async data => {
    const countries = (data.countries ?? []).map(getCountryId);
    const regions = (data.regions ?? []).map(getRegionId);
    const massifs = (data.massifs ?? []).map(getMassifId);

    if (withScope && countries.length + regions.length + massifs.length === 0) {
      return;
    }

    await onSubmit({ ...data, countries, regions, massifs });
  };

  return (
    <FormContainer sx={{ marginTop: 1 }}>
      <form autoComplete="off" onSubmit={handleSubmit(handleValidSubmit)}>
        {associatedScope && (
          <Alert
            severity="info"
            content={formatMessage(
              { id: 'guidelines.creation_association' },
              {
                entityName: <strong>{associatedScope.value.name}</strong>
              }
            )}
          />
        )}
        <FormRow>
          <InputText
            formKey="title"
            labelName="guidelines.title"
            control={control}
            isError={!!errors?.title}
            isRequired
            validatorFn={isTitleLengthValid}
            helperText={
              errors?.title
                ? formatMessage({
                    id: 'Title must be less than 150 characters.'
                  })
                : undefined
            }
          />

          <InputLanguage
            formKey="language"
            control={control}
            isError={!!errors?.language}
          />
        </FormRow>
        <InputText
          formKey="description"
          labelName="guidelines.description"
          minRows={3}
          control={control}
          isError={!!errors?.description}
          isRequired
          characterLimit={INSTRUCTIONS_CHARACTER_LIMIT}
          characterLimitOverflow={INSTRUCTIONS_OVERFLOW_ALLOWANCE}
          validatorFn={hasInstructions}
          helperText={
            errors?.description
              ? formatMessage(
                  {
                    id:
                      errors.description.type === 'maxLength'
                        ? 'guidelines.instructions_too_long'
                        : 'guidelines.instructions_required'
                  },
                  { count: INSTRUCTIONS_CHARACTER_LIMIT }
                )
              : undefined
          }
        />

        {withScope && !associatedScope && (
          <FormSection title="Applies to">
            <Stack spacing={1}>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block">
                {formatMessage({ id: 'guidelines.scope_required' })}
              </Typography>
              <Controller
                name="countries"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    disableCloseOnSelect
                    filterSelectedOptions
                    options={COUNTRY_OPTIONS}
                    value={field.value ?? []}
                    onChange={(_event, value) => field.onChange(value)}
                    getOptionLabel={getCountryLabel}
                    isOptionEqualToValue={(option, value) =>
                      String(getCountryId(option)) ===
                      String(getCountryId(value))
                    }
                    slotProps={{ chip: { color: 'primary' } }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        variant="filled"
                        label={formatMessage({ id: 'Countries' })}
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="regions"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    filterOptions={options => options}
                    options={mergeSelectedOptions(
                      getRegionId,
                      field.value,
                      regionOptions
                    )}
                    value={field.value ?? []}
                    loading={isLoadingRegions}
                    inputValue={regionSearch}
                    onInputChange={(_event, value, reason) =>
                      setRegionSearch(reason === 'input' ? value : '')
                    }
                    onChange={(_event, value) => field.onChange(value)}
                    getOptionLabel={getRegionLabel}
                    isOptionEqualToValue={(option, value) =>
                      String(getRegionId(option)) === String(getRegionId(value))
                    }
                    slotProps={{ chip: { color: 'primary' } }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        variant="filled"
                        label={formatMessage({ id: 'Regions' })}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingRegions && (
                                <CircularProgress color="inherit" size={20} />
                              )}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="massifs"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    filterOptions={options => options}
                    options={mergeSelectedOptions(
                      getMassifId,
                      field.value,
                      massifOptions
                    )}
                    value={field.value ?? []}
                    loading={isLoadingMassifs}
                    inputValue={massifSearch}
                    onInputChange={(_event, value, reason) =>
                      setMassifSearch(reason === 'input' ? value : '')
                    }
                    onChange={(_event, value) => field.onChange(value)}
                    getOptionLabel={getMassifLabel}
                    isOptionEqualToValue={(option, value) =>
                      String(getMassifId(option)) === String(getMassifId(value))
                    }
                    slotProps={{ chip: { color: 'primary' } }}
                    renderInput={params => (
                      <TextField
                        {...params}
                        variant="filled"
                        label={formatMessage({ id: 'Massifs' })}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isLoadingMassifs && (
                                <CircularProgress color="inherit" size={20} />
                              )}
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                  />
                )}
              />
            </Stack>
          </FormSection>
        )}

        <FormActionRow
          isNew={isNew}
          isSubmitting={isSubmitting}
          disabled={!isFormValid}
          onCancel={hideCancel ? undefined : closeForm}
          isCenter
        />
      </form>
    </FormContainer>
  );
};

GuidelineForm.propTypes = {
  closeForm: PropTypes.func.isRequired,
  isNew: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: GuidelinePropTypes,
  // Hide the form's own Cancel button when the caller already exposes a close
  // affordance (e.g. a section header's SectionCreateButton), so the two do not
  // stack.
  hideCancel: PropTypes.bool,
  withScope: PropTypes.bool,
  associatedScope: PropTypes.shape({
    type: PropTypes.oneOf(['countries', 'regions', 'massifs']).isRequired,
    value: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired
    }).isRequired
  })
};

export default GuidelineForm;
