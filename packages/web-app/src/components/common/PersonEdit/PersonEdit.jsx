import React, { useEffect } from 'react';
import { useParams, useSelector } from 'react-router-dom';
import { pathOr } from 'ramda';
import { useDispatch } from 'react-redux';
import Typography from '@material-ui/core/Typography';
import { useUserProperties, usePermissions } from '../../../hooks';

// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useIntl } from 'react-intl';
// import { isEmpty, match } from 'ramda';

// import { useHistory } from 'react-router-dom';
// import { emailRegexp, PASSWORD_MIN_LENGTH } from '../../conf/Config';
// import { postSignUp } from '../../actions/SignUp';
// import { useNotification, usePermissions } from '../../hooks';
// import PersonEditForm from '../../../pages/PersonEditPage';
import PersonEditPage from '../../../pages/PersonEditPage';
import { loadUser } from '../../../actions/User';

const PersonEdit = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const personId = pathOr(null, ['id'], useUserProperties());
  const { user } = useSelector(state => state.User);
  const isAllowed =
    personId.toString() === userId.toString() || permissions.isAdmin;

  useEffect(() => {
    dispatch(loadUser(userId));
  }, [userId, dispatch]);

  if (user === null) {
    return (
      <Typography variant="h3">
        person edit Error, the person you are looking for is not available.
      </Typography>
    );
  }
  if (isAllowed) {
    return <Typography variant="h3">allowed</Typography>;
  }
  return <PersonEditPage isFetching={false} userValues={user} />;
};

PersonEdit.propTypes = {};

export default PersonEdit;
