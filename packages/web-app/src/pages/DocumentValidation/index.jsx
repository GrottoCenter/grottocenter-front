import { useState } from 'react';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { isMobileOnly } from 'react-device-detect';
import { Typography } from '@mui/material';

import { useDocuments } from '../../hooks';
import { documentKeys } from '../../api/queryKeys';
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
  padding: ${({ theme }) => theme.spacing(1)};
`;

const DocumentValidationPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [detailedView, setDetailedView] = useState(null);
  const [editView, setEditView] = useState(null);

  const closeDetailedView = () => setDetailedView(null);
  const closeEditView = () => setEditView(null);

  const { isLoading, data } = useDocuments({
    isValidated: false,
    limit: rowsPerPage,
    skip: page * rowsPerPage
  });
  const documents = data?.documents ?? [];
  const totalCount = data?.totalCount ?? 0;

  // useProcessDocuments already invalidates documentKeys.all, so the queue
  // refetches on validate/decline. This callback only resets the UI selection
  // and closes the details modal (side effects that stay local to this page).
  const handleProcessed = () => {
    setSelectedIds([]);
    closeDetailedView();
  };

  const handleSuccessfulUpdate = () => {
    dispatch(resetDocumentApiErrors());
    closeEditView();
    queryClient.invalidateQueries({ queryKey: documentKeys.all });
  };

  const isUpdatedDocRequired = () => {
    if (!editView || documents.length === 0) return false;
    return documents.find(doc => doc.id === editView).modifiedDocJson !== null;
  };

  return (
    <>
      <Layout
        title={formatMessage({ id: 'Documents awaiting validation' })}
        content={
          <AuthChecker
            componentToDisplay={
              <Wrapper>
                <Typography variant="h3" component="h2" gutterBottom>
                  <Translate>Documents</Translate>
                </Typography>
                <EntityTable
                  entityType="documents"
                  isLoading={isLoading}
                  pageRows={documents}
                  nbTotalRows={totalCount}
                  selectedIds={selectedIds}
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
                <Actions
                  selectedIds={selectedIds}
                  onEdit={setEditView}
                  onProcessed={handleProcessed}
                />
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
