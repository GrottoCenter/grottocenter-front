import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import ErrorMessage from '../../components/common/StatusMessage/ErrorMessage';
import Translate from '../../components/common/Translate';
import { usePermissions } from '../../hooks';
import { displayLoginDialog } from '../../actions/Login';
import CreationForm from './CreationForm';

const CenteredBlock = styled.div`
  text-align: center;
`;

const EntitiesCreation = () => {
  const permissions = usePermissions();
  const history = useHistory();
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const handleLogin = () => {
    dispatch(displayLoginDialog());
  };

  return (
    <Layout
      title={formatMessage({ id: 'Create a new entity in Grottocenter' })}
      footer=""
      content={
        <>
          {!permissions.isAuth ? (
            <CenteredBlock>
              <ErrorMessage
                message={formatMessage({
                  id: 'You must be authenticated to submit a new entity.'
                })}
              />
              <Button onClick={handleLogin} variant="contained">
                <Translate>Log in</Translate>
              </Button>
              <Button onClick={() => history.push('')} variant="contained">
                <Translate>Go to home page</Translate>
              </Button>
            </CenteredBlock>
          ) : (
            <CreationForm />
          )}
        </>
      }
    />
  );
};
export default EntitiesCreation;
