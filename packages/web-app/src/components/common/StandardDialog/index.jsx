import { useIntl } from 'react-intl';
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
  flex-shrink: 0;
  overflow-wrap: anywhere;
  padding-right: ${({ theme }) => theme.spacing(6)};
  margin-top: 0.625rem;
  @media (max-width: 600px) {
    margin-top: 0.3125rem;
    padding: ${({ theme }) => theme.spacing(2, 6, 1, 2)};
  }
`;

const DialogContent = styled(MuiDialogContent, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  && {
    min-height: 0;
    overflow: ${({ $scrollable }) => ($scrollable ? 'auto' : 'visible')};
    @media (max-width: 600px) {
      padding: ${({ $dense }) => ($dense ? '8px 4px' : '8px 16px')};
      ${({ $centerMobile }) =>
        $centerMobile
          ? 'display: flex; flex-direction: column; justify-content: center;'
          : ''}
    }
  }
`;

const StyledDialogActions = styled(DialogActions)`
  flex-shrink: 0;
  flex-wrap: wrap;
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
  dense = false,
  maxWidth = 'sm',
  open = false,
  onClose = () => {},
  title,
  titleComponent = 'h2',
  children,
  actions,
  actionsPosition = 'bottom'
}) => {
  const { formatMessage } = useIntl();
  const hasHeaderActions = actionsPosition === 'top';
  return (
    <Dialog
      fullScreen={fullScreen}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          style: { overflow: 'visible' },
          sx:
            actions && hasHeaderActions
              ? {
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) fit-content(60%)',
                  gridTemplateRows: 'auto minmax(0, 1fr)',
                  gridTemplateAreas: '"title actions" "content content"'
                }
              : undefined
        }
      }}>
      {onClose && (
        <CloseButton
          aria-label={formatMessage({ id: 'close' })}
          onClick={onClose}
          color="primary">
          <CloseIcon />
        </CloseButton>
      )}
      <CustomDialogTitle
        component={titleComponent}
        sx={{
          gridArea: 'title',
          minWidth: 0,
          ...(hasHeaderActions && {
            mt: 0,
            pl: 6,
            pr: 2,
            py: 2,
            minHeight: 44,
            boxSizing: 'content-box',
            display: 'flex',
            alignItems: 'center',
            alignSelf: 'start'
          })
        }}>
        {title}
      </CustomDialogTitle>
      {children && (
        <DialogContent
          sx={{
            gridArea: 'content',
            ...(hasHeaderActions && {
              px: 6,
              scrollbarGutter: 'stable'
            })
          }}
          $scrollable={scrollable}
          $centerMobile={centerContentMobile}
          $dense={dense}>
          {children}
        </DialogContent>
      )}
      {actions && (
        <StyledDialogActions
          sx={{
            gridArea: 'actions',
            minWidth: 0,
            ...(hasHeaderActions && {
              py: 2,
              pr: 6,
              alignSelf: 'start',
              // Match the content's native scrollbar gutter, including when
              // its content is short or the OS uses overlay scrollbars.
              overflow: 'hidden',
              scrollbarGutter: 'stable'
            })
          }}>
          {actions}
        </StyledDialogActions>
      )}
    </Dialog>
  );
};

export default StandardDialog;

StandardDialog.propTypes = {
  actions: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ]),
  actionsPosition: PropTypes.oneOf(['top', 'bottom']),
  centerContentMobile: PropTypes.bool,
  children: PropTypes.node,
  dense: PropTypes.bool,
  fullScreen: PropTypes.bool,
  fullWidth: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  open: PropTypes.bool,
  onClose: PropTypes.func,
  scrollable: PropTypes.bool,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  titleComponent: PropTypes.oneOf(['h1', 'h2'])
};
