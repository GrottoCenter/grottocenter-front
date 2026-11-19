import { useId } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

const COMPARISON_COLUMNS = 'minmax(0, 0.85fr) minmax(0, 1fr) minmax(0, 1.25fr)';

export const DocumentAiComparisonHeader = () => {
  const { formatMessage } = useIntl();
  return (
    <Box
      aria-hidden="true"
      sx={{
        display: { xs: 'none', sm: 'grid' },
        gridTemplateColumns: COMPARISON_COLUMNS,
        columnGap: 2,
        px: 2,
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.default'
      }}>
      {[
        'Information',
        'documentAi.currentValue',
        'documentAi.proposedValue'
      ].map(id => (
        <Typography key={id} variant="body2" sx={{ fontWeight: 600 }}>
          {formatMessage({ id })}
        </Typography>
      ))}
    </Box>
  );
};

// Keep the field, current value and suggestion on the same row on desktop.
// Mobile repeats the column labels inline so the values stay easy to identify.
const DocumentAiSuggestion = ({
  name,
  label,
  currentValue,
  suggestedValue,
  isSame,
  selected,
  disabled,
  onChange,
  valueControl
}) => {
  const { formatMessage } = useIntl();
  const labelId = useId();
  const shouldReplace = selected && !isSame && Boolean(currentValue);
  return (
    <Box
      component="section"
      aria-labelledby={labelId}
      data-testid={`document-ai-field-${name}`}
      data-selected={selected}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: COMPARISON_COLUMNS },
        columnGap: 2,
        rowGap: 0.75,
        alignItems: 'start',
        px: { xs: 1.5, sm: 2 },
        py: 1,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: theme =>
          selected ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
        '&:last-child': { borderBottom: 0 }
      }}>
      <Box sx={{ minWidth: 0 }}>
        {isSame ? (
          <Typography
            id={labelId}
            variant="body2"
            component="h3"
            sx={{ fontWeight: 600, py: { xs: 0.5, sm: 1.5 } }}>
            {label}
          </Typography>
        ) : (
          <FormControlLabel
            sx={{ m: 0, ml: -1.25, minHeight: 44, alignItems: 'center' }}
            control={
              <Checkbox
                checked={selected}
                disabled={disabled}
                onChange={onChange}
              />
            }
            label={
              <Typography
                id={labelId}
                variant="body2"
                component="span"
                sx={{ fontWeight: 600 }}>
                {label}
              </Typography>
            }
          />
        )}
      </Box>
      <Box
        role="group"
        aria-label={
          currentValue
            ? formatMessage({ id: 'documentAi.currentValue' })
            : `${formatMessage({ id: 'documentAi.currentValue' })}: ${formatMessage({ id: 'documentAi.notProvided' })}`
        }
        data-testid="document-ai-current-value"
        sx={{
          minWidth: 0,
          pt: { sm: 1.5 },
          display: { xs: currentValue ? 'block' : 'none', sm: 'block' }
        }}>
        <Typography
          variant="body2"
          component="div"
          color="text.secondary"
          sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              display: { xs: 'inline', sm: 'none' },
              fontWeight: 600
            }}>
            {formatMessage({ id: 'documentAi.currentValue' })}:{' '}
          </Box>
          <Box
            component={shouldReplace ? 'del' : 'span'}
            aria-hidden={currentValue ? undefined : true}
            data-testid="document-ai-current-text">
            {currentValue || '-'}
          </Box>
        </Typography>
      </Box>
      <Box
        role="group"
        aria-label={
          isSame && !valueControl
            ? `${formatMessage({ id: 'documentAi.proposedValue' })}: ${formatMessage({ id: 'documentAi.identical' })}`
            : formatMessage({ id: 'documentAi.proposedValue' })
        }
        data-testid="document-ai-proposed-value"
        sx={{
          minWidth: 0,
          pt: { sm: 1.5 },
          display: {
            xs: isSame && !valueControl ? 'none' : 'block',
            sm: 'block'
          },
          '& p': { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }
        }}>
        {valueControl || (
          <Typography
            variant="body2"
            component="div"
            data-testid={`document-ai-value-${name}`}
            sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            <Box
              component="span"
              aria-hidden="true"
              sx={{ display: { xs: 'inline', sm: 'none' }, fontWeight: 600 }}>
              {formatMessage({ id: 'documentAi.proposedValue' })}:{' '}
            </Box>
            <Box component="span" aria-hidden={isSame ? true : undefined}>
              {isSame ? '-' : suggestedValue}
            </Box>
          </Typography>
        )}
      </Box>
    </Box>
  );
};

DocumentAiSuggestion.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  currentValue: PropTypes.string.isRequired,
  suggestedValue: PropTypes.string.isRequired,
  isSame: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
  disabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  valueControl: PropTypes.node
};

export default DocumentAiSuggestion;
