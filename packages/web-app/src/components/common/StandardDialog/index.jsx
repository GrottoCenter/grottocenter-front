import * as React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';

const CustomDialogTitle = styled(DialogTitle)`
  margin-top: 1rem;
`;

const DialogContent = styled(MuiDialogContent, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  && {
    overflow: ${({ $scrollable }) => ($scrollable ? 'auto' : 'visible')};
  }
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  right: 0;
`;

const StandardDialog = ({
  fullScreen = false,
  fullWidth = false,
  scrollable = false,
  maxWidth = 'sm',
  open = false,
  onClose = () => {},
  title,
  children,
  actions
}) => (
  <Dialog
    fullScreen={fullScreen}
    fullWidth={fullWidth}
    maxWidth={maxWidth}
    open={open}
    onClose={onClose}
    PaperProps={{ style: { overflow: 'visible' } }}>
    {onClose && (
      <CloseButton aria-label="close" onClick={onClose} color="primary">
        <CloseIcon />
      </CloseButton>
    )}
    <CustomDialogTitle>{title}</CustomDialogTitle>
    {children && (
      <DialogContent $scrollable={scrollable}>{children}</DialogContent>
    )}
    <DialogActions>{actions || null}</DialogActions>
  </Dialog>
);

export default StandardDialog;

StandardDialog.propTypes = {
  actions: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  children: PropTypes.node,
  fullScreen: PropTypes.bool,
  fullWidth: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  open: PropTypes.bool,
  onClose: PropTypes.func,
  scrollable: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};
