import { useCallback, useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import {
  Dialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import ResponsiveActionRow from '../ResponsiveActionRow';

const CustomDialogTitle = styled(DialogTitle)`
  flex-shrink: 0;
  overflow-wrap: anywhere;
  padding-right: ${({ theme }) => theme.spacing(6)};
  margin-top: ${({ theme }) => theme.spacing(1.25)};
  ${({ theme }) => theme.breakpoints.down('sm')} {
    margin-top: ${({ theme }) => theme.spacing(0.625)};
    padding: ${({ theme }) => theme.spacing(2, 7, 1, 2)};
  }
`;

const DialogContent = styled(MuiDialogContent, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  && {
    min-height: 0;
    min-width: 0;
    overscroll-behavior: contain;
    overflow: ${({ $scrollable }) => ($scrollable ? 'auto' : 'visible')};
    ${({ theme }) => theme.breakpoints.down('sm')} {
      padding: ${({ theme, $dense }) => theme.spacing(1, $dense ? 0.5 : 2)};
      ${({ $centerMobile }) =>
        $centerMobile
          ? 'display: flex; flex-direction: column; justify-content: center;'
          : ''}
    }
  }
`;

const StyledDialogActions = styled(DialogActions)`
  flex-shrink: 0;
  ${({ theme }) => theme.breakpoints.down('sm')} {
    padding: ${({ theme }) => theme.spacing(1, 2)};
    padding-bottom: ${({ theme }) =>
      `max(${theme.spacing(1)}, env(safe-area-inset-bottom))`};
  }
`;

const CloseButton = styled(IconButton)`
  position: absolute;
  top: ${({ theme }) => theme.spacing(0.5)};
  right: ${({ theme }) => theme.spacing(0.5)};
  min-width: 44px;
  min-height: 44px;
  z-index: 1;
`;

const StandardDialog = ({
  fullScreen,
  fullScreenOnMobile = false,
  fullWidth = true,
  scrollable = true,
  centerContentMobile = false,
  dense = false,
  dividers = false,
  showCloseButton = true,
  stackActionsOnMobile = true,
  maxWidth = 'sm',
  open = false,
  onClose,
  isBusy = false,
  title,
  titleComponent = 'h2',
  titleVariant = 'h3',
  children,
  actions,
  actionsPosition = 'bottom',
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  disableAutoFocus = false,
  disableRestoreFocus = false,
  slotProps = {}
}) => {
  const { formatMessage } = useIntl();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const isFullScreen = fullScreen ?? (fullScreenOnMobile && isMobile);
  const dialogRef = useRef(null);
  const hasHeaderActions = actionsPosition === 'top';
  const handleClose = (event, reason) => {
    if (!isBusy) onClose?.(event, reason);
  };
  const updateViewport = useCallback(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const node = dialogRef.current;
    node?.style.setProperty('--dialog-viewport-height', `${viewport.height}px`);
    node?.style.setProperty('--dialog-viewport-top', `${viewport.offsetTop}px`);
  }, []);
  const handleDialogRef = useCallback(
    node => {
      dialogRef.current = node;
      updateViewport();
    },
    [updateViewport]
  );

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!open || !viewport) return undefined;
    updateViewport();
    viewport.addEventListener('resize', updateViewport);
    viewport.addEventListener('scroll', updateViewport);
    return () => {
      viewport.removeEventListener('resize', updateViewport);
      viewport.removeEventListener('scroll', updateViewport);
    };
  }, [open, updateViewport]);

  return (
    <Dialog
      ref={handleDialogRef}
      fullScreen={isFullScreen}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      open={open}
      onClose={onClose ? handleClose : undefined}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      disableAutoFocus={disableAutoFocus}
      disableRestoreFocus={disableRestoreFocus}
      slotProps={{
        ...slotProps,
        container: {
          ...slotProps.container,
          sx: [
            {
              height: 'var(--dialog-viewport-height, 100%)',
              transform: 'translateY(var(--dialog-viewport-top, 0px))'
            },
            ...(Array.isArray(slotProps.container?.sx)
              ? slotProps.container.sx
              : [slotProps.container?.sx])
          ]
        },
        paper: {
          ...slotProps.paper,
          'aria-busy': isBusy || undefined,
          sx: [
            {
              overflow: scrollable ? 'hidden' : 'auto',
              maxHeight: isFullScreen
                ? 'var(--dialog-viewport-height, 100dvh)'
                : theme =>
                    `calc(var(--dialog-viewport-height, 100dvh) - ${theme.spacing(8)})`,
              ...(isFullScreen && {
                height: 'var(--dialog-viewport-height, 100dvh)'
              }),
              ...(actions &&
                hasHeaderActions && {
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) fit-content(60%)',
                  gridTemplateRows: 'auto minmax(0, 1fr)',
                  gridTemplateAreas: '"title actions" "content content"'
                })
            },
            ...(Array.isArray(slotProps.paper?.sx)
              ? slotProps.paper.sx
              : [slotProps.paper?.sx])
          ]
        }
      }}>
      {onClose && showCloseButton && (
        <CloseButton
          aria-label={formatMessage({ id: 'close' })}
          onClick={event => handleClose(event, 'closeButtonClick')}
          disabled={isBusy}
          color="primary">
          <CloseIcon />
        </CloseButton>
      )}
      <CustomDialogTitle
        component={titleComponent}
        variant={titleVariant}
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
          dividers={dividers}
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
          disableSpacing
          sx={{
            gridArea: 'actions',
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
          <ResponsiveActionRow
            stackOnMobile={stackActionsOnMobile && !hasHeaderActions}>
            {actions}
          </ResponsiveActionRow>
        </StyledDialogActions>
      )}
    </Dialog>
  );
};

export default StandardDialog;

StandardDialog.propTypes = {
  actions: PropTypes.node,
  actionsPosition: PropTypes.oneOf(['top', 'bottom']),
  centerContentMobile: PropTypes.bool,
  children: PropTypes.node,
  dense: PropTypes.bool,
  dividers: PropTypes.bool,
  showCloseButton: PropTypes.bool,
  stackActionsOnMobile: PropTypes.bool,
  fullScreen: PropTypes.bool,
  fullScreenOnMobile: PropTypes.bool,
  fullWidth: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  open: PropTypes.bool,
  onClose: PropTypes.func,
  isBusy: PropTypes.bool,
  scrollable: PropTypes.bool,
  title: PropTypes.node,
  titleComponent: PropTypes.oneOf(['h1', 'h2', 'div']),
  titleVariant: PropTypes.oneOf(['h1', 'h2', 'h3']),
  'aria-labelledby': PropTypes.string,
  'aria-describedby': PropTypes.string,
  disableAutoFocus: PropTypes.bool,
  disableRestoreFocus: PropTypes.bool,
  slotProps: PropTypes.shape({
    paper: PropTypes.shape({
      component: PropTypes.elementType,
      onSubmit: PropTypes.func,
      sx: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array,
        PropTypes.func
      ])
    }),
    transition: PropTypes.shape({
      onEntered: PropTypes.func,
      onExited: PropTypes.func
    }),
    container: PropTypes.shape({
      sx: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.array,
        PropTypes.func
      ])
    })
  })
};
