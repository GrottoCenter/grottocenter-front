import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography
} from '@mui/material';
import ExpandMore from '@mui/icons-material/ExpandMore';

const PanoramaDisplayEditor = ({ value, onChange, isNew = false, error }) => {
  const { formatMessage } = useIntl();
  const contentId = useId();
  const helpId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const isAutomatic = isNew && value === undefined;

  return (
    <Box
      data-testid="panorama-display-editor"
      sx={{ textAlign: 'start', borderTop: 1, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', px: 1.5 }}>
        <Button
          type="button"
          size="small"
          variant="text"
          data-testid="panorama-display-toggle"
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? contentId : undefined}
          onClick={() => setIsExpanded(expanded => !expanded)}
          startIcon={
            <ExpandMore
              sx={{ transform: isExpanded ? 'rotate(180deg)' : undefined }}
            />
          }
          sx={{ textTransform: 'none', minHeight: 32, py: 0.25 }}>
          {formatMessage({ id: 'documentForm.displayOptions' })}
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ m: 1.5 }}>
          {formatMessage({ id: error })}
        </Alert>
      )}
      {isExpanded && (
        <Box
          id={contentId}
          sx={{
            p: { xs: 1.5, sm: 2 },
            bgcolor: 'grey.50',
            borderTop: 1,
            borderColor: 'divider'
          }}>
          <FormControlLabel
            sx={{ alignItems: 'flex-start' }}
            control={
              <Checkbox
                checked={value === true}
                indeterminate={isAutomatic}
                onChange={event => onChange(event.target.checked)}
                slotProps={{
                  input: {
                    'data-testid': 'panorama-display-checkbox',
                    'aria-describedby': helpId,
                    'aria-checked': isAutomatic ? 'mixed' : value === true
                  }
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ pt: 1.25 }}>
                {formatMessage({ id: 'panorama.displayImage' })}
              </Typography>
            }
          />
          <Typography
            id={helpId}
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5 }}>
            {formatMessage({
              id: isNew ? 'panorama.detectionHelp' : 'panorama.displayHelp'
            })}
          </Typography>
          {isNew && !isAutomatic && (
            <Button
              type="button"
              size="small"
              sx={{ mt: 1, textTransform: 'none' }}
              onClick={() => onChange(undefined)}>
              {formatMessage({ id: 'panorama.useAutomatic' })}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

PanoramaDisplayEditor.propTypes = {
  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  isNew: PropTypes.bool,
  error: PropTypes.string
};

export default PanoramaDisplayEditor;
