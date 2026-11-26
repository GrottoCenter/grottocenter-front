import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Stack } from '@mui/material';

// Keep the receipt beside the comparison until the moderator acknowledges it.
const DuplicateMergeResult = ({
  children,
  onAcknowledge,
  isDisabled = false,
  testId
}) => {
  const { formatMessage } = useIntl();
  const acknowledgeRef = useRef(null);
  useEffect(() => {
    // Focus after the confirmation dialog's focus trap has unmounted.
    acknowledgeRef.current?.focus();
  }, []);
  return (
    <Box
      role="status"
      data-testid={testId}
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'flex-start',
        gap: 2
      }}>
      <Stack
        spacing={1}
        sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
        {children}
      </Stack>
      <Button
        ref={acknowledgeRef}
        variant="outlined"
        color="success"
        sx={{ flexShrink: 0 }}
        disabled={isDisabled}
        onClick={onAcknowledge}>
        {formatMessage({ id: 'duplicates.acknowledge' })}
      </Button>
    </Box>
  );
};

DuplicateMergeResult.propTypes = {
  children: PropTypes.node.isRequired,
  onAcknowledge: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool,
  testId: PropTypes.string
};

export default DuplicateMergeResult;
