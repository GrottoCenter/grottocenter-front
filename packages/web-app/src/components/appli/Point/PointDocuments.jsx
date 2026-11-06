import { useState } from 'react';
import PropTypes from 'prop-types';
import { Alert, Divider } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import { useIntl } from 'react-intl';

import SearchDocumentForm from '@/components/appli/SearchDocumentForm';
import DocumentsList from '@/components/common/DocumentsList/DocumentsList';
import ScrollableContent from '@/components/common/Layouts/Fixed/ScrollableContent';
import SectionCreateButton from '@/components/common/SectionCreateButton';
import {
  useLinkDocumentsToPoint,
  useUnlinkDocumentFromPoint,
  usePermissions
} from '@/hooks';
import { EntityIcon } from '@/pages/EntityCreation/entityConfig';
import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';

const PointDocuments = ({ pointId, documents, isDeleted }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const linkMutation = useLinkDocumentsToPoint();
  const unlinkMutation = useUnlinkDocumentFromPoint();
  const [isSearchOpen, setSearchOpen] = useState(false);
  const canAssociate = permissions.isAuth && !isDeleted;

  return (
    <ScrollableContent
      title={formatMessage({ id: 'Documents' })}
      anchorId="documents"
      collapsible={false}
      icon={
        canAssociate ? (
          <SectionCreateButton
            isOpen={isSearchOpen}
            testId="associate-documents-button"
            onToggle={() => setSearchOpen(!isSearchOpen)}
            label={formatMessage({ id: 'Associate' })}
            tooltip={formatMessage({ id: 'Assign an existing document' })}
            openTooltip={formatMessage({ id: 'Cancel this search' })}
            icon={
              <EntityIcon
                iconType="bibliography"
                size={24}
                BadgeIcon={LinkIcon}
              />
            }
          />
        ) : undefined
      }
      content={
        <>
          {canAssociate && isSearchOpen && (
            <>
              <SearchDocumentForm
                closeForm={() => setSearchOpen(false)}
                onSubmit={selected =>
                  linkMutation.mutateAsync({ pointId, documents: selected })
                }
                onSuccess={() => setSearchOpen(false)}
              />
              <Divider sx={{ my: 1 }} />
            </>
          )}
          <DocumentsList
            documents={documents}
            defaultSortOrder={DOCUMENT_SORT_ORDERS.TYPE}
            showBibliographicReferences
            emptyMessageComponent={
              <Alert severity="info">
                {formatMessage({ id: 'points.noDocuments' })}
              </Alert>
            }
            onUnlink={
              permissions.isModerator && !isDeleted && !unlinkMutation.isPending
                ? document =>
                    unlinkMutation.mutate({ pointId, documentId: document.id })
                : null
            }
          />
        </>
      }
    />
  );
};

PointDocuments.propTypes = {
  pointId: PropTypes.number.isRequired,
  documents: DocumentsList.propTypes.documents,
  isDeleted: PropTypes.bool.isRequired
};

export default PointDocuments;
