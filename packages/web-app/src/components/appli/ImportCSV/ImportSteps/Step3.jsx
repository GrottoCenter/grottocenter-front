import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { ImportPageContentContext } from '../Provider';
import * as CONSTANTS from '../constants';
import Table from '../../../common/Table';
import { createColumns } from '../../../common/Table/TableHead';
import useCustomHeaderRender from '../useCustomHeaderRender';

const commonHiddenColumns = [
  CONSTANTS.ALTERNATE_NAME,
  CONSTANTS.ATTRIBUTION_NAME,
  CONSTANTS.ATTRIBUTION_URL,
  CONSTANTS.CREATION_DATE,
  CONSTANTS.DESCRIPTION_DOCUMENT,
  CONSTANTS.DESCRIPTION_DOCUMENT_CREATOR,
  CONSTANTS.DESCRIPTION_DOCUMENT_LANGUAGE,
  CONSTANTS.ID,
  CONSTANTS.MODIFICATION_DATE,
  CONSTANTS.TYPE
];

const defaultHiddenColumnsEntrance = [
  ...commonHiddenColumns,
  CONSTANTS.CONTAINED_IN_PLACE,
  CONSTANTS.CONTAINED_IN_PLACE,
  CONSTANTS.DESCRIPTION_LOCATION,
  CONSTANTS.DESCRIPTION_LOCATION_CREATOR,
  CONSTANTS.DESCRIPTION_LOCATION_LANGUAGE,
  CONSTANTS.DISCOVERED_BY,
  CONSTANTS.EXTEND_ABOVE,
  CONSTANTS.EXTEND_BELOW
];

const defaultHiddenColumnsDocument = [
  ...commonHiddenColumns,
  CONSTANTS.FORMAT,
  CONSTANTS.SOURCE,
  CONSTANTS.SUBJECT,
  CONSTANTS.IDENTIFIER,
  CONSTANTS.IS_PART_OF,
  CONSTANTS.REFERENCES,
  CONSTANTS.UNDERGROUND
];

const Step3 = () => {
  const { importData, selectedType } = useContext(ImportPageContentContext);

  const defaulHiddenColumns = useMemo(() => {
    let returnedHiddenColumns;
    switch (selectedType) {
      case CONSTANTS.DOCUMENT:
        returnedHiddenColumns = defaultHiddenColumnsDocument;
        break;
      case CONSTANTS.ENTRANCE:
        returnedHiddenColumns = defaultHiddenColumnsEntrance;
        break;
      default:
    }
    return returnedHiddenColumns;
  }, [selectedType]);

  const { formatMessage } = useIntl();
  const makeTranslation = id => formatMessage({ id });
  const [hiddenColumns, setHiddenColumns] = useState(defaulHiddenColumns);
  const [columns, setColumns] = useState(
    createColumns(importData, makeTranslation)
  );
  const [currentPage, setCurrentPage] = useState(0);
  const customHeaderRender = useCustomHeaderRender();
  const [order, setOrder] = useState(null);
  const [orderBy, setOrderBy] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [currentData, updateCurrentData] = useState(
    importData.slice(
      currentPage * rowsPerPage,
      currentPage * rowsPerPage + rowsPerPage
    )
  );

  useEffect(() => {
    setColumns(createColumns(importData, makeTranslation));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importData]);

  useEffect(() => {
    updateCurrentData(
      importData.slice(
        currentPage * rowsPerPage,
        currentPage * rowsPerPage + rowsPerPage
      )
    );
  }, [order, orderBy, rowsPerPage, currentPage, importData]);

  return importData.length === 0 ? (
    formatMessage({ id: 'No result.' })
  ) : (
    <Table
      columns={columns}
      currentPage={currentPage}
      customCellRenders={undefined}
      customHeaderCellRenders={customHeaderRender}
      data={currentData}
      hiddenColumns={hiddenColumns}
      loading={undefined}
      openDetailedView={undefined}
      order={order}
      orderBy={orderBy || undefined}
      rowsCount={importData.length}
      rowsPerPage={rowsPerPage}
      selection={undefined}
      title={formatMessage({ id: 'Csv content' })}
      updateCurrentPage={setCurrentPage}
      updateHiddenColumns={setHiddenColumns}
      updateOrder={setOrder}
      updateOrderBy={setOrderBy}
      updateRowsPerPage={setRowsPerPage}
      updateSelection={undefined}
    />
  );
};

export default Step3;
