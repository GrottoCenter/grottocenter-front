import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ErrorMessage from '../../components/common/StatusMessage/ErrorMessage';
import Translate from '../../components/common/Translate';
import { usePermissions } from '../../hooks';
import { displayLoginDialog } from '../../actions/Login';
import CreationForm from './CreationForm';

const CenteredBlock = styled('div')`
  text-align: center;
`;

const EntitiesCreation = () => {
  const permissions = usePermissions();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const handleLogin = () => {
    dispatch(displayLoginDialog());
  };

  return (
    <Layout
      title={formatMessage({ id: 'Create a new entity in Grottocenter' })}
      content={
        !permissions.isAuth ? (
          <CenteredBlock>
            <ErrorMessage
              message={formatMessage({
                id: 'You must be authenticated to submit a new entity to Grottocenter.'
              })}
            />
            <Button onClick={handleLogin} variant="contained">
              <Translate>Log in</Translate>
            </Button>
            <Button onClick={() => navigate('')} variant="contained">
              <Translate>Go to home page</Translate>
            </Button>
          </CenteredBlock>
        ) : (
          <CreationForm />
        )
      }
    />
  );
};
export default EntitiesCreation;
