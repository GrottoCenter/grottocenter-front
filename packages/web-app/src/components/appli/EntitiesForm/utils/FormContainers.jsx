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
    gap: ${theme.spacing(2)};

    ${theme.breakpoints.up('sm')} {
      flex-wrap: nowrap;
    }
  `
);

const StyledFormLabel = styled(FormLabel)`
  display: block;
  padding-top: ${({ theme }) => theme.spacing(4)};
  padding-bottom: ${({ theme }) => theme.spacing(1)};
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
  <Box component="section" sx={{ mt: { xs: 3, sm: 4 } }}>
    {title && (
      <>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          <Translate>{title}</Translate>
        </Typography>
        <Divider sx={{ mt: 0.5, mb: 2 }} />
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
  onCancel
}) => {
  const { formatMessage } = useIntl();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        justifyContent: isCenter ? 'center' : 'flex-end',
        gap: 2,
        mt: 3
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
        label={formatMessage({ id: isNew ? 'Create' : 'Update' })}
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
  isNew: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  isCenter: PropTypes.bool,
  disabled: PropTypes.bool,
  onCancel: PropTypes.func
};
