import {
  FormControl as MuiFormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@material-ui/core';
import { Wrapper } from '@material-ui/pickers/wrappers/Wrapper';
import React from 'react';
import { Controller, useController } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Translate from '../../../common/Translate';
import Section from '../FormSection';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const Massif = ({ control, errors, allLanguages, reset, disabled = false }) => {
  const { formatMessage } = useIntl();

  return (
    <div>
      <FormControl component="fieldset" disabled={disabled}>
        <FormLabel component="legend">
          {formatMessage({ id: 'Basics Informations' })}
        </FormLabel>
        <Section sectionTitle={formatMessage({ id: 'name' })}>
          <Controller
            name="massif.name"
            control={control}
            rules={{ required: true }}
            render={({ field: { ref, onChange, ...field } }) => (
              <TextField
                fullWidth
                required
                error={!!errors?.massif?.name}
                label={formatMessage({ id: 'Massif name' })}
                inputRef={ref}
                onChange={event => {
                  onChange(event.target.value);
                  //   onNameChange(event.target.value);
                }}
                {...field}
              />
            )}
          />
          <Controller
            name="massif.description"
            control={control}
            rules={{ required: true }}
            render={({ field: { ref, onChange, ...field } }) => (
              <TextField
                fullWidth
                required
                error={!!errors?.massif?.description}
                label={formatMessage({ id: 'Massif description' })}
                inputRef={ref}
                onChange={event => {
                  onChange(event.target.value);
                  // onNameChange(event.target.value);
                }}
                {...field}
              />
            )}
          />
          <Controller
            name="massif.descriptionTitle"
            control={control}
            rules={{ required: true }}
            render={({ field: { ref, onChange, ...field } }) => (
              <TextField
                fullWidth
                required
                error={!!errors?.massif?.descriptionTitle}
                label={formatMessage({ id: 'Massif title description' })}
                inputRef={ref}
                onChange={event => {
                  onChange(event.target.value);
                  // onNameChange(event.target.value);
                }}
                {...field}
              />
            )}
          />
          <Controller
            name="massif.language"
            control={control}
            rules={{ required: true }}
            render={({ field: { ref, ...field } }) => (
              <FormControl
                required
                error={!!errors?.massif?.language}
                fullWidth>
                <InputLabel shrink>
                  <Translate>Language</Translate>
                </InputLabel>
                <Select {...field} inputRef={ref}>
                  <MenuItem key={-1} value={-1} disabled>
                    <i>
                      <Translate>Select a language</Translate>
                    </i>
                  </MenuItem>
                  {allLanguages.map(l => (
                    <MenuItem key={l.id} value={l.id} name={l.refName}>
                      <Translate>{l.refName}</Translate>
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  <Translate>Cave name language</Translate>
                </FormHelperText>
              </FormControl>
            )}
          />
          {/* TODO HANDLE LOCATION FOR DESCRIPTION MULTIPLE FIELD (LOCATION) */}
          {/* <Descriptions control={control} errors={errors} /> */}
        </Section>
      </FormControl>
    </div>
  );
};
Massif.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  control: PropTypes.shape({}),
  disabled: PropTypes.bool,
  errors: PropTypes.shape({
    massif: PropTypes.shape({
      description: PropTypes.arrayOf(PropTypes.shape({})),
      descriptionTitle: PropTypes.arrayOf(PropTypes.shape({})),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  reset: PropTypes.func
};

export default Massif;
