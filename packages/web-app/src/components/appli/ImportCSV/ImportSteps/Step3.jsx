import React, { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import { DOCUMENT } from '../constants';
import EntityTable from '../../../common/EntityTable/EntityTable';

const Step3 = () => {
  const { formatMessage } = useIntl();
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const getpageRows = () =>
    importData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const [currentData, updateCurrentData] = useState(getpageRows());

  useEffect(() => {
    updateCurrentData(getpageRows());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPerPage, page, importData]);

  let entityType = 'csvImportEntrances';
  if (selectedType === DOCUMENT) entityType = 'csvImportDocuments';

  return importData.length === 0 ? (
    formatMessage({ id: 'No result.' })
  ) : (
    <EntityTable
      entityType={entityType}
      isLoading={false}
      pageRows={currentData}
      nbTotalRows={importData.length}
      onPageChange={(pageNum, pageSize) => {
        setPage(pageNum);
        setRowsPerPage(pageSize);
      }}
      onRowClick={() => false}
    />
  );
};

export default Step3;
