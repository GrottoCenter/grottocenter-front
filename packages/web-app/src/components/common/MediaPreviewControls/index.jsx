import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PreviewControls = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(4),
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[4],
  '& .MuiIconButton-root': { width: 44, height: 44 }
}));

export const PreviewControlButton = ({ label, onClick, testId, children }) => (
  <Tooltip
    title={label}
    placement="top"
    enterTouchDelay={500}
    slotProps={{ popper: { disablePortal: true } }}>
    <IconButton aria-label={label} onClick={onClick} data-testid={testId}>
      {children}
    </IconButton>
  </Tooltip>
);

PreviewControlButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};
