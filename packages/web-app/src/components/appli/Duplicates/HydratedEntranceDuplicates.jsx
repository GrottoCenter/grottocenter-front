import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { LinearProgress as MuiLinearProgress } from '@material-ui/core';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import { fetchDuplicate } from '../../../actions/DuplicatesImport';
import DuplicatesHandler from '../../common/DuplicatesHandler';

const LinearProgress = styled(MuiLinearProgress)`
  visibility: ${({ $isLoading }) => ($isLoading ? 'visible' : 'hidden')};
`;

const HydratedEntranceDuplicates = ({ selectedDuplicates }) => {
  const { loading: loadingSubmitAction, latestHttpCode } = useSelector(
    state => state.entry
  );
  const { loading: loadingDuplicate, duplicate, duplicateError } = useSelector(
    state => state.duplicatesImport
  );
  const loading = loadingSubmitAction || loadingDuplicate;
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [currentDuplicate, setCurrentDuplicate] = useState(0);

  useEffect(() => {
    dispatch(fetchDuplicate(selectedDuplicates[currentDuplicate], 'entrance'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDuplicate]);

  useEffect(() => {
    if (latestHttpCode === 200) {
      setCurrentDuplicate(currentDuplicate + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCode]);

  const updateEntry = entryObject => {
    dispatch(updateEntry(entryObject));
  };

  const createEntry = entryObject => {
    dispatch(createEntry(entryObject));
  };

  return (
    <>
      {loading && <LinearProgress $isLoading={loading} />}
      {duplicate && isNil(duplicateError) && (
        <>
          <DuplicatesHandler
            duplicateType="entrance"
            duplicate1={duplicate.entrance}
            duplicate2={duplicate.content}
            titleDuplicate1={formatMessage({ id: 'Duplicate from database' })}
            titleDuplicate2={formatMessage({ id: 'Duplicate from import' })}
            handleSubmit={updateEntry}
            handleNotDuplicateSubmit={createEntry}
          />
        </>
      )}
    </>
  );
};

HydratedEntranceDuplicates.propTypes = {
  selectedDuplicates: PropTypes.arrayOf(PropTypes.number).isRequired
};

export default HydratedEntranceDuplicates;
