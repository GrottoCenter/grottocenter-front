import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';

import Alert from '../../common/Alert';
import { CaveType, EntranceType } from './types';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)};`}
`;

const FormActions = ({ apiError, entrance, loading, newCave, onReset }) => {
  const { formatMessage } = useIntl();
  const isSameCave =
    newCave && entrance.cave && Number(newCave.id) === entrance.cave.id;

  return (
    <>
      {isSameCave && (
        <Alert
          severity="error"
          content={formatMessage({
            id: 'You must select a different cave than the initial one.'
          })}
        />
      )}

      <Box mt={4} align="center">
        {loading && <CircularProgress />}
        {apiError && (
          <Alert
            severity="error"
            content={formatMessage({ id: apiError.message })}
          />
        )}

        {!loading && (
          <>
            <SpacedButton
              disabled={!newCave || isSameCave}
              color="primary"
              type="submit">
              {formatMessage({ id: 'Validate' })}
            </SpacedButton>
            <SpacedButton
              variant="outlined"
              disabled={!newCave}
              onClick={onReset}>
              {formatMessage({ id: 'Reset' })}
            </SpacedButton>
          </>
        )}
      </Box>
    </>
  );
};

FormActions.propTypes = {
  apiError: PropTypes.shape({
    message: PropTypes.string.isRequired
  }),
  entrance: EntranceType,
  loading: PropTypes.bool.isRequired,
  onReset: PropTypes.func.isRequired,
  newCave: CaveType
};
export default FormActions;
