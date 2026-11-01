import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Button as MuiButton,
  Divider,
  FormLabel,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import OfflineDisabled from '@/components/common/OfflineDisabled';
import { useOnlineStatus } from '@/hooks';
import ActionButton from '../../../common/ActionButton';
import Translate from '../../../common/Translate';

export const FormContainer = styled('div')(
  ({ theme }) => `
    display: flex;
    justify-content: center;
    flex-direction: column;
    [${theme.breakpoints.up('sm')}]: {
      flex-wrap: wrap;
    }
  `
);

export const FormRow = styled('div')(
  ({ theme }) => `
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};

    ${theme.breakpoints.up('sm')} {
      flex-wrap: nowrap;
    }
  `
);

const StyledFormLabel = styled(FormLabel)`
  display: block;
  padding-top: ${({ theme }) => theme.spacing(3)};
  padding-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

export const FormSectionLabel = ({ label }) => {
  const { formatMessage } = useIntl();
  return <StyledFormLabel>{formatMessage({ id: label })}</StyledFormLabel>;
};
FormSectionLabel.propTypes = { label: PropTypes.string.isRequired };

// Groups related fields under a titled, divided section to give the long
// creation form a clear visual hierarchy. Responsive: lighter top margin on
// mobile.
export const FormSection = ({ title, children }) => (
  <Box component="section" sx={{ mt: { xs: 2, sm: 3 } }}>
    {title && (
      <>
        {/* Same visual token as InfoSection on the read pages: both label a
            group (fields here, properties there). `component` keeps the outline
            right — a section of the form sits under the page title. Assumes the
            form is not nested in a card that already renders an h2 (e.g.
            ScrollableContent); such a caller must override `component`. */}
        <Typography variant="h5" component="h2">
          <Translate>{title}</Translate>
        </Typography>
        <Divider
          sx={{
            mb: 2
          }}
        />
      </>
    )}
    {children}
  </Box>
);
FormSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node
};

export const FormActionRow = ({
  isNew,
  isSubmitting,
  disabled = false,
  onCancel,
  submitLabel
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Cancel stays enabled offline: it only discards local form state.
  // Only the submit is wrapped, so losing the connection mid-typing
  // blocks the save instead of failing it — and says why.
  const cancelButton = onCancel && (
    <MuiButton
      key="cancel"
      variant="outlined"
      onClick={onCancel}
      sx={{ width: { xs: '100%', sm: 'auto' } }}>
      {formatMessage({ id: 'Cancel' })}
    </MuiButton>
  );
  // No `fullWidth` here: the action row stretches the offline wrapper on
  // mobile and sizes it to its content on desktop, matching the button.
  const submitButton = (
    <OfflineDisabled key="submit">
      <ActionButton
        label={
          submitLabel ?? formatMessage({ id: isNew ? 'Create' : 'Update' })
        }
        loading={isSubmitting}
        disabled={disabled || !isOnline}
        color="primary"
        type="submit"
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      />
    </OfflineDisabled>
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'flex-end',
        gap: 1,
        mt: 3,
        mb: 2
      }}>
      {/* DOM order follows the visual order, including keyboard navigation. */}
      {isMobile ? [submitButton, cancelButton] : [cancelButton, submitButton]}
    </Box>
  );
};
FormActionRow.propTypes = {
  isNew: PropTypes.bool,
  isSubmitting: PropTypes.bool.isRequired,
  disabled: PropTypes.bool,
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string
};
