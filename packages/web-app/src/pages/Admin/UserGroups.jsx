import React, { useEffect, useState } from 'react';
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

import GROUPS from '../../helpers/GroupHelper';

const SpacedButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1)};
`;

const UserGroups = ({ isLoading, onSaveGroups, userGroups = [] }) => {
  const { formatMessage } = useIntl();
  const [groups, setGroups] = useState(userGroups);

  useEffect(() => {
    setGroups(userGroups);
  }, [userGroups]);

  const isGroupsChanged =
    groups
      .map(e => e.id)
      .toSorted()
      .join(',') !==
    userGroups
      .map(e => e.id)
      .toSorted()
      .join(',');

  const onGroupChange = (groupId, isChecked) => {
    const newGroups = userGroups.filter(g => g.id !== groupId);
    if (isChecked === true) {
      newGroups.push({ id: groupId });
    }
    setGroups([...newGroups]);
  };

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'Groups' })}
      </Typography>
      {GROUPS.filter(g => g.canBeChanged).map(g => (
        <FormControlLabel
          key={g.id}
          control={
            <Switch
              checked={groups.some(e => e.id === g.id)}
              onChange={event => onGroupChange(g.id, event.target.checked)}
              name={g.name}
              color="secondary"
            />
          }
          label={formatMessage({ id: g.name })}
          style={{ display: 'block' }}
        />
      ))}

      <SpacedButton
        onClick={() => onSaveGroups(groups)}
        color={isLoading ? 'inherit' : 'primary'}
        disabled={!isGroupsChanged || isLoading}>
        {isLoading ? (
          <CircularProgress size={20} color="primary" />
        ) : (
          formatMessage({ id: 'Save' })
        )}
      </SpacedButton>

      <SpacedButton
        variant="outlined"
        onClick={() => setGroups([...userGroups])}
        disabled={!isGroupsChanged || isLoading}>
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>
    </>
  );
};

UserGroups.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  onSaveGroups: PropTypes.func.isRequired,
  userGroups: PropTypes.arrayOf(PropTypes.shape({}))
};

export default UserGroups;
