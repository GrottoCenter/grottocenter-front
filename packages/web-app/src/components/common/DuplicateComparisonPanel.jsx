import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import FormSubmissionError from './FormSubmissionError';

export const COMPARISON_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18rem), 1fr))',
  gap: { xs: 1, sm: 2 }
};

export const COMPARISON_ACTIONS_SX = {
  display: { xs: 'grid', sm: 'flex' },
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  flexWrap: 'wrap',
  gap: 1,
  '& > button': { minWidth: 0 }
};

export const ComparisonField = ({
  label = null,
  children,
  isDifferent = false,
  testId
}) => (
  <Typography
    component="div"
    data-testid={testId}
    sx={{
      px: 0.5,
      py: 0.25,
      borderRadius: 0.5,
      bgcolor: isDifferent ? 'action.hover' : 'transparent'
    }}>
    {label && `${label}: `}
    <Box component={isDifferent ? 'strong' : 'span'}>{children}</Box>
  </Typography>
);
ComparisonField.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node.isRequired,
  isDifferent: PropTypes.bool,
  testId: PropTypes.string
};

const DuplicateComparisonPanel = ({
  title,
  headerActions,
  children,
  isKept = false,
  onKeep = null,
  isDisabled = false,
  isPending = false,
  error = null,
  onRetry = null,
  deleteAction = null,
  testId
}) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      data-testid={testId}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        p: { xs: 1, sm: 1.5 },
        border: 2,
        borderColor: isKept ? 'success.main' : 'divider',
        borderRadius: 1
      }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5,
          alignItems: 'center'
        }}>
        <Typography
          variant="h5"
          component="h3"
          sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          {title}
        </Typography>
        {headerActions}
      </Box>
      {isPending && <CircularProgress size={20} />}
      {error && (
        <>
          <FormSubmissionError error={error} />
          {onRetry && (
            <Button disabled={isDisabled} onClick={onRetry}>
              {formatMessage({ id: 'Retry' })}
            </Button>
          )}
        </>
      )}
      <Stack
        spacing={0.5}
        sx={{ mt: 1, flexGrow: 1, overflowWrap: 'anywhere' }}>
        {children}
      </Stack>
      <Stack spacing={1} sx={{ pt: 2, mt: 'auto' }}>
        {isKept ? (
          <Box
            role="status"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              py: 0.75,
              color: 'success.main'
            }}>
            <CheckIcon fontSize="small" />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatMessage({ id: 'duplicates.kept' })}
            </Typography>
          </Box>
        ) : (
          onKeep && (
            <Button
              variant="outlined"
              disabled={isDisabled || isPending || !!error}
              onClick={onKeep}>
              {formatMessage({ id: 'duplicates.keepAction' })}
            </Button>
          )
        )}
        {deleteAction}
      </Stack>
    </Box>
  );
};

DuplicateComparisonPanel.propTypes = {
  title: PropTypes.node.isRequired,
  headerActions: PropTypes.node.isRequired,
  children: PropTypes.node,
  isKept: PropTypes.bool,
  onKeep: PropTypes.func,
  isDisabled: PropTypes.bool,
  isPending: PropTypes.bool,
  error: FormSubmissionError.propTypes.error,
  onRetry: PropTypes.func,
  deleteAction: PropTypes.node,
  testId: PropTypes.string
};
export default DuplicateComparisonPanel;
