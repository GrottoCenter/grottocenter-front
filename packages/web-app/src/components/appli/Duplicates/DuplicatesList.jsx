import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import EntityTable from '../../common/EntityTable';

import TableActions from './TableActions';
import { useDeleteDuplicates, useDuplicatesList } from '../../../hooks';

const DuplicatesList = ({
  duplicateType,
  selectedDuplicates,
  setSelectedDuplicates,
  nextStep
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const criteria = {
    limit: rowsPerPage,
    skip: page * rowsPerPage
  };
  const { data, isFetching: loading } = useDuplicatesList(
    duplicateType,
    criteria
  );
  const totalCount = data?.totalCount ?? 0;

  const deleteMutation = useDeleteDuplicates(duplicateType);

  const pageRows = useMemo(() => {
    const list = data?.duplicatesList ?? [];
    if (duplicateType === 'entrance') {
      return list.map(e => ({
        id: e.id,
        docId: e.entrance,
        name: e.content?.nameDescLoc?.name?.text
      }));
    }
    if (duplicateType === 'document') {
      return list.map(e => ({
        id: e.id,
        docId: e.document,
        name: e.content?.description?.title
      }));
    }
    return [];
  }, [data, duplicateType]);

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
        onSelected={ids => {
          setSelectedDuplicates(ids);
        }}
      />
      <TableActions
        isDisabled={selectedDuplicates.length === 0}
        onClickSelect={nextStep}
        onClickDelete={() => deleteMutation.mutate(selectedDuplicates)}
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
