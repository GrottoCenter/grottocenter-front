import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Alert, Box, Button } from '@mui/material';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import { usePermissions } from '../../hooks';
import { displayLoginDialog } from '../../actions/Login';

const EntitiesCreation = () => {
  const permissions = usePermissions();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();

  if (!permissions.isAuth) {
    return (
      <Layout
        title={formatMessage({ id: 'Create a new entity in Grottocenter' })}
        content={
          <Box sx={{ textAlign: 'center' }}>
            <Alert severity="error" sx={{ mb: 1 }}>
              {formatMessage({
                id: 'You must be authenticated to submit a new entity to Grottocenter.'
              })}
            </Alert>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
              <Button
                onClick={() => dispatch(displayLoginDialog())}
                variant="contained">
                {formatMessage({ id: 'Log in' })}
              </Button>
              <Button onClick={() => navigate('/')} variant="outlined">
                {formatMessage({ id: 'Go to home page' })}
              </Button>
            </Box>
          </Box>
        }
      />
    );
  }

  return <Outlet />;
};

export default EntitiesCreation;
