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

const Button = styled(MuiButton)`
  margin: ${({ theme }) => theme.spacing(2)};
`;

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
        justifyContent: isCenter ? 'center' : 'flex-end'
      }}>
      {onCancel && (
        <Button variant="outlined" onClick={onCancel}>
          {formatMessage({ id: 'Cancel' })}
        </Button>
      )}
      <ActionButton
        label={formatMessage({ id: isNew ? 'Create' : 'Update' })}
        loading={isSubmitting}
        disabled={disabled}
        color="primary"
        style={{ margin: '8px' }}
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
