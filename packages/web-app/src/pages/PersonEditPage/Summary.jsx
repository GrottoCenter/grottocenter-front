import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Typography from '@material-ui/core/Typography';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
// import { makeStyles } from '@material-ui/core/styles';

/* const useStyles = makeStyles({
  root: {
    width: '100%',
    maxWidth: 500
  }
}); */

const Summary = ({ user }) => {
  const { formatMessage } = useIntl();

  return (
    <Layout
      title={formatMessage({ id: 'Check the veracity of the information' })}
      footer=""
      content={
        <>
          <Typography variant="h2" gutterBottom>
            email : {user.email}
          </Typography>
          <Typography variant="h2" gutterBottom>
            name : {user.name}
          </Typography>
          <Typography variant="h2" gutterBottom>
            nickname : {user.nickname}
          </Typography>
          <Typography variant="h2" gutterBottom>
            Surname : {user.surname}
          </Typography>
        </>
      }
    />
  );
};

Summary.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    surname: PropTypes.string.isRequired
  })
};

export default Summary;
