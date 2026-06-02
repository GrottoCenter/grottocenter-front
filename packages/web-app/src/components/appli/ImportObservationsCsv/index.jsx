import React, { useReducer, useCallback } from 'react';
import {
  Box,
  Button,
  Container,
  Step,
  StepLabel,
  Stepper,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import StepUpload from './StepUpload';
import StepMapping from './StepMapping';
import StepValidation from './StepValidation';
import StepDownload from './StepDownload';
import { COLUMN_ROLES, STEPS } from './constants';
import { hasValidTimestampConfig } from './timestampUtils';

const STEP_LABELS = ['Upload CSV', 'Map Columns', 'Validate', 'Download SQL'];

const initialState = {
  activeStep: STEPS.UPLOAD,
  rawData: [],
  fileName: null,
  profileName: null,
  headerRow: 0,
  skipLastRows: 0,
  numberLocale: 'en',
  encoding: 'UTF-8',
  columnMappings: {},
  dateFormat: 'yyyy-MM-dd HH:mm:ss',
  dateOnlyFormat: 'yyyy-MM-dd',
  timeOnlyFormat: 'HH:mm:ss',
  timezone: 'UTC',
  caveId: '',
  pointLabel: '',
  authorId: '',
  validationResult: null
};

const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_ACTIVE_STEP':
      return { ...state, activeStep: action.payload };
    case 'SET_RAW_DATA':
      return { ...state, rawData: action.payload, columnMappings: {} };
    case 'SET_FILE_NAME':
      return { ...state, fileName: action.payload };
    case 'SET_PROFILE_NAME':
      return { ...state, profileName: action.payload };
    case 'SET_ENCODING':
      return { ...state, encoding: action.payload };
    case 'SET_HEADER_ROW':
      return { ...state, headerRow: action.payload, columnMappings: {} };
    case 'SET_SKIP_LAST_ROWS':
      return { ...state, skipLastRows: action.payload };
    case 'SET_NUMBER_LOCALE':
      return { ...state, numberLocale: action.payload };
    case 'SET_COLUMN_ROLE': {
      const { colIndex, role } = action.payload;
      const newMappings = { ...state.columnMappings };
      newMappings[colIndex] = { ...newMappings[colIndex], role };
      // Clear timestampType when switching away from timestamp
      if (role !== COLUMN_ROLES.TIMESTAMP) {
        delete newMappings[colIndex].timestampType;
      }
      return { ...state, columnMappings: newMappings };
    }
    case 'SET_COLUMN_TIMESTAMP_TYPE': {
      const { colIndex, timestampType } = action.payload;
      const newMappings = { ...state.columnMappings };

      // Types that can only appear once (datetime, year, month, day, hour, minute, second)
      // elapsed_seconds can appear multiple times (they stack)
      if (timestampType !== 'elapsed_seconds') {
        Object.keys(newMappings).forEach(idx => {
          if (
            Number(idx) !== colIndex &&
            newMappings[idx].role === COLUMN_ROLES.TIMESTAMP &&
            newMappings[idx].timestampType === timestampType
          ) {
            newMappings[idx] = { ...newMappings[idx], timestampType: undefined };
          }
        });
      }

      newMappings[colIndex] = { ...newMappings[colIndex], timestampType };
      return { ...state, columnMappings: newMappings };
    }
    case 'SET_COLUMN_QUANTITY_KIND': {
      const { colIndex, quantityKind } = action.payload;
      const newMappings = { ...state.columnMappings };
      newMappings[colIndex] = { ...newMappings[colIndex], quantityKind };
      return { ...state, columnMappings: newMappings };
    }
    case 'SET_COLUMN_UNIT': {
      const { colIndex, unit } = action.payload;
      const newMappings = { ...state.columnMappings };
      newMappings[colIndex] = { ...newMappings[colIndex], unit };
      return { ...state, columnMappings: newMappings };
    }
    case 'SET_COLUMN_MEDIUM': {
      const { colIndex, medium } = action.payload;
      const newMappings = { ...state.columnMappings };
      newMappings[colIndex] = { ...newMappings[colIndex], medium };
      return { ...state, columnMappings: newMappings };
    }
    case 'SET_DATE_FORMAT':
      return { ...state, dateFormat: action.payload };
    case 'SET_DATE_ONLY_FORMAT':
      return { ...state, dateOnlyFormat: action.payload };
    case 'SET_TIME_ONLY_FORMAT':
      return { ...state, timeOnlyFormat: action.payload };
    case 'SET_TIMEZONE':
      return { ...state, timezone: action.payload };
    case 'SET_CAVE_ID':
      return { ...state, caveId: action.payload };
    case 'SET_POINT_LABEL':
      return { ...state, pointLabel: action.payload };
    case 'SET_AUTHOR_ID':
      return { ...state, authorId: action.payload };
    case 'SET_VALIDATION_RESULT':
      return { ...state, validationResult: action.payload };
    case 'SET_PROFILE': {
      const profile = action.payload;
      return {
        ...state,
        encoding: profile.encoding || state.encoding,
        headerRow: profile.headerRow !== undefined ? profile.headerRow : state.headerRow,
        skipLastRows: profile.skipLastRows !== undefined ? profile.skipLastRows : state.skipLastRows,
        numberLocale: profile.numberLocale || state.numberLocale,
        columnMappings: profile.columnMappings || state.columnMappings,
        dateFormat: profile.dateFormat || state.dateFormat,
        dateOnlyFormat: profile.dateOnlyFormat || state.dateOnlyFormat,
        timeOnlyFormat: profile.timeOnlyFormat || state.timeOnlyFormat,
        timezone: profile.timezone || state.timezone,
        caveId: profile.caveId !== undefined ? profile.caveId : state.caveId,
        pointLabel: profile.pointLabel !== undefined ? profile.pointLabel : state.pointLabel,
        authorId: profile.authorId !== undefined ? profile.authorId : state.authorId
      };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

const canAdvance = (state, step) => {
  switch (step) {
    case STEPS.UPLOAD:
      return state.rawData.length > 1; // at least header + 1 data row
    case STEPS.MAPPING: {
      const maxCols = state.rawData.reduce((max, row) => Math.max(max, row.length), 0);
      const mappings = state.columnMappings;

      // All columns must have a role assigned
      const allColumnsAssigned = maxCols > 0
        && Array.from({ length: maxCols }, (_, i) => i)
          .every(i => mappings[i] && mappings[i].role);

      if (!allColumnsAssigned) return false;

      const timestampOk = hasValidTimestampConfig(mappings);

      const hasMeasurement = Object.values(mappings).some(
        m =>
          m.role === COLUMN_ROLES.MEASUREMENT &&
          m.quantityKind &&
          m.unit
      );
      return timestampOk && hasMeasurement;
    }
    case STEPS.VALIDATION:
      return (
        state.validationResult &&
        state.validationResult.errors.length === 0 &&
        state.validationResult.validCount > 0
      );
    default:
      return false;
  }
};

const ImportObservationsCsv = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handleNext = useCallback(() => {
    dispatch({
      type: 'SET_ACTIVE_STEP',
      payload: state.activeStep + 1
    });
  }, [state.activeStep]);

  const handleBack = useCallback(() => {
    dispatch({
      type: 'SET_ACTIVE_STEP',
      payload: state.activeStep - 1
    });
  }, [state.activeStep]);

  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const handleExportProfile = useCallback(() => {
    const profile = {
      encoding: state.encoding,
      headerRow: state.headerRow,
      skipLastRows: state.skipLastRows,
      numberLocale: state.numberLocale,
      columnMappings: state.columnMappings,
      dateFormat: state.dateFormat,
      dateOnlyFormat: state.dateOnlyFormat,
      timeOnlyFormat: state.timeOnlyFormat,
      timezone: state.timezone,
      caveId: state.caveId,
      pointLabel: state.pointLabel,
      authorId: state.authorId
    };
    const blob = new Blob(
      [JSON.stringify(profile, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const profileName = (state.pointLabel || 'import')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    a.download = `${profileName}_profile.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state.encoding, state.headerRow, state.skipLastRows, state.numberLocale, state.columnMappings, state.dateFormat, state.dateOnlyFormat, state.timeOnlyFormat, state.timezone, state.caveId, state.pointLabel, state.authorId]);

  const renderStep = () => {
    switch (state.activeStep) {
      case STEPS.UPLOAD:
        return <StepUpload state={state} dispatch={dispatch} />;
      case STEPS.MAPPING:
        return <StepMapping state={state} dispatch={dispatch} />;
      case STEPS.VALIDATION:
        return <StepValidation state={state} dispatch={dispatch} />;
      case STEPS.DOWNLOAD:
        return <StepDownload state={state} dispatch={dispatch} onExportProfile={handleExportProfile} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Import Scientific Observations (CSV)
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload a CSV file from a data logger, map columns to measurement types,
        and generate a SQL import script.
      </Typography>

      <Stepper activeStep={state.activeStep} sx={{ mb: 4 }}>
        {STEP_LABELS.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 300, mb: 3 }}>{renderStep()}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            disabled={state.activeStep === STEPS.UPLOAD}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}>
            Back
          </Button>
          <Button
            disabled={state.rawData.length === 0}
            onClick={handleReset}
            color="warning"
            size="small">
            Start over
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {state.activeStep < STEPS.DOWNLOAD && (
            <Button
              variant="contained"
              disabled={!canAdvance(state, state.activeStep)}
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}>
              Next
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default ImportObservationsCsv;
