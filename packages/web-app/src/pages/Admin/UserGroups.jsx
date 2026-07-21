import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import {
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Switch,
  Tooltip,
  Typography
} from '@mui/material';

import GROUPS from '../../helpers/GroupHelper';

const SpacedButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(0.5)};
`;

const UserGroups = ({
  isLoading,
  onBeforeSave,
  onSaveGroups,
  onSaveBan,
  userGroups = [],
  isBanned = false,
  isSelfUser = false
}) => {
  const { formatMessage } = useIntl();
  const [groups, setGroups] = useState(userGroups);
  const [banned, setBanned] = useState(isBanned);

  useEffect(() => {
    setGroups(userGroups);
  }, [userGroups]);

  useEffect(() => {
    setBanned(isBanned);
  }, [isBanned]);

  const isGroupsChanged =
    groups
      .map(e => e.id)
      .toSorted()
      .join(',') !==
    userGroups
      .map(e => e.id)
      .toSorted()
      .join(',');

  const isBanChanged = banned !== isBanned;
  const isChanged = isGroupsChanged || isBanChanged;

  const onGroupChange = (groupId, isChecked) => {
    const newGroups = groups.filter(g => g.id !== groupId);
    if (isChecked === true) {
      newGroups.push({ id: groupId });
    }
    setGroups([...newGroups]);
  };

  const handleSave = () => {
    if (onBeforeSave) {
      onBeforeSave({ isGroupsChanged, isBanChanged });
    }
    if (isGroupsChanged) {
      onSaveGroups(groups);
    }
    if (isBanChanged) {
      onSaveBan(banned);
    }
  };

  const handleReset = () => {
    setGroups([...userGroups]);
    setBanned(isBanned);
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
              disabled={isLoading}
            />
          }
          label={formatMessage({ id: g.name })}
          style={{ display: 'block' }}
        />
      ))}
      <Divider sx={{ my: 1 }} />
      <Typography variant="h3" gutterBottom>
        {formatMessage({ id: 'Banned' })}
      </Typography>
      <Tooltip
        title={
          isSelfUser ? formatMessage({ id: 'Cannot ban yourself' }) : ''
        }
        arrow>
        <span>
          <FormControlLabel
            control={
              <Switch
                checked={banned}
                onChange={event => setBanned(event.target.checked)}
                name="Banned"
                color="error"
                disabled={isSelfUser || isLoading}
              />
            }
            label={formatMessage({ id: 'Banned' })}
            style={{ display: 'block' }}
          />
        </span>
      </Tooltip>
      <SpacedButton
        onClick={handleSave}
        color={isLoading ? 'inherit' : 'primary'}
        disabled={!isChanged || isLoading}>
        {isLoading ? (
          <CircularProgress size={20} color="primary" />
        ) : (
          formatMessage({ id: 'Save' })
        )}
      </SpacedButton>
      <SpacedButton
        variant="outlined"
        onClick={handleReset}
        disabled={!isChanged || isLoading}>
        {formatMessage({ id: 'Reset' })}
      </SpacedButton>
    </>
  );
};

UserGroups.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  onBeforeSave: PropTypes.func,
  onSaveGroups: PropTypes.func.isRequired,
  onSaveBan: PropTypes.func.isRequired,
  userGroups: PropTypes.arrayOf(PropTypes.shape({})),
  isBanned: PropTypes.bool,
  isSelfUser: PropTypes.bool
};

export default UserGroups;
