import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import {
  Button,
  CircularProgress,
  FormControlLabel,
  Switch,
  Typography
} from '@mui/material';

import GROUPS from '../../../helpers/GroupHelper';

const SpacedButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1)};
`;

const UserGroups = ({
  initialUser,
  isLoading,
  onSaveGroups,
  selectedUser,
  setSelectedUser
}) => {
  const { formatMessage } = useIntl();
  // eslint-disable-next-line no-param-reassign
  if (!initialUser.groups) initialUser.groups = [];

  const userGroupsHaveChanged =
    // Check if groups are different between selectedUser and initialUser
    selectedUser !== null && initialUser !== null
      ? selectedUser.groups.reduce(
          (groupsHaveChanged, g) =>
            groupsHaveChanged ||
            !initialUser.groups.some(initialGroup => g.id === initialGroup.id),
          false
        ) || selectedUser.groups.length !== initialUser.groups.length
      : false;

  const handleGroupChange = (userId, groupId, isChecked) => {
    const newGroups = selectedUser.groups.filter(g => g.id !== groupId);
    if (isChecked === true) {
      newGroups.push({ id: groupId });
    }
    setSelectedUser({ ...selectedUser, groups: newGroups });
  };

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'Groups' })}
      </Typography>
      {GROUPS.filter(g => g.canBeChanged).map(possibleGroup => (
        <FormControlLabel
          key={possibleGroup.id}
          control={
            <Switch
              checked={selectedUser.groups.some(g => g.id === possibleGroup.id)}
              onChange={event =>
                handleGroupChange(
                  selectedUser.id,
                  possibleGroup.id,
                  event.target.checked
                )
              }
              name={possibleGroup.name}
              color="secondary"
            />
          }
          label={formatMessage({ id: possibleGroup.name })}
          style={{ display: 'block' }}
        />
      ))}

      <SpacedButton
        onClick={onSaveGroups}
        color={isLoading ? 'inherit' : 'primary'}
        disabled={!userGroupsHaveChanged || isLoading}>
        {isLoading ? (
          <CircularProgress size={20} color="primary" />
        ) : (
          formatMessage({ id: 'Save' })
        )}
      </SpacedButton>

      <SpacedButton
        variant="outlined"
        onClick={() => setSelectedUser(initialUser)}
        disabled={!userGroupsHaveChanged || isLoading}>
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>
    </>
  );
};

UserGroups.propTypes = {
  initialUser: PropTypes.shape({
    groups: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  isLoading: PropTypes.bool.isRequired,
  onSaveGroups: PropTypes.func.isRequired,
  selectedUser: PropTypes.shape({
    id: PropTypes.number,
    groups: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  setSelectedUser: PropTypes.func.isRequired
};

export default UserGroups;
