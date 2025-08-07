import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AddCircle from '@mui/icons-material/AddCircle';
import Cancel from '@mui/icons-material/Cancel';
import PropTypes from 'prop-types';

import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../../../../actions/Quicksearch';
import { entityOptionForSelector } from '../../../../../../helpers/Entity';
import Translate from '../../../../../common/Translate';

import MultipleSelectComponent from '../MultipleSelect';
import CreateNewCaver from './CreateNewCaver';

const MultipleCaversSelect = ({
  computeHasError,
  contextValueName,
  helperText,
  labelName,
  required = false
}) => {
  const dispatch = useDispatch();
  const {
    error: searchError,
    isLoading,
    results: searchResults
  } = useSelector(state => state.quicksearch);

  const [isActionEnable, setActionEnable] = useState(false);
  const [isCreateCaverOpen, setCreateCaverOpen] = useState(false);
  const [defaultNewName, setDefaultNewName] = useState('');

  const loadSearchResults = inputValue => {
    dispatch(
      fetchQuicksearchResult({
        query: inputValue,
        resourceTypes: ['cavers'],
        complete: false
      })
    );
    setDefaultNewName(inputValue);
  };
  const resetSearchResults = () => {
    dispatch(resetQuicksearch());
  };

  useEffect(() => {
    if (isLoading) {
      setActionEnable(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleOpenSideAction = () => {
    setCreateCaverOpen(!isCreateCaverOpen);
  };

  return (
    <MultipleSelectComponent
      computeHasError={computeHasError}
      contextValueName={contextValueName}
      getOptionLabel={option => option.nickname}
      getOptionSelected={(optionToTest, valueToTest) =>
        optionToTest.id === valueToTest.id
      }
      helperText={helperText}
      isLoading={isLoading}
      labelName={labelName}
      loadSearchResults={loadSearchResults}
      nbCharactersNeededToLaunchSearch={3}
      noOptionsText={
        <Translate>No author matches you search criteria</Translate>
      }
      required={required}
      renderOption={entityOptionForSelector}
      resetSearchResults={resetSearchResults}
      searchError={searchError}
      searchResults={searchResults}
      sideActionDisabled={!isActionEnable}
      sideActionIcon={
        isCreateCaverOpen ? (
          <Cancel fontSize="large" />
        ) : (
          <AddCircle fontSize="large" />
        )
      }
      isSideActionOpen={isCreateCaverOpen}
      onSideAction={handleOpenSideAction}>
      <CreateNewCaver
        contextValueName={contextValueName}
        enabled={isCreateCaverOpen}
        onCreateSuccess={handleOpenSideAction}
        defaultName=""
        defaultSurname={defaultNewName}
      />
    </MultipleSelectComponent>
  );
};

MultipleCaversSelect.propTypes = {
  computeHasError: PropTypes.func.isRequired,
  contextValueName: PropTypes.string.isRequired,
  helperText: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default MultipleCaversSelect;
