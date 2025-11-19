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

import { useDebounce } from '../../hooks';

import AutoCompleteSearch from '../../components/common/AutoCompleteSearch';
import ErrorMessage from '../../components/common/StatusMessage/ErrorMessage';
import SuccessMessage from '../../components/common/StatusMessage/SuccessMessage';

import PersonProperties from '../../components/common/Person/PersonProperties';
import UserGroups from './UserGroups';

import { postPersonGroups } from '../../actions/Person/UpdatePersonGroups';
import { fetchPerson } from '../../actions/Person/GetPerson';

const FeedbackBlock = styled('div')`
  margin-top: ${({ theme }) => theme.spacing(4)};
  text-align: center;
`;

const UserBlock = styled('div')`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const FlexBlock = styled('div')`
  flex: 1;
  margin: ${({ theme }) => theme.spacing(3)};
`;

const SearchBarBackground = styled('div')`
  background-color: ${({ theme }) => theme.palette.primary.veryLight};
`;

const ManageUserGroups = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
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
            sx={{ marginTop: 2 }}
            onClick={() => setSelectedUser(null)}>
            <ClearIcon />
          </IconButton>
          <Button
            sx={{ marginTop: 2, float: 'right' }}
            variant="outlined"
            onClick={() =>
              window.open(`/ui/persons/${selectedUser?.id}`, '_blank')
            }>
            {formatMessage({ id: 'View detail' })}
          </Button>
          <UserBlock>
            <FlexBlock style={{ flexBasis: '300px' }}>
              <PersonProperties person={selectedUser} />
            </FlexBlock>
            <FlexBlock style={{ flexBasis: '200px' }}>
              <UserGroups
                isLoading={isUpdateLoading || isPersonFetching}
                onSaveGroups={groups =>
                  dispatch(postPersonGroups(selectedUser.id, groups))
                }
                userGroups={person?.groups}
              />
            </FlexBlock>
          </UserBlock>
        </>
      )}
      {!isUpdateLoading && (
        <FeedbackBlock>
          {!isUpdateSuccess && !!updateError && (
            <ErrorMessage
              message={formatMessage({
                id: 'Error while updating the user groups'
              })}
            />
          )}
          {isUpdateSuccess && (
            <SuccessMessage
              message={formatMessage({ id: 'Groups updated with success!' })}
            />
          )}
        </FeedbackBlock>
      )}
    </>
  );
};

export default ManageUserGroups;
