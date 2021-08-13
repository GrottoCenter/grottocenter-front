import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Translate from '../../../common/Translate';
import Section from '../FormSection';

const Description = ({ allLanguages, control, errors }) => {
  const { formatMessage } = useIntl();

  return (
    <Section sectionTitle={formatMessage({ id: 'main information' })}>
      <Controller
        name="name"
        control={control}
        rules={{ required: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            required
            autoFocus
            error={!!errors.name}
            label={formatMessage({ id: 'entry name' })}
            inputRef={ref}
            {...field}
          />
        )}
      />
      <Controller
        name="language"
        control={control}
        rules={{ required: true }}
        render={({ field: { ref, ...field } }) => (
          <FormControl required error={!!errors.language}>
            <InputLabel shrink>
              <Translate>language</Translate>
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
              <Translate>Title and description language</Translate>
            </FormHelperText>
          </FormControl>
        )}
      />
      <Controller
        name="descriptionTitle"
        control={control}
        rules={{ required: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            required
            label={formatMessage({ id: 'description title' })}
            error={!!errors.descriptionTitle}
            inputRef={ref}
            {...field}
          />
        )}
      />
      <Controller
        name="description"
        control={control}
        rules={{ required: true }}
        render={({ field: { ref, ...field } }) => (
          <TextField
            required
            label={formatMessage({ id: 'description' })}
            multiline
            fullWidth
            rows={4}
            error={!!errors.description}
            inputRef={ref}
            {...field}
          />
        )}
      />
    </Section>
  );
};

Description.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.shape({})),
  control: PropTypes.func,
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  )
};

export default Description;
