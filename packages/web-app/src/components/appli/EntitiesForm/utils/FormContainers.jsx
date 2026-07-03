import { styled } from '@mui/material/styles';
import { Box, Button as MuiButton, FormLabel } from '@mui/material';
import { React } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import ActionButton from '../../../common/ActionButton';

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
        justifyContent: isCenter ? 'center' : 'flex-end',
        gap: 2,
        mt: 3
      }}>
      {onCancel && (
        <MuiButton variant="outlined" onClick={onCancel}>
          {formatMessage({ id: 'Cancel' })}
        </MuiButton>
      )}
      <ActionButton
        label={formatMessage({ id: isNew ? 'Create' : 'Update' })}
        loading={isSubmitting}
        disabled={disabled}
        color="primary"
        type="submit"
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
