import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Typography
} from '@mui/material';

import { fetchSensorConfigs } from '../../../../actions/Observations/importWizard';

const SensorConfigList = ({ deviceId }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  const sensorConfigs = useSelector(
    state => state.importWizard.sensorConfigs
  );
  const loading = useSelector(
    state => state.importWizard.sensorConfigsLoading
  );
  const error = useSelector(state => state.importWizard.sensorConfigsError);

  const handleRetry = () => {
    dispatch(fetchSensorConfigs(deviceId));
  };

  if (loading) {
    return (
      <Box data-testid="sensor-config-list-loading">
        <Skeleton variant="rectangular" height={48} sx={{ mb: 0.5 }} />
        <Skeleton variant="rectangular" height={48} sx={{ mb: 0.5 }} />
        <Skeleton variant="rectangular" height={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        data-testid="sensor-config-list-error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={handleRetry}
            data-testid="sensor-config-retry-button">
            {formatMessage({
              id: 'ImportObservationsWizard.DeviceSensorsStep.sensorConfigRetry'
            })}
          </Button>
        }>
        {formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.sensorConfigLoadError'
        })}
      </Alert>
    );
  }

  if (sensorConfigs.length === 0) {
    return (
      <Alert severity="info" data-testid="sensor-config-list-empty">
        {formatMessage({
          id: 'ImportObservationsWizard.DeviceSensorsStep.noSensorsYet'
        })}
      </Alert>
    );
  }

  return (
    <List dense data-testid="sensor-config-list">
      {sensorConfigs.map(config => {
        const secondaryParts = [];
        if (
          config.precisionLower != null &&
          config.precisionUpper != null
        ) {
          secondaryParts.push(
            formatMessage(
              {
                id: 'ImportObservationsWizard.DeviceSensorsStep.sensorPrecision'
              },
              {
                lower: `${config.precisionLower}${config.unitSymbol ? ` ${config.unitSymbol}` : ''}`,
                upper: `${config.precisionUpper}${config.unitSymbol ? ` ${config.unitSymbol}` : ''}`
              }
            )
          );
        }
        if (config.resolution != null) {
          secondaryParts.push(
            `${formatMessage({ id: 'ImportObservationsWizard.DeviceSensorsStep.resolution' })}: ${config.resolution}${config.unitSymbol ? ` ${config.unitSymbol}` : ''}`
          );
        }
        if (
          config.detectionLimitMin != null &&
          config.detectionLimitMax != null
        ) {
          secondaryParts.push(
            `${formatMessage({ id: 'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMin' })}: ${config.detectionLimitMin}${config.unitSymbol ? ` ${config.unitSymbol}` : ''} – ${formatMessage({ id: 'ImportObservationsWizard.DeviceSensorsStep.detectionLimitMax' })}: ${config.detectionLimitMax}${config.unitSymbol ? ` ${config.unitSymbol}` : ''}`
          );
        }

        return (
          <ListItem key={config.id} divider data-testid="sensor-config-item">
            <ListItemText
              primary={
                <Typography variant="body2">
                  {config.label
                    ? `${config.label} — `
                    : ''}
                  {config.substanceName
                    ? `${formatMessage({ id: `quantityKind.${config.quantityKindCode}` })} [${config.substanceName}] (${config.unitSymbol || ''})`
                    : `${formatMessage({ id: `quantityKind.${config.quantityKindCode}` })} (${config.unitSymbol || ''})`}
                </Typography>
              }
              secondary={
                secondaryParts.length > 0
                  ? secondaryParts.join(' | ')
                  : undefined
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

SensorConfigList.propTypes = {
  deviceId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

export default SensorConfigList;
