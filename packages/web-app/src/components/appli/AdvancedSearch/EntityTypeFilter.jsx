import PropTypes from 'prop-types';
import { Box, Chip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useIntl } from 'react-intl';

const EntityTypeFilter = ({ options, value, onChange }) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      data-testid="entity-type-filter"
      role="group"
      aria-label={formatMessage({ id: 'Type' })}
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {options.map(option => {
        const isSelected = option.value === value;
        return (
          <Chip
            key={String(option.value)}
            label={formatMessage({ id: option.labelId })}
            size="small"
            clickable
            color={isSelected ? 'primary' : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
            icon={isSelected ? <CheckIcon /> : undefined}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
          />
        );
      })}
    </Box>
  );
};

EntityTypeFilter.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      labelId: PropTypes.string.isRequired
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired
};

export default EntityTypeFilter;
