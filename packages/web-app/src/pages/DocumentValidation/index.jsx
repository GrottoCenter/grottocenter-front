import { useCallback, useState } from 'react';
import { useIntl } from 'react-intl';
import { useMediaQuery } from '@mui/material';
import {
  ANOMALY_STATUSES,
  isDocumentProcessFinished
} from '@/utils/documentProcessResults';

import { useDocuments, usePermissions } from '../../hooks';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import StandardDialog from '../../components/common/StandardDialog';
import Actions from './Actions';
import DocumentPreview from './DocumentPreview';
import ProcessResults from './ProcessResults';
import DocumentEdit from '../DocumentEdit';
import AuthChecker from '../../components/appli/AuthChecker';

import EntityTable from '../../components/common/EntityTable';

const EMPTY_DRAFT = { isValidated: true, comment: '' };

// The query holds only the latest page, while selected IDs can span pages or
// still be visible in appended mobile cards. Draft lifetime follows active IDs.
const retainActiveDrafts = (drafts, selectedIds, detailedView) =>
  Object.fromEntries(
    Object.entries(drafts).filter(
      ([id]) => selectedIds.includes(Number(id)) || detailedView === Number(id)
    )
  );

const DocumentValidationPage = () => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  // Viewport-based rather than UA-based so DevTools emulation, tablets and
  // narrow desktop windows all get the fullscreen dialog. Matches the
  // `max-width: 600px` media queries used by StandardDialog itself.
  const isNarrowViewport = useMediaQuery(theme => theme.breakpoints.down('sm'));
  // Selection, preview and drafts move together so late mutation callbacks
  // always use the active IDs, including after their Actions have unmounted.
  const [moderation, setModeration] = useState({
    selectedIds: [],
    detailedView: null,
    drafts: {}
  });
  const { selectedIds, detailedView, drafts } = moderation;
  const [processBatches, setProcessBatches] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const [editView, setEditView] = useState(null);

  const handleSelection = ids => {
    setModeration(state => ({
      ...state,
      selectedIds: ids,
      drafts: retainActiveDrafts(state.drafts, ids, state.detailedView)
    }));
  };
  const handlePreview = id => {
    setModeration(state => ({
      ...state,
      detailedView: id,
      drafts: retainActiveDrafts(state.drafts, state.selectedIds, id)
    }));
  };
  const closeDetailedView = () => handlePreview(null);
  const closeEditView = () => setEditView(null);

  const getDraft = ids =>
    ids
      .map(id => drafts[id])
      .filter(Boolean)
      .at(-1) ?? EMPTY_DRAFT;
  const handleDraftChange = (ids, draft) => {
    setModeration(state => ({
      ...state,
      drafts: {
        ...state.drafts,
        ...Object.fromEntries(ids.map(id => [id, draft]))
      }
    }));
  };

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
    setModeration(state => {
      const ids = state.selectedIds.filter(id => !finishedIds.has(id));
      const previewId = finishedIds.has(state.detailedView)
        ? null
        : state.detailedView;
      const nextDrafts = retainActiveDrafts(state.drafts, ids, previewId);
      results.forEach(result => {
        if (isDocumentProcessFinished(result)) {
          delete nextDrafts[result.id];
        } else if (
          variables &&
          (ids.includes(result.id) || previewId === result.id)
        ) {
          nextDrafts[result.id] = {
            isValidated: variables.isValidated,
            comment: variables.comment
          };
        }
      });
      return { selectedIds: ids, detailedView: previewId, drafts: nextDrafts };
    });
    // A later result supersedes the previous anomaly for that ID, including
    // when a manual retry completes it. Keep only current anomaly details.
    setProcessBatches(batches => {
      const processedIds = new Set(results.map(result => result.id));
      const retained = batches
        .map(batch => ({
          ...batch,
          results: batch.results.filter(result => !processedIds.has(result.id))
        }))
        .filter(batch => batch.results.length);
      const anomalies = results.filter(result =>
        ANOMALY_STATUSES.includes(result.status)
      );
      return anomalies.length
        ? [
            ...retained,
            { key: (batches.at(-1)?.key ?? -1) + 1, results: anomalies }
          ]
        : retained;
    });
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
              draft={getDraft(selectedIds)}
              onDraftChange={draft => handleDraftChange(selectedIds, draft)}
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
                    handlePreview(doc.id);
                    return false;
                  }}
                  onSelected={handleSelection}
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
          draft={getDraft([detailedView])}
          onDraftChange={draft => handleDraftChange([detailedView], draft)}
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
