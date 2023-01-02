import {
  FormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import Translate from '../../../common/Translate';

const Massif = ({ control, errors, allLanguages, isNewDescription }) => {
  const { formatMessage } = useIntl();

  return (
    <div>
      <FormControl component="fieldset" style={{ width: '50vh' }}>
        <FormLabel>{formatMessage({ id: 'Basic Information' })}</FormLabel>
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
              onChange={onChange}
              {...field}
            />
          )}
        />
        <Controller
          name="massif.language"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <FormControl required error={!!errors?.massif?.language} fullWidth>
              <InputLabel shrink>
                <Translate>Language</Translate>
              </InputLabel>
              <Select disabled={!isNewDescription} {...field} inputRef={ref}>
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
            </FormControl>
          )}
        />
        <FormLabel>
          {formatMessage({ id: 'Description of the massif' })}
        </FormLabel>
        <Controller
          name="massif.descriptionTitle"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.massif?.descriptionTitle}
              label={formatMessage({ id: 'Title' })}
              inputRef={ref}
              onChange={onChange}
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
              label={formatMessage({ id: 'Description' })}
              inputRef={ref}
              multiline
              minRows={6}
              onChange={onChange}
              {...field}
            />
          )}
        />
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
  errors: PropTypes.shape({
    massif: PropTypes.shape({
      description: PropTypes.arrayOf(PropTypes.shape({})),
      descriptionTitle: PropTypes.arrayOf(PropTypes.shape({})),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  isNewDescription: PropTypes.bool
};

export default Massif;
