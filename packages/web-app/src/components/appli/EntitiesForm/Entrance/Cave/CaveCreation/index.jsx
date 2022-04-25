import {
  FormControl,
  InputLabel,
  FormHelperText,
  TextField,
  Select,
  MenuItem
} from '@material-ui/core';
import React from 'react';
import { Controller, useController } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Section from '../../../FormSection';
import Translate from '../../../../../common/Translate';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CaveCreation = ({ control, errors, allLanguages }) => {
  const { formatMessage } = useIntl();

  const {
    field: { onChange: onNameChange }
  } = useController({
    control,
    name: 'cave.name',
    rules: { required: true }
  });

  return (
    <Section sectionTitle={formatMessage({ id: 'name' })}>
      <Wrapper>
        <Controller
          name="cave.name"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.cave?.name}
              label={formatMessage({ id: 'Cave (and entrance) name' })}
              inputRef={ref}
              onChange={event => {
                onChange(event.target.value);
                onNameChange(event.target.value);
              }}
              {...field}
            />
          )}
        />
        <Controller
          name="cave.language"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <FormControl required error={!!errors?.cave?.language} fullWidth>
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
      </Wrapper>
      {/* TODO HANDLE LOCATION FOR DESCRIPTION MULTIPLE FIELD (LOCATION) */}
      {/* <Descriptions control={control} errors={errors} /> */}
    </Section>
  );
};

CaveCreation.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    cave: PropTypes.shape({
      descriptions: PropTypes.arrayOf(PropTypes.shape({})),
      language: PropTypes.shape({ message: PropTypes.string }),
      name: PropTypes.shape({ message: PropTypes.string })
    })
  })
};

export default CaveCreation;
