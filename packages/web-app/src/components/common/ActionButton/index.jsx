import { Box, Button, CircularProgress, Tooltip } from '@mui/material';
import PropTypes from 'prop-types';
import { MOBILE_SECTION_ACTION_BUTTON_SX } from '../sectionActionButtonStyles';

const mobileIconButtonSx = theme => ({
  [theme.breakpoints.down('md')]: {
    ...MOBILE_SECTION_ACTION_BUTTON_SX,
    '& .MuiButton-startIcon': { margin: 0 }
  }
});

const ActionButton = ({
  label,
  onClick,
  loading,
  disabled,
  color = 'primary',
  icon,
  shouldHideLabelOnMobile = false,
  ...buttonProps
}) => {
  const button = (
    <Button
      color={color}
      disabled={disabled || loading}
      onClick={onClick}
      startIcon={icon}
      aria-label={shouldHideLabelOnMobile ? label : undefined}
      {...buttonProps}
      sx={
        shouldHideLabelOnMobile
          ? [mobileIconButtonSx, buttonProps.sx]
          : buttonProps.sx
      }>
      {loading && (
        <CircularProgress
          style={{ marginRight: '8px' }}
          size={20}
          thickness={6}
          color={color}
        />
      )}
      <Box
        component="span"
        sx={
          shouldHideLabelOnMobile
            ? { display: { xs: 'none', md: 'inline' } }
            : undefined
        }>
        {label}
      </Box>
    </Button>
  );

  return shouldHideLabelOnMobile ? (
    <Tooltip title={label}>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        {button}
      </Box>
    </Tooltip>
  ) : (
    button
  );
};

ActionButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'success']),
  icon: PropTypes.element,
  shouldHideLabelOnMobile: PropTypes.bool
};

export default ActionButton;
