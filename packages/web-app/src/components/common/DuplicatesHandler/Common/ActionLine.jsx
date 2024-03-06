import React from 'react';
import { Grid } from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import PublishIcon from '@mui/icons-material/Publish';
import ActionButton from '../../ActionButton';

const StyledGrid = styled(Grid)`
  margin-top: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(2)};
`;

const ActionLine = ({
  handleSubmit,
  handleNotDuplicatesSubmit,
  disableSubmit
}) => {
  const { formatMessage } = useIntl();
  return (
    <StyledGrid container direction="row" justifyContent="space-evenly">
      <Grid item>
        <ActionButton
          label={formatMessage({ id: 'They are not duplicates' })}
          onClick={handleNotDuplicatesSubmit}
        />
      </Grid>
      <Grid item>
        <ActionButton
          label={formatMessage({ id: 'Submit' })}
          onClick={handleSubmit}
          disabled={disableSubmit}
          icon={<PublishIcon />}
        />
      </Grid>
    </StyledGrid>
  );
};

export default ActionLine;

ActionLine.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  handleNotDuplicatesSubmit: PropTypes.func.isRequired,
  disableSubmit: PropTypes.bool.isRequired
};
