import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  TextField,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Table,
  IconButton
} from '@material-ui/core';
import CancelIcon from '@material-ui/icons/Cancel';
import AddIcon from '@material-ui/icons/Add';
import { Controller, useForm } from 'react-hook-form';
import styled from 'styled-components';
import { isNil } from 'ramda';

import LanguageAutoComplete from '../LanguageAutoComplete';
import { riggingsType } from '../../Entry/Provider';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)}px;`}
`;

const getDefaultValues = language => ({
  title: '',
  body: '',
  language,
  obstacles: []
});

const CreateRiggingsForm = ({
  closeForm,
  onSubmit,
  values,
  isNewDescription
}) => {
  const { formatMessage } = useIntl();
  const { languageObject } = useSelector(state => state.intl);
  const MultilinesTableCell = styled(TableCell)({ whiteSpace: 'pre-wrap' });
  const { control, handleSubmit, reset } = useForm({
    defaultValues: values || getDefaultValues(languageObject)
  });
  const resetToDefault = () => {
    reset(values || getDefaultValues(languageObject));
  };
  const [v, setV] = useState(values ? values.obstacles : []);

  const addValue = () => {
    const newV = [...v];
    newV.push('');
    setV(newV);
  };

  const rmvValue = index => {
    const newV = [...v];
    newV.splice(index, 1);
    setV(newV);
  };

  return (
    <Box
      autoComplete="off"
      component="form"
      textAlign="center"
      onSubmit={handleSubmit(onSubmit)}>
      <Controller
        control={control}
        name="title"
        rules={{ required: true }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <TextField
            error={!!error}
            fullWidth
            helperText={
              error ? formatMessage({ id: 'A title is required.' }) : ''
            }
            label={formatMessage({ id: 'Title' })}
            onChange={onChange}
            required
            sx={{ mb: 2 }}
            value={value}
          />
        )}
      />

      <TableContainer>
        <Table size="small" aria-label="riggings">
          <TableHead>
            <TableRow>
              <TableCell>{formatMessage({ id: 'obstacles' })}</TableCell>
              <TableCell align="right">
                {formatMessage({ id: 'ropes' })}
              </TableCell>
              <TableCell align="right">
                {formatMessage({ id: 'anchors' })}
              </TableCell>
              <TableCell align="right">
                {formatMessage({ id: 'observations' })}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {v.map(({ obstacle, rope, anchor, observation }, index) => (
              <TableRow key={obstacle + rope + anchor}>
                <TableCell component="th" scope="row">
                  <Controller
                    control={control}
                    name={`obstacles[${index}].obstacle`}
                    rules={{ required: false }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error }
                    }) => (
                      <TextField
                        error={!!error}
                        fullWidth
                        helperText={
                          error
                            ? formatMessage({
                                id: 'A title is required.'
                              })
                            : ''
                        }
                        label={formatMessage({ id: 'obstacles' })}
                        onChange={onChange}
                        required
                        sx={{ mb: 2 }}
                        value={value}
                      />
                    )}
                  />
                </TableCell>
                <TableCell align="right">
                  <Controller
                    control={control}
                    name={`obstacles[${index}].rope`}
                    rules={{ required: false }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error }
                    }) => (
                      <TextField
                        error={!!error}
                        fullWidth
                        helperText={
                          error
                            ? formatMessage({
                                id: 'A title is required.'
                              })
                            : ''
                        }
                        label={formatMessage({ id: 'ropes' })}
                        onChange={onChange}
                        required
                        sx={{ mb: 2 }}
                        value={value}
                      />
                    )}
                  />
                </TableCell>
                <MultilinesTableCell align="right">
                  <Controller
                    control={control}
                    name={`obstacles[${index}].anchor`}
                    rules={{ required: false }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error }
                    }) => (
                      <TextField
                        error={!!error}
                        fullWidth
                        helperText={
                          error
                            ? formatMessage({
                                id: 'A title is required.'
                              })
                            : ''
                        }
                        label={formatMessage({ id: 'anchors' })}
                        onChange={onChange}
                        required
                        sx={{ mb: 2 }}
                        value={value}
                      />
                    )}
                  />
                </MultilinesTableCell>
                <MultilinesTableCell align="right">
                  <Controller
                    control={control}
                    name={`obstacles[${index}].observation`}
                    rules={{ required: false }}
                    render={({
                      field: { onChange, value },
                      fieldState: { error }
                    }) => (
                      <TextField
                        error={!!error}
                        fullWidth
                        helperText={
                          error
                            ? formatMessage({
                                id: 'A title is required.'
                              })
                            : ''
                        }
                        label={formatMessage({ id: 'observation' })}
                        onChange={onChange}
                        required
                        sx={{ mb: 2 }}
                        value={value}
                      />
                    )}
                  />
                </MultilinesTableCell>
                <IconButton
                  onClick={() => rmvValue(index)}
                  color="primary"
                  aria-label="edit">
                  <CancelIcon />
                </IconButton>
              </TableRow>
            ))}
            <IconButton onClick={addValue} color="primary" aria-label="edit">
              <AddIcon />
            </IconButton>
          </TableBody>
        </Table>
      </TableContainer>

      <Controller
        control={control}
        name="language"
        rules={{ required: true }}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <LanguageAutoComplete
            hasError={!isNil(error)}
            helperContent={formatMessage({
              id: 'The title and text language'
            })}
            labelText="Language"
            onSelection={onChange}
            searchLabelText={formatMessage({ id: 'Search a language' })}
            value={value}
          />
        )}
      />

      {closeForm && (
        <SpacedButton onClick={closeForm}>
          {formatMessage({ id: 'Cancel' })}
        </SpacedButton>
      )}
      <SpacedButton onClick={resetToDefault}>
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>
      <SpacedButton
        color="primary"
        type="submit"
        onClick={handleSubmit(onSubmit)}
        sx={{ mx: 1 }}>
        {isNewDescription
          ? formatMessage({ id: 'Create' })
          : formatMessage({ id: 'Update' })}
      </SpacedButton>
    </Box>
  );
};

CreateRiggingsForm.propTypes = {
  closeForm: PropTypes.func,
  isNewDescription: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: riggingsType
};

export default CreateRiggingsForm;
