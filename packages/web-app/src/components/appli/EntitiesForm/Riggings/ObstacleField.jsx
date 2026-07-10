import React, { useCallback, useRef } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, TextField } from '@mui/material';
import { useController } from 'react-hook-form';
import AnchorToolbar from './AnchorToolbar';
import ObstacleToolbar from './ObstacleToolbar';

const LABEL_KEYS = {
  obstacle: 'Obstacle',
  rope: 'Rope',
  anchor: 'Anchors',
  observation: 'Observations'
};

const ObstacleField = ({
  control,
  index,
  field,
  showLabel = false,
  autoFocus = false
}) => {
  const { formatMessage } = useIntl();
  const label = formatMessage({ id: LABEL_KEYS[field] });
  const isObstacle = field === 'obstacle';
  const isAnchor = field === 'anchor';

  const inputRef = useRef(null);
  const onChangeRef = useRef(null);

  const {
    field: rhfField,
    fieldState: { error }
  } = useController({
    control,
    name: `obstacles.${index}.${field}`,
    rules: { required: isObstacle }
  });

  onChangeRef.current = rhfField.onChange;

  const handleInsertChar = useCallback(char => {
    const el = inputRef.current;
    const currentValue = el?.value ?? '';
    const start = el
      ? (el.selectionStart ?? currentValue.length)
      : currentValue.length;
    const end = el ? (el.selectionEnd ?? start) : start;
    onChangeRef.current(
      currentValue.slice(0, start) + char + currentValue.slice(end)
    );
    if (el) {
      requestAnimationFrame(() => {
        el.selectionStart = start + 1;
        el.selectionEnd = start + 1;
        el.focus();
      });
    }
  }, []);

  const textField = (
    <TextField
      {...rhfField}
      multiline
      minRows={1}
      size="small"
      fullWidth
      autoFocus={autoFocus}
      required={isObstacle}
      error={!!error}
      helperText={
        error
          ? formatMessage({
              id: 'Please delete this line or fill at least the obstacle cell.'
            })
          : ''
      }
      label={showLabel ? label : undefined}
      inputRef={isAnchor ? inputRef : undefined}
      slotProps={{ htmlInput: { 'aria-label': label } }}
    />
  );

  if (isObstacle)
    return (
      <Box sx={{ position: 'relative' }}>
        {textField}
        <ObstacleToolbar />
      </Box>
    );

  if (isAnchor)
    return (
      <Box sx={{ position: 'relative' }}>
        {textField}
        <AnchorToolbar onInsert={handleInsertChar} />
      </Box>
    );

  return textField;
};

ObstacleField.propTypes = {
  control: PropTypes.shape({}).isRequired,
  index: PropTypes.number.isRequired,
  field: PropTypes.oneOf(Object.keys(LABEL_KEYS)).isRequired,
  showLabel: PropTypes.bool,
  autoFocus: PropTypes.bool
};

export default ObstacleField;
