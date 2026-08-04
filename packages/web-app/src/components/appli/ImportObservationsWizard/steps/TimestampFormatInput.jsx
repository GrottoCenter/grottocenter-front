import { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import {
  getTokensForType,
  SEPARATORS,
  validateFormat
} from './utils/timestampFormatUtils';

const PLACEHOLDERS = {
  timeOnly: 'HH:mm:ss',
  dateOnly: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm:ss'
};

// ─── Token descriptions (keyed by token value) ───────────────────────────────

const TOKEN_DESCRIPTIONS = {
  YYYY: { example: '2024' },
  YY: { example: '24' },
  MM: { example: '01' },
  M: { example: '1' },
  DD: { example: '09' },
  D: { example: '9' },
  HH: { example: '14' },
  H: { example: '3' },
  hh: { example: '02' },
  h: { example: '2' },
  mm: { example: '05' },
  m: { example: '5' },
  ss: { example: '09' },
  s: { example: '9' },
  SSS: { example: '123' },
  A: { example: 'AM' }
};

// ─── ValidationIndicator ──────────────────────────────────────────────────────

const ValidationIndicator = ({ validation, sampleCount }) => {
  const { formatMessage } = useIntl();

  if (validation.isValid) {
    const message = formatMessage(
      { id: 'ImportObservationsWizard.FormatPillBuilder.allSamplesParse' },
      { count: sampleCount }
    );
    return (
      <Tooltip title={message}>
        <CheckCircleIcon
          sx={{ color: 'success.main', fontSize: 18, cursor: 'default' }}
          data-testid="validation-indicator-valid"
        />
      </Tooltip>
    );
  }

  const message = formatMessage(
    { id: 'ImportObservationsWizard.FormatPillBuilder.samplesFail' },
    { count: validation.failCount, total: sampleCount }
  );
  return (
    <Tooltip title={message}>
      <CancelIcon
        sx={{ color: 'error.main', fontSize: 18, cursor: 'default' }}
        data-testid="validation-indicator-invalid"
      />
    </Tooltip>
  );
};

ValidationIndicator.propTypes = {
  validation: PropTypes.shape({
    isValid: PropTypes.bool.isRequired,
    failCount: PropTypes.number.isRequired
  }).isRequired,
  sampleCount: PropTypes.number.isRequired
};

// ─── ParsedPreview ────────────────────────────────────────────────────────────

const getFormatOptions = timestampType => {
  if (timestampType === 'dateOnly') {
    return { year: 'numeric', month: 'short', day: 'numeric' };
  }
  if (timestampType === 'timeOnly') {
    return { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  }
  return {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
};

const ParsedPreview = ({ sampleValue, parsedDate, timestampType }) => {
  if (!parsedDate) return null;

  const options = getFormatOptions(timestampType);
  const formatted =
    timestampType === 'timeOnly'
      ? parsedDate.toLocaleTimeString('en-US', options)
      : parsedDate.toLocaleDateString('en-US', options);

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{
        display: 'block'
      }}
      data-testid="parsed-preview">
      {sampleValue} → {formatted}
    </Typography>
  );
};

ParsedPreview.propTypes = {
  sampleValue: PropTypes.string.isRequired,
  parsedDate: PropTypes.instanceOf(Date),
  timestampType: PropTypes.oneOf(['datetime', 'dateOnly', 'timeOnly'])
};

// ─── TokenReferenceTooltip ─────────────────────────────────────────────────────

const TokenReferenceContent = ({ tokens }) => {
  const { formatMessage } = useIntl();

  return (
    <Box sx={{ p: 0.5, minWidth: 420 }} data-testid="token-reference-popover">
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {formatMessage({
          id: 'ImportObservationsWizard.FormatInput.tokensTitle'
        })}
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 'bold'
              }}>
              {formatMessage({
                id: 'ImportObservationsWizard.FormatInput.tokenColumn'
              })}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold'
              }}>
              {formatMessage({
                id: 'ImportObservationsWizard.FormatInput.meaningColumn'
              })}
            </TableCell>
            <TableCell
              sx={{
                fontWeight: 'bold'
              }}>
              {formatMessage({
                id: 'ImportObservationsWizard.FormatInput.exampleColumn'
              })}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tokens.map(token => (
            <TableRow key={token}>
              <TableCell
                sx={{
                  fontFamily: 'monospace'
                }}>
                {token}
              </TableCell>
              <TableCell>
                {formatMessage({
                  id: `ImportObservationsWizard.FormatInput.token.${token}`
                })}
              </TableCell>
              <TableCell
                sx={{
                  fontFamily: 'monospace'
                }}>
                {TOKEN_DESCRIPTIONS[token]?.example || ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: 'block' }}>
        {formatMessage(
          { id: 'ImportObservationsWizard.FormatInput.separatorsHint' },
          {
            separators: SEPARATORS.map(s => (s === ' ' ? '⎵' : s)).join('  ')
          }
        )}
      </Typography>
    </Box>
  );
};

TokenReferenceContent.propTypes = {
  tokens: PropTypes.arrayOf(PropTypes.string).isRequired
};

// ─── TimestampFormatInput ─────────────────────────────────────────────────────

const TimestampFormatInput = ({
  timestampType,
  sampleValues = [],
  currentFormat = '',
  onChange
}) => {
  const { formatMessage } = useIntl();

  const tokens = useMemo(
    () => getTokensForType(timestampType),
    [timestampType]
  );

  const validation = useMemo(
    () => validateFormat(currentFormat, sampleValues),
    [currentFormat, sampleValues]
  );

  const showValidation = currentFormat.length > 0 && sampleValues.length > 0;

  const handleChange = useCallback(
    e => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const placeholder = PLACEHOLDERS[timestampType] ?? PLACEHOLDERS.datetime;

  return (
    <Box data-testid="format-pill-builder">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TextField
          size="small"
          value={currentFormat}
          onChange={handleChange}
          placeholder={placeholder}
          sx={{ minWidth: 220 }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip
                    title={<TokenReferenceContent tokens={tokens} />}
                    placement="bottom-start"
                    slotProps={{
                      tooltip: {
                        sx: {
                          maxWidth: 500,
                          bgcolor: 'background.paper',
                          color: 'text.primary',
                          boxShadow: 4
                        }
                      }
                    }}>
                    <IconButton
                      size="small"
                      data-testid="format-help-button"
                      aria-label={formatMessage({
                        id: 'ImportObservationsWizard.FormatInput.helpAriaLabel'
                      })}>
                      <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }
          }}
          data-testid="format-input"
        />
        {showValidation && (
          <ValidationIndicator
            validation={validation}
            sampleCount={sampleValues.length}
          />
        )}
      </Box>
      {validation.isValid && validation.parsedFirst && sampleValues[0] && (
        <ParsedPreview
          sampleValue={sampleValues[0]}
          parsedDate={validation.parsedFirst}
          timestampType={timestampType}
        />
      )}
    </Box>
  );
};

TimestampFormatInput.propTypes = {
  timestampType: PropTypes.oneOf(['datetime', 'dateOnly', 'timeOnly'])
    .isRequired,
  sampleValues: PropTypes.arrayOf(PropTypes.string).isRequired,
  currentFormat: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default TimestampFormatInput;
