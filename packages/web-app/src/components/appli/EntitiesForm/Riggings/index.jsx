import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Stack,
  TableContainer,
  TableCell,
  TableHead,
  TableRow,
  TableBody,
  Table,
  useMediaQuery
} from '@mui/material';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTheme } from '@mui/material/styles';

import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';
import ObstacleField from './ObstacleField';
import ObstacleRowActions from './ObstacleRowActions';
import ObstacleCard from './ObstacleCard';

import { RiggingPropTypes } from '../../../../types/entrance.type';

const FIELDS = ['obstacle', 'rope', 'anchor', 'observation'];
const COLUMN_WIDTHS = {
  obstacle: '25%',
  rope: '13%',
  anchor: '22%',
  observation: undefined
};
const HEADER_KEYS = {
  obstacle: 'obstacles',
  rope: 'ropes',
  anchor: 'anchors',
  observation: 'observations'
};

const getDefaultObstacle = () => ({
  obstacle: '',
  rope: '',
  observation: '',
  anchor: ''
});

const getDefaultValues = language => ({
  title: '',
  language,
  obstacles: [getDefaultObstacle()]
});

const CreateRiggingsForm = ({
  onSubmit,
  onCancel,
  values,
  isNew,
  onDirtyChange
}) => {
  const { locale, AVAILABLE_LANGUAGES } = useSelector(state => state.intl);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({
    mode: 'onBlur',
    defaultValues: values ?? getDefaultValues(AVAILABLE_LANGUAGES[locale].id)
  });

  const { formatMessage } = useIntl();
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'obstacles'
  });

  // Index of the last appended row, so its obstacle field gets focused.
  const [focusIndex, setFocusIndex] = useState(-1);

  useEffect(() => {
    if (onDirtyChange) onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (focusIndex >= 0) setFocusIndex(-1);
  }, [fields.length, focusIndex]);

  const handleAppend = () => {
    setFocusIndex(fields.length);
    append(getDefaultObstacle());
  };

  const rowActions = index => (
    <ObstacleRowActions
      isFirst={index === 0}
      isLast={index === fields.length - 1}
      onMoveUp={() => swap(index, index - 1)}
      onMoveDown={() => swap(index, index + 1)}
      onDelete={() => remove(index)}
      orientation={isMobile ? 'horizontal' : 'vertical'}
    />
  );

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
        {fields.length > 0 &&
          (isMobile ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {fields.map((item, index) => (
                <ObstacleCard
                  key={item.id}
                  control={control}
                  index={index}
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                  onMoveUp={() => swap(index, index - 1)}
                  onMoveDown={() => swap(index, index + 1)}
                  onDelete={() => remove(index)}
                  autoFocus={index === focusIndex}
                />
              ))}
            </Stack>
          ) : (
            <TableContainer sx={{ mt: 2 }}>
              <Table
                size="small"
                aria-label={formatMessage({ id: 'riggings' })}>
                <TableHead sx={{ '& th': { textTransform: 'capitalize' } }}>
                  <TableRow>
                    {FIELDS.map(field => (
                      <TableCell key={field} width={COLUMN_WIDTHS[field]}>
                        {formatMessage({ id: HEADER_KEYS[field] })}
                      </TableCell>
                    ))}
                    <TableCell width="70px" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      {FIELDS.map(field => (
                        <TableCell
                          key={field}
                          sx={{ px: '4px', py: '6px', verticalAlign: 'top' }}>
                          <ObstacleField
                            control={control}
                            index={index}
                            field={field}
                            autoFocus={
                              index === focusIndex && field === 'obstacle'
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell
                        padding="none"
                        sx={{ verticalAlign: 'middle' }}>
                        {rowActions(index)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ))}
        <Box sx={{ mt: 0.5, mb: 1 }}>
          <Button
            onClick={handleAppend}
            color="secondary"
            variant="outlined"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            startIcon={<PlaylistAddIcon />}>
            {formatMessage({ id: 'New line' })}
          </Button>
        </Box>

        <FormActionRow
          isNew={isNew}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
        />
      </form>
    </FormContainer>
  );
};

CreateRiggingsForm.propTypes = {
  isNew: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  values: RiggingPropTypes,
  onDirtyChange: PropTypes.func
};

export default CreateRiggingsForm;
