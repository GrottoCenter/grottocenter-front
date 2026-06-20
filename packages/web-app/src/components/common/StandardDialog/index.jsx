import { useIntl } from 'react-intl';
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
  @media (max-width: 600px) {
    margin-top: 0.5rem;
    padding: 16px 16px 8px;
  }
`;

const DialogContent = styled(MuiDialogContent, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  && {
    overflow: ${({ $scrollable }) => ($scrollable ? 'auto' : 'visible')};
    @media (max-width: 600px) {
      padding: 8px 16px;
      ${({ $centerMobile }) =>
        $centerMobile
          ? 'display: flex; flex-direction: column; justify-content: center;'
          : ''}
    }
  }
`;

const StyledDialogActions = styled(DialogActions)`
  @media (max-width: 600px) {
    padding: 8px 16px;
  }
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
`;

const StandardDialog = ({
  fullScreen = false,
  fullWidth = false,
  scrollable = false,
  centerContentMobile = false,
  maxWidth = 'sm',
  open = false,
  onClose = () => {},
  title,
  children,
  actions
}) => {
  const { formatMessage } = useIntl();
  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      open={open}
      onClose={onClose}
      PaperProps={{ style: { overflow: 'visible' } }}>
      {onClose && (
        <CloseButton
          aria-label={formatMessage({ id: 'close' })}
          onClick={onClose}
          color="primary">
          <CloseIcon />
        </CloseButton>
      )}
      <CustomDialogTitle>{title}</CustomDialogTitle>
      {children && (
        <DialogContent
          $scrollable={scrollable}
          $centerMobile={centerContentMobile}>
          {children}
        </DialogContent>
      )}
      {actions && <StyledDialogActions>{actions}</StyledDialogActions>}
    </Dialog>
  );
};

export default StandardDialog;

StandardDialog.propTypes = {
  actions: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  centerContentMobile: PropTypes.bool,
  children: PropTypes.node,
  fullScreen: PropTypes.bool,
  fullWidth: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  open: PropTypes.bool,
  onClose: PropTypes.func,
  scrollable: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
};
