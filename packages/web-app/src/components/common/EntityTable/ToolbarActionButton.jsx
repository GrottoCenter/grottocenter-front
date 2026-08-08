import PropTypes from 'prop-types';
import { Box, Button, Tooltip } from '@mui/material';

import { TOOLBAR_ACTION_HEIGHT } from './tableUtils';

// Square, and with the icon's trailing gutter removed: with no label there is
// nothing for it to separate the icon from, and it drags the icon off centre.
const ICON_ONLY_SX = {
  width: TOOLBAR_ACTION_HEIGHT,
  px: 0,
  '& .MuiButton-startIcon': { mx: 0 }
};

/**
 * The single shape every control in the results toolbar takes: outlined, small,
 * primary, TOOLBAR_ACTION_HEIGHT tall, collapsing to a square icon button when
 * `label` is left out.
 *
 * It exists because that shape used to be retyped at each call site — six
 * copies of the same six props, each with its own label/icon-only branch and
 * its own handling of the wrapper a Tooltip needs to reach a disabled button.
 * They had drifted into three different border colours before this was pulled
 * out; sharing an `sx` constant would only have covered one of the six props.
 *
 * `tooltip` doubles as the accessible name when there is no visible label, so
 * an icon-only button cannot end up unnamed. Pass it whenever it says something
 * the label does not — why the button is disabled, or what the icon means.
 */
const ToolbarActionButton = ({
  icon: Icon,
  tooltip = null,
  label = null,
  endIcon = null,
  disabled = false,
  onClick = null,
  sx = null
}) => {
  const button = (
    <Button
      variant="outlined"
      size="small"
      color="primary"
      disabled={disabled}
      onClick={onClick}
      startIcon={<Icon fontSize="small" />}
      endIcon={endIcon}
      aria-label={label ? undefined : tooltip}
      sx={{
        minWidth: 0,
        height: TOOLBAR_ACTION_HEIGHT,
        ...(!label && ICON_ONLY_SX),
        ...sx
      }}>
      {label && (
        <Box
          component="span"
          sx={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
          {label}
        </Box>
      )}
    </Button>
  );

  if (!tooltip) return button;
  // A disabled button fires no pointer events, so the tooltip has to listen on
  // a wrapper. inline-flex keeps that wrapper out of the toolbar's alignment.
  return (
    <Tooltip title={tooltip}>
      <Box component="span" sx={{ display: 'inline-flex', minWidth: 0 }}>
        {button}
      </Box>
    </Tooltip>
  );
};

ToolbarActionButton.propTypes = {
  icon: PropTypes.elementType.isRequired,
  // Required in practice when `label` is absent: it is then the only name the
  // button has.
  tooltip: PropTypes.string,
  // Already translated — this component does no lookup of its own.
  label: PropTypes.string,
  endIcon: PropTypes.node,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  sx: PropTypes.shape({})
};

export default ToolbarActionButton;
