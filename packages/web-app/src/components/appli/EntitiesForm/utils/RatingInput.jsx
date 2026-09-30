import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, IconButton, Rating, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { getRatingLevelIds } from '@/utils/visitRatingLevels';

const RatingInput = ({
  labelId,
  value,
  onChange,
  descriptionIds = [],
  precision = 1,
  valueMultiplier = 1
}) => {
  const { formatMessage, formatNumber } = useIntl();
  const [hoveredRating, setHoveredRating] = useState(null);
  const [focusedRating, setFocusedRating] = useState(null);
  const selectedRating = value == null ? null : value / valueMultiplier;
  const activeRating = hoveredRating ?? focusedRating ?? selectedRating;

  const description = getRatingLevelIds(activeRating, descriptionIds)
    .map(id => formatMessage({ id }))
    .join(' – ');

  const activeLabel =
    activeRating == null
      ? formatMessage({ id: 'No Rating' })
      : `${formatMessage(
          { id: '{rating} / 5' },
          {
            rating: formatNumber(activeRating, { maximumFractionDigits: 1 })
          }
        )}${description ? ` · ${description}` : ''}`;

  return (
    <Box
      role="group"
      aria-label={formatMessage({ id: labelId })}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '18rem minmax(0, 1fr)' },
        alignItems: 'center',
        columnGap: 2,
        minWidth: 0
      }}>
      <Typography variant="body2" fontWeight={600}>
        {formatMessage({ id: labelId })}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1
        }}>
        <Rating
          name={labelId}
          value={selectedRating}
          precision={precision}
          size="large"
          getLabelText={rating =>
            formatMessage(
              { id: '{rating} out of 5 stars' },
              { rating: formatNumber(rating, { maximumFractionDigits: 1 }) }
            )
          }
          onChange={(_, newValue) =>
            onChange(newValue == null ? null : newValue * valueMultiplier)
          }
          onChangeActive={(_, newHover) =>
            setHoveredRating(newHover === -1 ? null : newHover)
          }
          onFocusCapture={event => {
            if (event.target.type === 'radio') {
              setFocusedRating(Number(event.target.value));
            }
          }}
          onBlurCapture={event => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setFocusedRating(null);
            }
          }}
          emptyIcon={<StarBorderIcon fontSize="inherit" />}
        />
        <Typography
          variant="body2"
          color="text.secondary"
          aria-live="polite"
          sx={{ minWidth: 0 }}>
          {activeLabel}
        </Typography>
        {value != null && (
          <IconButton
            onClick={() => {
              setHoveredRating(null);
              setFocusedRating(null);
              onChange(null);
            }}
            color="error"
            aria-label={formatMessage({ id: 'Clear' })}
            size="small">
            <ClearIcon />
          </IconButton>
        )}
      </Box>
    </Box>
  );
};

RatingInput.propTypes = {
  labelId: PropTypes.string.isRequired,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  descriptionIds: PropTypes.arrayOf(PropTypes.string),
  precision: PropTypes.number,
  valueMultiplier: PropTypes.number
};

export default RatingInput;
