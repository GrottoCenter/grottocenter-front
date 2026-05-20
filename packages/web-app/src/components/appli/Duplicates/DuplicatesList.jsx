import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  deleteDuplicates,
  fetchDuplicatesList
} from '../../../actions/DuplicatesImport';
import EntityTable from '../../common/EntityTable';

import TableActions from './TableActions';
import { resetDocumentApiErrors } from '../../../actions/Document/ResetApiErrors';
import { resetEntranceState } from '../../../actions/Entrance/ResetEntrance';

const DuplicatesList = ({
  duplicateType,
  selectedDuplicates,
  setSelectedDuplicates,
  nextStep
}) => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [pageRows, setPageRows] = useState([]);

  const { loading, duplicatesList, totalCount, latestHttpCodeOnDelete } =
    useSelector(state => state.duplicatesImport);

  const { latestHttpCode: httpCodeEntry } = useSelector(
    state => state.entrance
  );
  const { latestHttpCode: httpCodeDocument } = useSelector(
    state => state.createDocument
  );

  useEffect(() => {
    dispatch(resetEntranceState());
    dispatch(resetDocumentApiErrors());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [httpCodeEntry, httpCodeDocument]);

  useEffect(() => {
    if ([200, 204].includes(latestHttpCodeOnDelete)) {
      const criteria = {
        limit: rowsPerPage,
        skip: page * rowsPerPage
      };
      dispatch(fetchDuplicatesList(duplicateType, criteria));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestHttpCodeOnDelete]);

  useEffect(() => {
    const criteria = {
      limit: rowsPerPage,
      skip: page * rowsPerPage
    };
    dispatch(fetchDuplicatesList(duplicateType, criteria));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPerPage, page, duplicateType]);

  useEffect(() => {
    let formated = [];
    if (duplicateType === 'entrance') {
      formated = duplicatesList.map(e => ({
        id: e.id,
        docId: e.entrance,
        name: e.content?.nameDescLoc?.name?.text
      }));
    } else if (duplicateType === 'document') {
      formated = duplicatesList.map(e => ({
        id: e.id,
        docId: e.document,
        name: e.content?.description?.title
      }));
    }
    setPageRows(formated);
  }, [duplicatesList, duplicateType]);

  return (
    <>
      <br />
      <EntityTable
        entityType="duplicate"
        isLoading={loading}
        pageRows={pageRows}
        nbTotalRows={totalCount}
        onPageChange={(pageNum, pageSize) => {
          setPage(pageNum);
          setRowsPerPage(pageSize);
        }}
        onRowClick={() => false}
        onSelected={ids => {
          setSelectedDuplicates(ids);
        }}
      />
      <TableActions
        isDisabled={selectedDuplicates.length === 0}
        onClickSelect={nextStep}
        onClickDelete={() => {
          dispatch(deleteDuplicates(selectedDuplicates, duplicateType));
        }}
      />
    </>
  );
};

DuplicatesList.propTypes = {
  selectedDuplicates: PropTypes.arrayOf(PropTypes.number).isRequired,
  setSelectedDuplicates: PropTypes.func.isRequired,
  nextStep: PropTypes.func.isRequired,
  duplicateType: PropTypes.oneOf(['entrance', 'document'])
};

export default DuplicatesList;
