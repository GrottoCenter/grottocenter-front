import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { IconButton, Button, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../actions/Quicksearch';

import { useDebounce, useNotification } from '../../hooks';

import AutoCompleteSearch from '../../components/common/AutoCompleteSearch';
import AppLink from '../../components/common/AppLink';

import PersonProperties from '../../components/common/Person/PersonProperties';
import UserGroups from './UserGroups';

import { postPersonGroups } from '../../actions/Person/UpdatePersonGroups';
import { fetchPerson } from '../../actions/Person/GetPerson';
import { postBanCaver, postUnbanCaver } from '../../actions/Person/BanCaver';

const UserBlock = styled('div')`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const FlexBlock = styled('div')`
  flex: 1;
  margin: ${({ theme }) => theme.spacing(2)};
`;

const SearchBarBackground = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.veryLight};
`;

const getBanErrorMessage = (error, formatMessage) => {
  const status = error?.status;
  if (status === 403) {
    return formatMessage({
      id: 'Insufficient permissions to ban this user'
    });
  }
  if (status === 404) {
    return formatMessage({ id: 'Caver not found' });
  }
  return formatMessage({ id: 'Error while updating the ban status' });
};

const ManageUserGroups = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [didSaveGroups, setDidSaveGroups] = useState(false);
  const [didSaveBan, setDidSaveBan] = useState(false);

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { onSuccess, onError } = useNotification();
  const debouncedInput = useDebounce(inputValue);
  const { person, isFetching: isPersonFetching } = useSelector(
    state => state.person
  );
  const {
    results,
    error: quickSearchError,
    isLoading: searchIsLoading
  } = useSelector(state => state.quicksearch);

  const {
    isLoading: isUpdateLoading,
    isSuccess: isUpdateSuccess,
    error: updateError
  } = useSelector(state => state.updatePersonGroups);

  const {
    isLoading: isBanLoading,
    isSuccess: isBanSuccess,
    error: banError
  } = useSelector(state => state.banCaver);

  const { authTokenDecoded } = useSelector(state => state.login);

  const isSelfUser = !!(
    person?.id &&
    authTokenDecoded?.id &&
    person.id === authTokenDecoded.id
  );

  useEffect(() => {
    // Check search input value and launch / reset search
    if (debouncedInput.length >= 2) {
      const criteria = {
        query: debouncedInput.trim(),
        filter: { type: 'CAVER' },
        entities: ['persons']
      };
      dispatch(fetchQuicksearchResult(criteria));
    } else {
      dispatch(resetQuicksearch());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  useEffect(() => {
    setDidSaveGroups(false);
    setDidSaveBan(false);
  }, [selectedUser]);

  useEffect(() => {
    if (selectedUser && (isUpdateSuccess || isBanSuccess)) {
      dispatch(fetchPerson(selectedUser.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateSuccess, isBanSuccess]);

  useEffect(() => {
    if (!didSaveGroups || isUpdateLoading) return;
    if (isUpdateSuccess)
      onSuccess(formatMessage({ id: 'Groups updated with success!' }));
    else if (updateError)
      onError(formatMessage({ id: 'Error while updating the user groups' }));
    else return; // still in initial state — don't reset
    setDidSaveGroups(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didSaveGroups, isUpdateLoading, isUpdateSuccess, updateError]);

  useEffect(() => {
    if (!didSaveBan || isBanLoading) return;
    if (isBanSuccess)
      onSuccess(formatMessage({ id: 'Ban updated with success!' }));
    else if (banError) onError(getBanErrorMessage(banError, formatMessage));
    else return; // still in initial state — don't reset
    setDidSaveBan(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didSaveBan, isBanLoading, isBanSuccess, banError]);

  return (
    <>
      <Typography variant="h2" gutterBottom>
        {formatMessage({ id: 'Change user groups' })}
      </Typography>
      <SearchBarBackground>
        <AutoCompleteSearch
          disabled={false}
          onSelection={selection => {
            if (selection !== null) {
              setSelectedUser(selection);
              dispatch(fetchPerson(selection.id));
            }
            setInputValue('');
          }}
          label={formatMessage({ id: 'Search among Grottocenter users...' })}
          inputValue={inputValue}
          onInputChange={setInputValue}
          suggestions={results}
          errorMessage="Unexpected error"
          hasError={!!quickSearchError}
          isLoading={searchIsLoading}
        />
      </SearchBarBackground>
      {selectedUser && (
        <>
          <IconButton
            sx={{ marginTop: 1 }}
            onClick={() => setSelectedUser(null)}>
            <ClearIcon />
          </IconButton>
          <Button
            sx={{ marginTop: 1, float: 'right' }}
            variant="outlined"
            component={AppLink}
            to={`/ui/persons/${selectedUser?.id}`}
            openInNewTabDesktop>
            {formatMessage({ id: 'View detail' })}
          </Button>
          <UserBlock>
            <FlexBlock style={{ flexBasis: '300px' }}>
              <PersonProperties person={selectedUser} />
            </FlexBlock>
            <FlexBlock style={{ flexBasis: '200px' }}>
              <UserGroups
                isLoading={isUpdateLoading || isBanLoading || isPersonFetching}
                onBeforeSave={({ isGroupsChanged: g, isBanChanged: b }) => {
                  setDidSaveGroups(g);
                  setDidSaveBan(b);
                }}
                onSaveGroups={groups =>
                  dispatch(postPersonGroups(selectedUser.id, groups))
                }
                onSaveBan={banned => {
                  if (banned) {
                    dispatch(postBanCaver(selectedUser.id));
                  } else {
                    dispatch(postUnbanCaver(selectedUser.id));
                  }
                }}
                userGroups={person?.groups}
                isBanned={person?.isBanned}
                isSelfUser={isSelfUser}
              />
            </FlexBlock>
          </UserBlock>
        </>
      )}
    </>
  );
};

export default ManageUserGroups;
