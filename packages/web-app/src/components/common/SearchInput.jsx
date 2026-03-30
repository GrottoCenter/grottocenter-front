import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const SearchInput = ({ value, onChange, placeholder, sx }) => {
  const { formatMessage } = useIntl();

  return (
    <TextField
      size="small"
      fullWidth
      variant="outlined"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? formatMessage({ id: 'Search' })}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 6,
          backgroundColor: 'action.hover',
          '& fieldset': { border: 'none' },
          '&:hover': { backgroundColor: 'action.selected' },
          '&.Mui-focused': {
            backgroundColor: 'background.paper',
            boxShadow: theme => `0 0 0 2px ${theme.palette.primary.main}`
          }
        },
        ...sx
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          )
        }
      }}
    />
  );
};

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  sx: PropTypes.object
};

export default SearchInput;
