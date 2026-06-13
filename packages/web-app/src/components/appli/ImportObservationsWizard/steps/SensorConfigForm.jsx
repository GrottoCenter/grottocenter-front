import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  InputAdornment,
  MenuItem,
  TextField,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import { useNotification } from '../../../../hooks';
import { createSensorConfig } from '../../../../actions/Observations/importWizard';
import { QUANTITY_KINDS } from '../constants/quantityKinds';
import { UNITS } from '../constants/units';
import { QUANTITY_KIND_UNITS_MAP } from '../constants/quantityKindUnitsMap';

const initialFormState = {
  label: '',
  quantityKindId: '',
  unitId: '',
  precisionUpper: '',
  precisionLower: '',
  resolution: '',
  detectionLimitMin: '',
  detectionLimitMax: ''
};

const SensorConfigForm = ({ deviceId }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { onSuccess } = useNotification();

  const sortedQuantityKinds = useMemo(
    () =>
      [...QUANTITY_KINDS].sort((a, b) =>
        formatMessage({ id: `quantityKind.${a.code}` }).localeCompare(
          formatMessage({ id: `quantityKind.${b.code}` })
        )
      ),
    [formatMessage]
  );

  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const compatibleUnits = useMemo(() => {
    if (!form.quantityKindId) return [];
    const unitIds = QUANTITY_KIND_UNITS_MAP[form.quantityKindId] || [];
    return UNITS.filter(u => unitIds.includes(u.id));
  }, [form.quantityKindId]);

  const selectedUnit = useMemo(
    () => UNITS.find(u => u.id === Number(form.unitId)) || null,
    [form.unitId]
  );

  const unitSymbol = selectedUnit ? selectedUnit.symbol : '';

  const handleFieldChange = useCallback(
    field => e => {
      const value = e.target.value;
      setForm(prev => {
        const next = { ...prev, [field]: value };
        // Preselect first compatible unit when quantity kind changes
        if (field === 'quantityKindId') {
          const unitIds = QUANTITY_KIND_UNITS_MAP[value] || [];
          const firstUnit = UNITS.find(u => unitIds.includes(u.id));
          next.unitId = firstUnit ? firstUnit.id : '';
        }
        return next;
      });
      // Clear validation errors on change
      setValidationErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const validate = useCallback(() => {
    const errors = {};
    const precLower = form.precisionLower !== '' ? Number(form.precisionLower) : null;
    const precUpper = form.precisionUpper !== '' ? Number(form.precisionUpper) : null;
    const detMin = form.detectionLimitMin !== '' ? Number(form.detectionLimitMin) : null;
    const detMax = form.detectionLimitMax !== '' ? Number(form.detectionLimitMax) : null;

    if (precLower != null && precUpper != null && precLower > precUpper) {
      errors.precisionLower = formatMessage({
        id: 'ImportObservationsWizard.DeviceSensorsStep.validationPrecisionError'
      });
    }
    if (detMin != null && detMax != null && detMin > detMax) {
      errors.detectionLimitMin = formatMessage({
        id: 'ImportObservationsWizard.DeviceSensorsStep.validationDetectionError'
      });
    }
    return errors;
  }, [form, formatMessage]);

  const canSubmit =
    form.quantityKindId !== '' && form.unitId !== '' && !isSubmitting;

  const handleSubmit = useCallback(async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const configData = {
      deviceId,
      label: form.label.trim() || undefined,
      quantityKindId: Number(form.quantityKindId),
      unitId: Number(form.unitId),
      precisionUpper:
        form.precisionUpper !== '' ? Number(form.precisionUpper) : null,
      precisionLower:
        form.precisionLower !== '' ? Number(form.precisionLower) : null,
      resolution: form.resolution !== '' ? Number(form.resolution) : null,
      detectionLimitMin:
        form.detectionLimitMin !== ''
          ? Number(form.detectionLimitMin)
          : null,
      detectionLimitMax:
        form.detectionLimitMax !== ''
          ? Number(form.detectionLimitMax)
          : null
    };

    try {
      await dispatch(createSensorConfig(configData));
      setForm(initialFormState);
      setValidationErrors({});
      onSuccess(
        formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.sensorConfigCreated'
        })
      );
    } catch {
      setSubmitError(
        formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.createSensorConfigError'
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, validate, dispatch, deviceId, formatMessage, onSuccess]);

  const endAdornment = unitSymbol
    ? { endAdornment: <InputAdornment position="end">{unitSymbol}</InputAdornment> }
    : {};

  return (
    <Box data-testid="sensor-config-form">
      <Typography variant="subtitle2" sx={{ mb: 2 }}>
        {formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.addSensorTitle'
        })}
      </Typography>

      {submitError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          data-testid="sensor-config-form-error">
          {submitError}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 480 }}>
        {/* Label — optional human-readable name */}
        <TextField
          label={formatMessage({
            id: 'ImportObservationsWizard.DeviceSensorsStep.sensorConfigLabel'
          })}
          value={form.label}
          onChange={handleFieldChange('label')}
          size="small"
          inputProps={{ maxLength: 300 }}
          data-testid="sensor-config-label"
        />

        {/* Quantity Kind and Unit dropdowns — side by side */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            select
            label={formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.quantityKind'
            })}
            value={form.quantityKindId}
            onChange={handleFieldChange('quantityKindId')}
            size="small"
            sx={{ flex: 1 }}
            SelectProps={{ displayEmpty: true }}
            data-testid="sensor-config-quantity-kind">
            {sortedQuantityKinds.map(qk => (
              <MenuItem key={qk.id} value={qk.id}>
                {formatMessage({ id: `quantityKind.${qk.code}` })}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label={formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.unit'
            })}
            value={form.unitId}
            onChange={handleFieldChange('unitId')}
            size="small"
            disabled={!form.quantityKindId}
            sx={{ minWidth: 100 }}
            data-testid="sensor-config-unit">
            {compatibleUnits.map(u => (
              <MenuItem key={u.id} value={u.id}>
                {u.symbol}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Advanced fields */}
        <Accordion
          defaultExpanded={false}
          data-testid="sensor-config-advanced">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2">
              {formatMessage({
                id: 'ImportObservationsWizard.DeviceSensorsStep.advancedFields'
              })}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box
              sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Precision: lower first, side by side */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={formatMessage({
                    id: 'ImportObservationsWizard.DeviceSensorsStep.precisionLower'
                  })}
                  value={form.precisionLower}
                  onChange={handleFieldChange('precisionLower')}
                  size="small"
                  type="number"
                  error={!!validationErrors.precisionLower}
                  helperText={validationErrors.precisionLower || ''}
                  slotProps={{ input: endAdornment }}
                  sx={{ flex: 1 }}
                  data-testid="sensor-config-precision-lower"
                />
                <TextField
                  label={formatMessage({
                    id: 'ImportObservationsWizard.DeviceSensorsStep.precisionUpper'
                  })}
                  value={form.precisionUpper}
                  onChange={handleFieldChange('precisionUpper')}
                  size="small"
                  type="number"
                  slotProps={{ input: endAdornment }}
                  sx={{ flex: 1 }}
                  data-testid="sensor-config-precision-upper"
                />
              </Box>
              {/* Resolution */}
              <Box sx={{ display: 'flex' }}>
                <TextField
                  label={formatMessage({
                    id: 'ImportObservationsWizard.DeviceSensorsStep.resolution'
                  })}
                  value={form.resolution}
                  onChange={handleFieldChange('resolution')}
                  size="small"
                  type="number"
                  slotProps={{ input: endAdornment }}
                  sx={{ flex: 1, maxWidth: 'calc(50% - 8px)' }}
                  data-testid="sensor-config-resolution"
                />
              </Box>
              {/* Detection limits: min first, side by side */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={formatMessage({
                    id: 'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMin'
                  })}
                  value={form.detectionLimitMin}
                  onChange={handleFieldChange('detectionLimitMin')}
                  size="small"
                  type="number"
                  error={!!validationErrors.detectionLimitMin}
                  helperText={validationErrors.detectionLimitMin || ''}
                  slotProps={{ input: endAdornment }}
                  sx={{ flex: 1 }}
                  data-testid="sensor-config-detection-min"
                />
                <TextField
                  label={formatMessage({
                    id: 'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMax'
                  })}
                  value={form.detectionLimitMax}
                  onChange={handleFieldChange('detectionLimitMax')}
                  size="small"
                  type="number"
                  slotProps={{ input: endAdornment }}
                  sx={{ flex: 1 }}
                  data-testid="sensor-config-detection-max"
                />
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="small"
            data-testid="sensor-config-submit">
            {formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.addSensorConfig'
            })}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

SensorConfigForm.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default SensorConfigForm;
