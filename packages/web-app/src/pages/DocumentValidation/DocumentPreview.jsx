import { useId } from 'react';
import {
  Box,
  Card,
  CircularProgress,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';

import StandardDialog from '@/components/common/StandardDialog';
import FetchErrorState from '@/components/common/FetchErrorState';
import { useDocument, usePermissions } from '@/hooks';
import {
  getDocumentSubmissionKind,
  prepareDocumentPreview
} from '@/utils/documentModeration';
import DocumentDetails from '../DocumentDetails';
import DocumentDiff from './DocumentDiff';
import Actions from './Actions';

const SUBMISSION_TITLES = {
  creation: 'documentModeration.reviewCreation',
  modification: 'documentModeration.reviewModification',
  unknown: 'documentModeration.reviewDocument'
};

const DocumentPreview = ({ id, onClose, onEdit, onProcessed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const isNarrowViewport = useMediaQuery(theme => theme.breakpoints.down('sm'));
  const hasHeaderActions = useMediaQuery(theme => theme.breakpoints.up('md'));
  const editDescriptionId = useId();
  const currentQuery = useDocument(id);
  const proposedQuery = useDocument(id, { requireUpdate: true });
  const { data: current } = currentQuery;
  const { data: proposed } = proposedQuery;
  const error = currentQuery.error || proposedQuery.error;
  const isPaused = currentQuery.isPaused || proposedQuery.isPaused;
  const isLoading = currentQuery.isPending || proposedQuery.isPending;
  const kind = getDocumentSubmissionKind(current);
  const isReady = !!current && !!proposed && !error && !isPaused && !isLoading;
  const hasPendingFiles = !!proposed?.newFiles?.length;
  const onRetry = () => {
    currentQuery.refetch();
    proposedQuery.refetch();
  };

  return (
    <StandardDialog
      maxWidth="lg"
      fullScreen={isNarrowViewport}
      dense={isNarrowViewport}
      fullWidth
      scrollable
      open
      onClose={onClose}
      titleComponent="h1"
      title={
        <Typography
          component="span"
          variant="h1"
          data-testid="document-moderation-title">
          {formatMessage({ id: SUBMISSION_TITLES[kind] })}
        </Typography>
      }
      actionsPosition={hasHeaderActions ? 'top' : 'bottom'}
      actions={
        permissions.isModerator ? (
          <Box data-testid="document-moderation-actions" sx={{ width: '100%' }}>
            <Actions
              selectedIds={[id]}
              onEdit={onEdit}
              onProcessed={onProcessed}
              disabled={
                !isReady || currentQuery.isFetching || proposedQuery.isFetching
              }
              isEditDisabled={hasPendingFiles}
              editDescriptionId={
                isReady && hasPendingFiles ? editDescriptionId : undefined
              }
              keepLabels
            />
            {isReady && hasPendingFiles && (
              <Typography
                component="p"
                variant="caption"
                color="text.secondary"
                id={editDescriptionId}
                data-testid="pending-files-edit-notice"
                sx={{
                  mt: 0.5,
                  mb: 0,
                  textAlign: hasHeaderActions ? 'right' : 'left'
                }}>
                {formatMessage({ id: 'documentModeration.editUnavailable' })}
              </Typography>
            )}
          </Box>
        ) : null
      }>
      <Box
        data-testid="document-moderation-preview"
        sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
        {error || isPaused ? (
          <FetchErrorState
            error={error}
            isPaused={isPaused}
            messageId="Error, the document data you are looking for is not available."
            onRetry={onRetry}
          />
        ) : null}
        {isLoading && !isPaused && !error && <CircularProgress />}
        {isReady && (
          <>
            {kind === 'modification' && (
              <DocumentDiff current={current} proposed={proposed} />
            )}
            <Card
              component="section"
              aria-label={formatMessage({ id: 'documentModeration.preview' })}
              data-testid="document-moderation-result"
              sx={{ my: 1, p: { xs: 1.5, sm: 2 }, minWidth: 0 }}>
              <Typography variant="h2" sx={{ mb: 1 }}>
                {formatMessage({ id: 'documentModeration.preview' })}
              </Typography>
              <DocumentDetails
                isPreview
                id={id}
                documentData={prepareDocumentPreview(current, proposed)}
              />
            </Card>
          </>
        )}
      </Box>
    </StandardDialog>
  );
};

DocumentPreview.propTypes = {
  id: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onProcessed: PropTypes.func.isRequired
};

export default DocumentPreview;
