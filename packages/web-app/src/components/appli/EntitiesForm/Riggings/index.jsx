import { useEffect, useState } from 'react';
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
  Typography,
  useMediaQuery
} from '@mui/material';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { useTheme } from '@mui/material/styles';

import { OBSTACLE_LEGEND, ANCHOR_LEGEND } from '@/utils/riggingLegends';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import {
  RIGGING_COLUMNS,
  getRiggingColumnLengths,
  hasOversizedRiggingColumn
} from '@/utils/riggingColumnLengths';
import { FormContainer, FormActionRow, FormRow } from '../utils/FormContainers';
import InputText from '../utils/InputText';
import InputLanguage from '../utils/InputLanguage';
import ObstacleField from './ObstacleField';
import ObstacleRowActions from './ObstacleRowActions';
import ObstacleCard from './ObstacleCard';
import ColumnLegend, { LegendHeader } from '../../Entry/Riggings/ColumnLegend';

import { RiggingPropTypes } from '../../../../types/entrance.type';

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
const HEADER_LEGENDS = {
  obstacle: { titleKey: 'Obstacle notation legend', items: OBSTACLE_LEGEND },
  anchor: { titleKey: 'Anchor notation legend', items: ANCHOR_LEGEND }
};
const LEGEND_SECTIONS = [HEADER_LEGENDS.obstacle, HEADER_LEGENDS.anchor];

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

  // Live values, so the submit button reflects validity as the user types.
  // The title is always required. Zero rows is valid (a title-only rigging is
  // allowed); a rigging is only invalid when an existing row has an empty
  // obstacle (the only required cell) — matching the inline field-level error.
  const watchedTitle = useWatch({ control, name: 'title' });
  const watchedObstacles = useWatch({ control, name: 'obstacles' });
  const columnLengths = getRiggingColumnLengths(watchedObstacles);
  const isFormInvalid =
    !watchedTitle?.trim() ||
    (watchedTitle?.length ?? 0) > TEXT_LENGTH_LIMITS.TITLE ||
    (watchedObstacles ?? []).some(row => !row?.obstacle?.trim()) ||
    hasOversizedRiggingColumn(columnLengths);

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

  const handleValidSubmit = data => {
    if (!hasOversizedRiggingColumn(getRiggingColumnLengths(data.obstacles)))
      return onSubmit(data);
    return undefined;
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

  const columnCount = (field, showLabel = false) => (
    <Typography
      variant="caption"
      color={
        columnLengths[field] > TEXT_LENGTH_LIMITS.RIGGING_COLUMN
          ? 'error'
          : 'text.secondary'
      }>
      {showLabel && `${formatMessage({ id: HEADER_KEYS[field] })}: `}
      {columnLengths[field]} / {TEXT_LENGTH_LIMITS.RIGGING_COLUMN}
    </Typography>
  );

  return (
    <FormContainer sx={{ marginTop: 1 }}>
      <form autoComplete="off" onSubmit={handleSubmit(handleValidSubmit)}>
        <FormRow>
          <InputText
            formKey="title"
            labelName="Title"
            control={control}
            isError={!!errors?.title}
            isRequired
            maxLength={TEXT_LENGTH_LIMITS.TITLE}
          />

          <InputLanguage
            formKey="language"
            control={control}
            isError={!!errors?.language}
          />
        </FormRow>
        {fields.length > 0 &&
          (isMobile ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {RIGGING_COLUMNS.map(field => (
                  <Box key={field}>{columnCount(field, true)}</Box>
                ))}
              </Stack>
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
                  legendSections={LEGEND_SECTIONS}
                  oversizedColumns={RIGGING_COLUMNS.filter(
                    field =>
                      columnLengths[field] > TEXT_LENGTH_LIMITS.RIGGING_COLUMN
                  )}
                />
              ))}
            </Stack>
          ) : (
            <TableContainer sx={{ mt: 1 }}>
              <Table
                size="small"
                aria-label={formatMessage({ id: 'riggings' })}
                sx={{ mb: 0 }}>
                <TableHead sx={{ '& th': { textTransform: 'capitalize' } }}>
                  <TableRow>
                    {RIGGING_COLUMNS.map(field => (
                      <TableCell key={field} width={COLUMN_WIDTHS[field]}>
                        <LegendHeader>
                          {formatMessage({ id: HEADER_KEYS[field] })}
                          {columnCount(field)}
                          {HEADER_LEGENDS[field] && (
                            <ColumnLegend
                              titleKey={HEADER_LEGENDS[field].titleKey}
                              items={HEADER_LEGENDS[field].items}
                            />
                          )}
                        </LegendHeader>
                      </TableCell>
                    ))}
                    <TableCell width="70px" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fields.map((item, index) => (
                    <TableRow key={item.id}>
                      {RIGGING_COLUMNS.map(field => (
                        <TableCell
                          key={field}
                          sx={{ px: '4px', py: '6px', verticalAlign: 'top' }}>
                          <ObstacleField
                            control={control}
                            index={index}
                            field={field}
                            isColumnTooLong={
                              columnLengths[field] >
                              TEXT_LENGTH_LIMITS.RIGGING_COLUMN
                            }
                            autoFocus={
                              index === focusIndex && field === 'obstacle'
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell
                        padding="none"
                        sx={{ verticalAlign: 'top', pt: '6px' }}>
                        {rowActions(index)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ))}
        <Box sx={{ mt: 1, mb: 1 }}>
          <Button
            onClick={handleAppend}
            color="secondary"
            variant="outlined"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
            startIcon={<PlaylistAddIcon />}>
            {formatMessage({ id: 'Add an obstacle' })}
          </Button>
        </Box>

        <FormActionRow
          isNew={isNew}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          disabled={isFormInvalid}
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
