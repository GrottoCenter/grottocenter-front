import { Children, Fragment, isValidElement } from 'react';
import PropTypes from 'prop-types';
import { Box, useMediaQuery, useTheme } from '@mui/material';

const flattenActions = (children, parentKey = '') =>
  Children.toArray(children).flatMap((child, index) => {
    const key = `${parentKey}/${isValidElement(child) ? child.key : index}`;
    return isValidElement(child) && child.type === Fragment
      ? flattenActions(child.props.children, key)
      : [<Fragment key={key}>{child}</Fragment>];
  });

// Supply secondary actions first and the primary action last. Reorder the DOM,
// not just CSS, so mobile keyboard navigation follows the visible buttons.
const ResponsiveActionRow = ({
  children,
  stackOnMobile = true,
  testId,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const actions = flattenActions(children);
  const shouldReverse = isMobile && stackOnMobile;

  return (
    <Box
      data-testid={testId}
      sx={[
        {
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: stackOnMobile ? { xs: 'column', sm: 'row' } : 'row',
          alignItems: stackOnMobile
            ? { xs: 'stretch', sm: 'center' }
            : 'center',
          justifyContent: 'flex-end',
          gap: 1,
          width: '100%',
          minWidth: 0,
          '& > *': { minWidth: 0, maxWidth: '100%' },
          '& button, & a.MuiButton-root': {
            ...(stackOnMobile && { width: { xs: '100%', sm: 'auto' } }),
            minHeight: { xs: 44, sm: 36 },
            whiteSpace: 'normal',
            overflowWrap: 'anywhere'
          }
        },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}>
      {shouldReverse ? actions.reverse() : actions}
    </Box>
  );
};

ResponsiveActionRow.propTypes = {
  children: PropTypes.node,
  stackOnMobile: PropTypes.bool,
  testId: PropTypes.string,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func])
};

export default ResponsiveActionRow;
