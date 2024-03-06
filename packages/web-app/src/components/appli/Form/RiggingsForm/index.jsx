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
  IconButton,
  Tooltip,
  ButtonGroup
} from '@mui/material';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteIcon from '@mui/icons-material/Delete';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';

import LanguageAutoComplete from '../LanguageAutoComplete';
import { riggingType } from '../../Entry/Provider';

const touch = matchMedia('(hover: none), (pointer: coarse)').matches;

const ButtonWrapper = styled('div')`
  display: flex;
  text-align: left;
`;

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)};`}
`;

const getDefaultValues = language => ({
  title: '',
  body: '',
  language,
  obstacles: [{ obstacle: '', rope: '', observation: '', anchor: '' }]
});

const CreateRiggingsForm = ({ closeForm, onSubmit, values, isNew }) => {
  const { formatMessage } = useIntl();
  const { languageObject } = useSelector(state => state.intl);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: values || getDefaultValues(languageObject)
  });
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'obstacles'
  });
  const resetToDefault = () => {
    reset(values || getDefaultValues(languageObject));
  };
  const [showActionId, setShowActionId] = useState(-1);

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
          <Box mr="50px">
            <TextField
              error={!!error}
              fullWidth
              helperText={
                error ? formatMessage({ id: 'A title is required.' }) : ''
              }
              label={formatMessage({ id: 'Title' })}
              onChange={onChange}
              required
              style={{ mb: 2 }}
              value={value}
            />
          </Box>
        )}
      />
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
      <TableContainer>
        <Table size="small" aria-label="riggings">
          <TableHead>
            <TableRow>
              <TableCell align="center">
                {formatMessage({ id: 'obstacles' })}
              </TableCell>
              <TableCell align="center">
                {formatMessage({ id: 'ropes' })}
              </TableCell>
              <TableCell align="center">
                {formatMessage({ id: 'anchors' })}
              </TableCell>
              <TableCell align="center">
                {formatMessage({ id: 'observations' })}
              </TableCell>
              <TableCell align="center" width="70px" />
            </TableRow>
          </TableHead>
          <TableBody>
            {fields.map((item, index) => (
              <TableRow
                key={item.id}
                onMouseEnter={() => {
                  setShowActionId(item.id); // set id here
                }}
                onMouseLeave={() => setShowActionId(-1)}>
                <TableCell scope="row" padding="none">
                  <Box style={{ mx: 1 }}>
                    <Controller
                      control={control}
                      name={`obstacles.${index}.obstacle`}
                      rules={{ required: true }}
                      render={({ field, fieldState: { error } }) => (
                        <TextField
                          multiline
                          error={!!error}
                          helperText={
                            error
                              ? formatMessage({
                                  id: 'Please delete this line or fill at least the obstacle cell.'
                                })
                              : ''
                          }
                          minRows={2}
                          style={{ width: '100%', margin: 0 }}
                          label={formatMessage({ id: 'obstacles' })}
                          required
                          {...field}
                        />
                      )}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right" padding="none">
                  <Box style={{ m: 1 }}>
                    <Controller
                      control={control}
                      name={`obstacles.${index}.rope`}
                      rules={{ required: false }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          multiline
                          minRows={2}
                          style={{ width: '100%', margin: 0 }}
                          label={formatMessage({ id: 'ropes' })}
                        />
                      )}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right" padding="none">
                  <Box style={{ m: 1 }}>
                    <Controller
                      control={control}
                      name={`obstacles.${index}.anchor`}
                      rules={{ required: false }}
                      render={({ field }) => (
                        <TextField
                          minRows={2}
                          multiline
                          style={{ width: '100%', margin: 0 }}
                          label={formatMessage({ id: 'anchors' })}
                          {...field}
                        />
                      )}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right" padding="none">
                  <Box style={{ m: 1 }}>
                    <Controller
                      control={control}
                      name={`obstacles[${index}].observation`}
                      rules={{ required: false }}
                      render={({ field }) => (
                        <TextField
                          minRows={2}
                          multiline
                          style={{ width: '100%', margin: 0 }}
                          label={formatMessage({ id: 'observation' })}
                          {...field}
                        />
                      )}
                    />
                  </Box>
                </TableCell>
                <TableCell align="right" padding="none">
                  {(item.id === showActionId || touch) && (
                    <ButtonWrapper>
                      <ButtonGroup orientation="vertical" size="small">
                        <Tooltip
                          title={formatMessage({ id: 'Move this line up' })}>
                          <span>
                            <IconButton
                              onClick={() => swap(index, index - 1)}
                              size="small"
                              color="primary"
                              disabled={index === 0}
                              aria-label="edit">
                              <KeyboardArrowUpIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip
                          title={formatMessage({ id: 'Move this line down' })}>
                          <span>
                            <IconButton
                              onClick={() => swap(index, index + 1)}
                              size="small"
                              color="primary"
                              disabled={index === fields.length - 1}
                              aria-label="edit">
                              <KeyboardArrowDownIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </ButtonGroup>
                      <Tooltip
                        title={formatMessage({ id: 'Delete this line' })}>
                        <IconButton
                          onClick={() => remove(index)}
                          size="small"
                          color="inherit"
                          aria-label="edit">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </ButtonWrapper>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box textAlign="center" width="100%" style={{ mb: 3, mt: -3 }}>
        <Button
          onClick={() => append(getDefaultValues(languageObject).obstacles[0])}
          color="secondary"
          aria-label="edit"
          startIcon={<PlaylistAddIcon />}>
          {formatMessage({ id: 'New line' })}
        </Button>
      </Box>
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
        style={{ mx: 1 }}>
        {isNew
          ? formatMessage({ id: 'Create' })
          : formatMessage({ id: 'Update' })}
      </SpacedButton>
    </Box>
  );
};

CreateRiggingsForm.propTypes = {
  closeForm: PropTypes.func,
  isNew: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: riggingType
};

export default CreateRiggingsForm;
