import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { isMobileOnly } from 'react-device-detect';
import { Typography } from '@mui/material';

import { getDocuments } from '../../actions/Document/GetDocuments';
import { resetDocumentApiErrors } from '../../actions/Document/ResetApiErrors';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import StandardDialog from '../../components/common/StandardDialog';
import Actions from './Actions';
import DocumentDetails from '../DocumentDetails';
import DocumentEdit from '../DocumentEdit';
import AuthChecker from '../../components/appli/AuthChecker';

import EntityTable from '../../components/common/EntityTable';
import Translate from '../../components/common/Translate';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(2)};
`;

const DocumentValidationPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { isLoading, data, totalCount } = useSelector(state => state.documents);
  const { success: isActionSuccess } = useSelector(
    state => state.processDocuments
  );
  const [selectedIds, setSelectedIds] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [detailedView, setDetailedView] = useState(null);
  const [editView, setEditView] = useState(null);
  const [refreshPage, setRefreshPage] = useState(false);

  const closeDetailedView = () => setDetailedView(null);
  const closeEditView = () => setEditView(null);

  const loadDocuments = useCallback(() => {
    setRefreshPage(false);
    setSelectedIds([]);
    closeDetailedView();
    const criteria = {
      isValidated: false,
      limit: rowsPerPage,
      skip: page * rowsPerPage
    };
    dispatch(getDocuments(criteria));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowsPerPage, page]);

  const handleSuccessfulUpdate = () => {
    dispatch(resetDocumentApiErrors());
    closeEditView();
    loadDocuments();
  };

  const isUpdatedDocRequired = () => {
    // We fetch the updated doc only if the doc has been modified
    if (!editView || data.documents.length === 0) return false;
    return (
      data.documents.find(doc => doc.id === editView).modifiedDocJson !== null
    );
  };

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    if (refreshPage) loadDocuments();
  }, [loadDocuments, refreshPage]);

  useEffect(() => {
    if (isActionSuccess) setRefreshPage(true);
  }, [isActionSuccess]);

  return (
    <>
      <Layout
        title={formatMessage({ id: 'Documents awaiting validation' })}
        content={
          <AuthChecker
            componentToDisplay={
              <Wrapper>
                <Typography variant="h6" component="div" gutterBottom>
                  <Translate>Documents</Translate>
                </Typography>
                <EntityTable
                  entityType="documents"
                  isLoading={isLoading}
                  pageRows={data.documents}
                  nbTotalRows={totalCount}
                  onPageChange={(pageNum, pageSize) => {
                    setPage(pageNum);
                    setRowsPerPage(pageSize);
                  }}
                  onRowClick={doc => {
                    setDetailedView(doc.id);
                    return false;
                  }}
                  onSelected={ids => {
                    setSelectedIds(ids);
                  }}
                />
                <Actions selectedIds={selectedIds} onEdit={setEditView} />
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
        open={!!detailedView}
        onClose={closeDetailedView}
        title={formatMessage({ id: 'Detailed document view' })}>
        {detailedView && <DocumentDetails id={detailedView} hideActions />}
      </StandardDialog>
      <StandardDialog
        maxWidth="lg"
        fullScreen={isMobileOnly}
        fullWidth
        scrollable
        open={!!editView}
        onClose={closeEditView}
        title={formatMessage({ id: 'Edit document' })}>
        <DocumentEdit
          onSuccessfulUpdate={handleSuccessfulUpdate}
          onCancel={closeEditView}
          id={editView}
          requireUpdate={isUpdatedDocRequired()}
        />
      </StandardDialog>
    </>
  );
};

export default DocumentValidationPage;
