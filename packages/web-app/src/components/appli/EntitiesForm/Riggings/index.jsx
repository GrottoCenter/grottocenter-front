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

import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';

import { RiggingPropTypes } from '../../../../types/entrance.type';

const touch = matchMedia('(hover: none), (pointer: coarse)').matches;

const ButtonWrapper = styled('div')`
  display: flex;
  text-align: left;
`;

const getDefaultObstacle = () => ({
  obstacle: '',
  rope: '',
  observation: '',
  anchor: ''
});

const getDefaultValues = language => ({
  title: '',
  body: '',
  language,
  obstacles: [getDefaultObstacle()]
});

const CreateRiggingsForm = ({ closeForm, onSubmit, values, isNew }) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting }
  } = useForm({
    defaultValues: values ?? getDefaultValues(AVAILABLE_LANGUAGES[locale].id)
  });
  const handleReset = () => {
    reset(values ?? getDefaultValues(AVAILABLE_LANGUAGES[locale].id));
  };

  const { formatMessage } = useIntl();
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'obstacles'
  });

  const [showActionId, setShowActionId] = useState(-1);

  return (
    <FormContainer sx={{ marginTop: 2 }}>
      <form autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
        <FormRow>
          <InputText
            formKey="title"
            labelName="Title"
            control={control}
            isError={!!errors?.title}
            isRequired
          />

          <InputLanguage
            formKey="language"
            control={control}
            isError={!!errors?.language}
          />
        </FormRow>
        <TableContainer>
          <Table size="small" aria-label="riggings">
            <TableHead sx={{ '& th': { textTransform: 'capitalize' } }}>
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
                            title={formatMessage({
                              id: 'Move this line down'
                            })}>
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
        <Box
          sx={{
            textAlign: 'center',
            width: '100%',
            marginBottom: 3,
            marginTop: -3
          }}>
          <Button
            onClick={() => append(getDefaultObstacle())}
            color="secondary"
            aria-label="edit"
            startIcon={<PlaylistAddIcon />}>
            {formatMessage({ id: 'New line' })}
          </Button>
        </Box>

        <FormActionRow
          isDirty={isDirty}
          isNew={isNew}
          isSubmitting={isSubmitting}
          onReset={handleReset}
          onCancel={closeForm}
          isCenter
        />
      </form>
    </FormContainer>
  );
};

CreateRiggingsForm.propTypes = {
  closeForm: PropTypes.func,
  isNew: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  values: RiggingPropTypes
};

export default CreateRiggingsForm;
