import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, TextField, Typography } from '@mui/material';
import CustomIcon from '@/components/common/CustomIcon';
import { formatDurationUnit } from '@/utils/dateTimeDuration';

const splitMinutes = value =>
  value == null
    ? { hours: '', minutes: '' }
    : {
        hours: String(Math.floor(value / 60)),
        minutes: String(value % 60)
      };

const DurationInput = ({ labelId, helperId, icon, value, onChange }) => {
  const { formatMessage, formatNumberToParts } = useIntl();
  const [parts, setParts] = useState(() => splitMinutes(value));
  const label = formatMessage({ id: labelId });
  const hourUnit = formatDurationUnit('hour', formatNumberToParts);
  const minuteUnit = formatDurationUnit('minute', formatNumberToParts, 'short');

  const handlePartChange = (part, nextValue) => {
    if (!/^\d*$/.test(nextValue)) return;
    if (part === 'minutes' && Number(nextValue) > 59) return;

    const nextParts = { ...parts, [part]: nextValue };
    setParts(nextParts);
    onChange(
      nextParts.hours === '' && nextParts.minutes === ''
        ? null
        : Number(nextParts.hours || 0) * 60 + Number(nextParts.minutes || 0)
    );
  };

  return (
    <Box
      role="group"
      aria-label={label}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '18rem minmax(0, 1fr)' },
        alignItems: 'center',
        columnGap: 2,
        rowGap: 0.5,
        minWidth: 0
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        <Box aria-hidden="true">
          <CustomIcon type={icon} size={24} />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            columnGap: 0.5
          }}>
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
          {helperId && (
            <Typography variant="caption" color="text.secondary">
              ({formatMessage({ id: helperId })})
            </Typography>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 0.75 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="0"
            value={parts.hours}
            onChange={event => handlePartChange('hours', event.target.value)}
            slotProps={{
              htmlInput: {
                inputMode: 'numeric',
                pattern: '[0-9]*',
                'aria-label': `${label} — ${formatMessage({ id: 'Hours' })}`
              }
            }}
            sx={{ width: '4rem' }}
          />
          <Typography variant="body2">{hourUnit}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', columnGap: 0.75 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="00"
            value={parts.minutes}
            onChange={event => handlePartChange('minutes', event.target.value)}
            slotProps={{
              htmlInput: {
                inputMode: 'numeric',
                pattern: '[0-9]*',
                'aria-label': `${label} — ${formatMessage({ id: 'Minutes' })}`
              }
            }}
            sx={{ width: '4rem' }}
          />
          <Typography variant="body2">{minuteUnit}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

DurationInput.propTypes = {
  labelId: PropTypes.string.isRequired,
  helperId: PropTypes.string,
  icon: PropTypes.oneOf(['time_to_go', 'underground_time']).isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired
};

export default DurationInput;
