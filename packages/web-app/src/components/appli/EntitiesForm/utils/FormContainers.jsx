import { styled } from '@mui/material/styles';
import {
  Box,
  Button as MuiButton,
  Divider,
  FormLabel,
  Typography
} from '@mui/material';
import { React } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
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
  isCenter = false,
  disabled = false,
  onCancel,
  submitLabel
}) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        justifyContent: isCenter ? 'center' : 'flex-end',
        gap: 1,
        mt: 2
      }}>
      {onCancel && (
        <MuiButton
          variant="outlined"
          onClick={onCancel}
          sx={{ width: { xs: '100%', sm: 'auto' } }}>
          {formatMessage({ id: 'Cancel' })}
        </MuiButton>
      )}
      <ActionButton
        label={
          submitLabel ?? formatMessage({ id: isNew ? 'Create' : 'Update' })
        }
        loading={isSubmitting}
        disabled={disabled}
        color="primary"
        type="submit"
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      />
    </Box>
  );
};
FormActionRow.propTypes = {
  isNew: PropTypes.bool,
  isSubmitting: PropTypes.bool.isRequired,
  isCenter: PropTypes.bool,
  disabled: PropTypes.bool,
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string
};
