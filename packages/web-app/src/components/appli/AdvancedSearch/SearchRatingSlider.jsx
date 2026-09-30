import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { FormControl, FormLabel, IconButton, Slider } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import StarIcon from '@mui/icons-material/Star';

import { normalizeRatingRange } from '@/utils/ratingFilter';

const SearchRatingSlider = ({ label, value, onChange }) => {
  const { formatMessage, formatNumber } = useIntl();
  const currentValue = normalizeRatingRange(value ?? [0, 10]);
  const displayedValue = currentValue.map(rating => rating / 2);
  const formatStars = rating =>
    rating === 0 ? '0' : `${formatNumber(rating)}★`;

  useEffect(() => {
    if (value == null) return;
    const normalizedValue = normalizeRatingRange(value);
    if (normalizedValue.some((rating, index) => rating !== value[index])) {
      onChange(normalizedValue);
    }
  }, [value, onChange]);

  const handleChange = (_, nextValue) => {
    const rawValue = nextValue.map(rating => rating * 2);
    onChange(rawValue[0] === 0 && rawValue[1] === 10 ? null : rawValue);
  };

  return (
    <FormControl
      sx={{ flex: 1, minWidth: '200px', mx: 2, alignItems: 'center' }}>
      <FormLabel
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          mb: { xs: -1, md: 0 }
        }}>
        <StarIcon sx={{ color: 'warning.main', fontSize: 18 }} />
        {label}
        <IconButton
          size="small"
          onClick={() => onChange(null)}
          aria-label={`${formatMessage({ id: 'clear filter' })}: ${label}`}
          sx={{ visibility: value == null ? 'hidden' : 'visible', p: 0.25 }}>
          <ClearIcon fontSize="small" />
        </IconButton>
      </FormLabel>
      <Slider
        min={0}
        max={5}
        step={1}
        value={displayedValue}
        onChange={handleChange}
        getAriaLabel={index =>
          `${label}: ${formatMessage({
            id: index === 0 ? 'Minimum rating' : 'Maximum rating'
          })}`
        }
        getAriaValueText={formatStars}
        valueLabelDisplay="auto"
        valueLabelFormat={formatStars}
        marks={Array.from({ length: 6 }, (_, rating) => ({
          value: rating,
          label: formatStars(rating)
        }))}
        sx={{
          touchAction: 'pan-y',
          width: '100%',
          mb: 1,
          '& .MuiSlider-markLabel[data-index="0"]': {
            transform: 'translateX(0)'
          },
          '& .MuiSlider-markLabel[data-index="5"]': {
            transform: 'translateX(-100%)'
          }
        }}
      />
    </FormControl>
  );
};

SearchRatingSlider.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func.isRequired
};

export default SearchRatingSlider;
