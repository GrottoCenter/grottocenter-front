import React from 'react';
import PropTypes from 'prop-types';
import { ToggleButton } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckIcon from '@mui/icons-material/Check';
import { Controller } from 'react-hook-form';
import CustomIcon from '../../../common/CustomIcon';
import Translate from '../../../common/Translate';

// A single boolean attribute rendered as an icon toggle chip, wired to a
// React-Hook-Form Controller. Selected = the attribute applies. Uses
// ToggleButton for built-in `aria-pressed` accessibility.
const BoolToggleChip = ({ name, label, icon, control, disabled = false }) => (
  <Controller
    name={name}
    control={control}
    defaultValue={false}
    render={({ field: { value, onChange } }) => (
      <ToggleButton
        value={name}
        selected={!!value}
        disabled={disabled}
        size="small"
        onChange={() => onChange(!value)}
        sx={{
          textTransform: 'none',
          gap: 0.5,
          borderRadius: 2,
          px: '12px',
          color: 'text.secondary',
          borderColor: 'divider',
          '&.Mui-selected': {
            color: 'primary.main',
            fontWeight: 700,
            borderColor: 'primary.main',
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.14),
            '&:hover': {
              backgroundColor: theme => alpha(theme.palette.primary.main, 0.22)
            }
          },
          // Grey out the icon when disabled...
          '&.Mui-disabled img': { filter: 'grayscale(1)', opacity: 0.5 },
          // ...and neutralize the "selected" accent so a disabled-but-true chip
          // reads as greyed rather than active.
          '&.Mui-disabled.Mui-selected': {
            color: 'text.disabled',
            borderColor: 'divider',
            backgroundColor: 'action.disabledBackground'
          }
        }}>
        {value && <CheckIcon fontSize="small" />}
        <CustomIcon type={icon} size={20} />
        <Translate>{label}</Translate>
      </ToggleButton>
    )}
  />
);

BoolToggleChip.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  control: PropTypes.shape({}),
  disabled: PropTypes.bool
};

export default BoolToggleChip;
