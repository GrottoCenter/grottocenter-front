import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { reject, isNil, propOr, isEmpty } from 'ramda';
import { isMobileOnly } from 'react-device-detect';

import { getDocuments } from '../../actions/Document/GetDocuments';
import { resetApiMessages } from '../../actions/Document/ResetApiMessages';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import StandardDialog from '../../components/common/StandardDialog';
import { useDebounce } from '../../hooks';
import Actions from './Actions';
import DocumentDetails from '../DocumentDetails';
import DocumentsTable from '../../components/common/DocumentsTable';
import DocumentEdit from '../DocumentEdit';
import AuthChecker from '../../components/appli/AuthChecker';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(2)}px;
`;

const DocumentValidationPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { isLoading, data, totalCount } = useSelector(state => state.documents);
  const { success: isActionSuccess } = useSelector(
    state => state.processDocuments
  );
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState();
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [detailedView, setDetailedView] = useState(null);
  const [editView, setEditView] = useState(null);
  const [refreshPage, setRefreshPage] = useState(false);
  const debouncedOrder = useDebounce(order);
  const debouncedPage = useDebounce(page);
  const debouncedOrderBy = useDebounce(orderBy);
  const debouncedRowsPerPage = useDebounce(rowsPerPage);

  const closeDetailedView = () => {
    setDetailedView(null);
  };

  const closeEditView = () => {
    setEditView(null);
  };

  const loadDocuments = useCallback(() => {
    setRefreshPage(false);
    setSelected([]);
    closeDetailedView();
    const criteria = {
      isValidated: false,
      limit: debouncedRowsPerPage,
      skip: debouncedPage * debouncedRowsPerPage,
      sortBy: debouncedOrderBy,
      orderBy: debouncedOrder
    };
    dispatch(getDocuments(reject(isNil, criteria)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedRowsPerPage, debouncedOrderBy, debouncedOrder, debouncedPage]);

  const handleSuccessfulUpdate = () => {
    dispatch(resetApiMessages());
    closeEditView();
    loadDocuments();
  };

  const isUpdatedDocRequired = () => {
    // We fetch the updated doc only if the doc has been modified
    if (isNil(editView) || isEmpty(data.documents)) {
      return false;
    }
    return (
      data.documents.find(doc => doc.id === editView).modifiedDocJson !== null
    );
  };

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (refreshPage) {
      loadDocuments();
    }
  }, [loadDocuments, refreshPage]);

  useEffect(() => {
    if (isActionSuccess) {
      setRefreshPage(true);
    }
  }, [isActionSuccess]);

  return (
    <>
      <Layout
        title={formatMessage({ id: 'Documents awaiting validation' })}
        content={
          <AuthChecker
            componentToDisplay={
              <Wrapper>
                <DocumentsTable
                  currentPage={page}
                  documents={propOr([], 'documents', data)}
                  loading={isLoading}
                  openDetailedView={setDetailedView}
                  order={order}
                  orderBy={orderBy || undefined}
                  rowsCount={totalCount || 0}
                  rowsPerPage={rowsPerPage}
                  selected={selected}
                  updateOrder={setOrder}
                  updateOrderBy={setOrderBy}
                  updatePage={setPage}
                  updateRowsPerPage={setRowsPerPage}
                  updateSelected={setSelected}
                />
                <Actions selected={selected} onEdit={setEditView} />
              </Wrapper>
            }
          />
        }
      />
      <StandardDialog
        maxWidth="lg"
        fullScreen={isMobileOnly}
        fullWidth
        scrollable
        open={!isNil(detailedView)}
        onClose={closeDetailedView}
        title={formatMessage({ id: 'Detailed document view' })}>
        {detailedView && <DocumentDetails id={detailedView} />}
      </StandardDialog>
      <StandardDialog
        maxWidth="lg"
        fullScreen={isMobileOnly}
        fullWidth
        scrollable
        open={!isNil(editView)}
        onClose={closeEditView}
        title={formatMessage({ id: 'Edit document' })}>
        <DocumentEdit
          onSuccessfulUpdate={handleSuccessfulUpdate}
          id={editView}
          requireUpdate={isUpdatedDocRequired()}
        />
      </StandardDialog>
    </>
  );
};

export default DocumentValidationPage;
