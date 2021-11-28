import {
  FormControl,
  InputLabel,
  FormHelperText,
  TextField,
  Select,
  MenuItem
} from '@material-ui/core';
import React from 'react';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import Section from '../FormSection';

import Translate from '../../../common/Translate';

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const Cave = ({ control, errors, allLanguages }) => {
  const { formatMessage } = useIntl();

  return (
    <Section sectionTitle={formatMessage({ id: 'name' })}>
      <Wrapper>
        <Controller
          name="name"
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors.name}
              label={formatMessage({ id: 'Cave name' })}
              inputRef={ref}
              {...field}
            />
          )}
        />
        <Controller
          name={formatMessage({ id: 'language' })}
          control={control}
          rules={{ required: true }}
          render={({ field: { ref, ...field } }) => (
            <FormControl required error={!!errors.language} fullWidth>
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
                <Translate>Name language</Translate>
              </FormHelperText>
            </FormControl>
          )}
        />
      </Wrapper>
      <Wrapper>
        <Controller
          name="descriptionTitle"
          control={control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              label={formatMessage({ id: 'Description title' })}
              inputRef={ref}
              {...field}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field: { ref, ...field } }) => (
            <TextField
              multiline={3}
              fullWidth
              label={formatMessage({ id: 'Description' })}
              inputRef={ref}
              {...field}
            />
          )}
        />
      </Wrapper>
    </Section>
  );
};

Cave.propTypes = {
  allLanguages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      refName: PropTypes.string.isRequired
    })
  ),
  control: PropTypes.objectOf(),
  errors: PropTypes.objectOf()
};

export default Cave;
