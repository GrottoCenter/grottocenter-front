import { useCallback, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useMediaQuery } from '@mui/material';
import { isDocumentProcessFinished } from '@/utils/documentProcessResults';

import { useDocuments, usePermissions } from '../../hooks';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import StandardDialog from '../../components/common/StandardDialog';
import Actions from './Actions';
import DocumentPreview from './DocumentPreview';
import ProcessResults from './ProcessResults';
import DocumentEdit from '../DocumentEdit';
import AuthChecker from '../../components/appli/AuthChecker';

import EntityTable from '../../components/common/EntityTable';

const DocumentValidationPage = () => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  // Viewport-based rather than UA-based so DevTools emulation, tablets and
  // narrow desktop windows all get the fullscreen dialog. Matches the
  // `max-width: 600px` media queries used by StandardDialog itself.
  const isNarrowViewport = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const [selectedIds, setSelectedIds] = useState([]);
  const [draft, setDraft] = useState({ isValidated: true, comment: '' });
  const [processBatches, setProcessBatches] = useState([]);
  const unfinishedSubmissions = useRef(new Map());

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [detailedView, setDetailedView] = useState(null);
  const [editView, setEditView] = useState(null);

  const closeDetailedView = () => setDetailedView(null);
  const closeEditView = () => setEditView(null);

  const { isFetching, data } = useDocuments({
    isValidated: false,
    limit: rowsPerPage,
    skip: page * rowsPerPage
  });
  const documents = data?.documents ?? [];
  const totalCount = data?.totalCount ?? 0;

  const handleProcessed = useCallback((results, variables) => {
    const finishedIds = new Set(
      results.filter(isDocumentProcessFinished).map(result => result.id)
    );
    setSelectedIds(ids => ids.filter(id => !finishedIds.has(id)));
    setDetailedView(id => (finishedIds.has(id) ? null : id));
    results.forEach(result => {
      if (isDocumentProcessFinished(result)) {
        unfinishedSubmissions.current.delete(result.id);
      } else if (variables) {
        unfinishedSubmissions.current.set(result.id, {
          isValidated: variables.isValidated,
          comment: variables.comment
        });
      }
    });
    // A successful unrelated batch must not erase an unresolved submission's
    // comment. Keep its context even if its IDs are temporarily deselected.
    const unfinishedDraft = [...unfinishedSubmissions.current.values()].at(-1);
    if (unfinishedDraft) setDraft(unfinishedDraft);
    setProcessBatches(batches => [
      ...batches,
      { key: batches.length, results }
    ]);
  }, []);

  // useUpdateDocument invalidates documentKeys.all on success — the queue
  // refetches automatically. This page just closes the edit modal.
  const handleSuccessfulUpdate = () => {
    closeEditView();
  };

  return (
    <>
      <Layout
        title={formatMessage({ id: 'Documents awaiting validation' })}
        action={
          permissions.isModerator ? (
            <Actions
              selectedIds={selectedIds}
              onEdit={setEditView}
              onProcessed={handleProcessed}
              documents={documents}
              draft={draft}
              onDraftChange={setDraft}
            />
          ) : null
        }
        content={
          <AuthChecker
            componentToDisplay={
              <>
                <ProcessResults batches={processBatches} />
                <EntityTable
                  entityType="documents"
                  isLoading={isFetching}
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
              </>
            }
          />
        }
      />
      {detailedView && (
        <DocumentPreview
          key={detailedView}
          id={detailedView}
          onClose={closeDetailedView}
          onEdit={setEditView}
          onProcessed={handleProcessed}
          processBatches={processBatches}
          draft={draft}
          onDraftChange={setDraft}
        />
      )}
      <StandardDialog
        maxWidth="lg"
        fullScreen={isNarrowViewport}
        fullWidth
        scrollable
        open={!!editView}
        onClose={closeEditView}
        title={formatMessage({ id: 'Edit document' })}>
        {editView && (
          <DocumentEdit
            key={editView}
            onSuccessfulUpdate={handleSuccessfulUpdate}
            onCancel={closeEditView}
            id={editView}
            requireUpdate
          />
        )}
      </StandardDialog>
    </>
  );
};

export default DocumentValidationPage;
