import { styled } from '@mui/material/styles';
import { Box, Button as MuiButton, Icon, FormLabel } from '@mui/material';
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
  isDirty,
  isNew,
  isSubmitting,
  onReset,
  isResetAllowed = true
}) => {
  const { formatMessage } = useIntl();
  return (
    <Box display="flex">
      <ActionButton
        label={formatMessage({
          id: isNew ? 'Create' : 'Update'
        })}
        loading={isSubmitting}
        color="primary"
        icon={<Icon>send</Icon>}
        style={{ margin: '8px', marginLeft: 'auto' }}
        type="submit"
      />
      {isResetAllowed && (
        <Button variant="outlined" disabled={!isDirty} onClick={onReset}>
          {formatMessage({ id: 'Reset' })}
        </Button>
      )}
    </Box>
  );
};
FormActionRow.propTypes = {
  isDirty: PropTypes.bool.isRequired,
  isNew: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onReset: PropTypes.func.isRequired,
  isResetAllowed: PropTypes.bool
};
