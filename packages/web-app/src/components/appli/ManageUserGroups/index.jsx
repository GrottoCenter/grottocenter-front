import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Button, Typography } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';

import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../actions/Quicksearch';

import { entityOptionForSelector } from '../../../helpers/Entity';
import { useDebounce } from '../../../hooks';

import AutoCompleteSearch from '../../common/AutoCompleteSearch';
import ErrorMessage from '../../common/StatusMessage/ErrorMessage';
import SuccessMessage from '../../common/StatusMessage/SuccessMessage';

import PersonProperties from '../../common/Person/PersonProperties';
import UserGroups from './UserGroups';
import { PersonPropTypes } from '../../../types/person.type';

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

const SpacedTopButton = styled(Button)`
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const ManageUserGroups = ({
  initialUser,
  onSaveGroups,
  onSelection,
  selectedUser,
  setSelectedUser
}) => {
  const [inputValue, setInputValue] = useState('');

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const debouncedInput = useDebounce(inputValue);
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
  useSelector(state => state.updatePersonGroups);

  const getOptionLabel = option => option.name;

  const handleOnSelection = selection => {
    onSelection(selection);
    setInputValue('');
  };

  useEffect(() => {
    // Check search input value and launch / reset search
    if (debouncedInput.length > 2) {
      const criteria = {
        query: debouncedInput.trim(),
        complete: true,
        resourceType: 'cavers'
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
          onSelection={handleOnSelection}
          label={formatMessage({ id: 'Search among Grottocenter users...' })}
          inputValue={inputValue}
          onInputChange={setInputValue}
          suggestions={results}
          renderOption={entityOptionForSelector}
          getOptionLabel={getOptionLabel}
          errorMessage="Unexpected error"
          hasError={!!quickSearchError}
          isLoading={searchIsLoading}
        />
      </SearchBarBackground>
      {selectedUser && (
        <>
          <SpacedTopButton
            onClick={() => setSelectedUser(null)}
            startIcon={<ClearIcon />}>
            {formatMessage({ id: 'Unselect user' })}
          </SpacedTopButton>
          <SpacedTopButton
            sx={{ marginLeft: 2 }}
            variant="outlined"
            onClick={() =>
              window.open(`/ui/persons/${selectedUser?.id}`, '_blank')
            }>
            {formatMessage({ id: 'View detail' })}
          </SpacedTopButton>
          <UserBlock>
            <FlexBlock style={{ flexBasis: '300px' }}>
              <PersonProperties person={selectedUser} />
            </FlexBlock>
            <FlexBlock style={{ flexBasis: '200px' }}>
              <UserGroups
                initialUser={initialUser}
                isLoading={isUpdateLoading}
                onSaveGroups={onSaveGroups}
                selectedUser={selectedUser}
                setSelectedUser={setSelectedUser}
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

ManageUserGroups.propTypes = {
  initialUser: PersonPropTypes,
  onSaveGroups: PropTypes.func.isRequired,
  onSelection: PropTypes.func.isRequired,
  selectedUser: PersonPropTypes,
  setSelectedUser: PropTypes.func.isRequired
};

export default ManageUserGroups;
