import PropTypes from 'prop-types';
import { Box, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AppLink from './AppLink';

// Domains supply their own URLs, permissions and accessible labels. Only the
// three established record actions and their presentation are shared.
const EntityActionButtons = ({
  preview,
  edit = null,
  open = null,
  isDisabled = false
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
    <Tooltip title={preview.label}>
      <IconButton
        aria-label={preview.label}
        data-testid={preview.testId}
        onClick={preview.onClick}
        disabled={isDisabled}>
        <VisibilityIcon />
      </IconButton>
    </Tooltip>
    {edit && (
      <Tooltip title={edit.label}>
        <IconButton
          component={AppLink}
          to={edit.to}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={edit.label}
          disabled={isDisabled}>
          <EditIcon />
        </IconButton>
      </Tooltip>
    )}
    {open && (
      <Tooltip title={open.label}>
        <IconButton
          component={AppLink}
          to={open.to}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={open.label}
          data-testid={open.testId}
          disabled={isDisabled}>
          <OpenInNewIcon />
        </IconButton>
      </Tooltip>
    )}
  </Box>
);

const linkShape = PropTypes.shape({
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  testId: PropTypes.string
});
EntityActionButtons.propTypes = {
  preview: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
    testId: PropTypes.string
  }).isRequired,
  edit: linkShape,
  open: linkShape,
  isDisabled: PropTypes.bool
};
export default EntityActionButtons;
