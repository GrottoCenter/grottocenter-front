import { useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, Divider, Tooltip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import CancelIcon from '@mui/icons-material/Cancel';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { linkDocumentToEntrance } from '../../../../actions/LinkDocumentToEntrance';
import { unlinkDocumentToEntrance } from '../../../../actions/UnlinkDocumentToEntrance';
import { EntityIcon } from '../../../../pages/EntityCreation/entityConfig';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import SearchDocumentForm from '../../SearchDocumentForm';
import Alert from '../../../common/Alert';
import { usePermissions, useAuthNavigate } from '../../../../hooks';
import DocumentsList from '../../../common/DocumentsList/DocumentsList';

const DividerStyled = styled(Divider)`
  background-color: ${props => props.theme.palette.divider};
`;
const Documents = ({ documents, entranceId, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const navigateToNewDocument = useAuthNavigate(
    `/ui/entity/add/document?entranceId=${entranceId}`
  );
  const [isDocumentSearchVisible, setIsDocumentSearchVisible] = useState(false);
  const dispatch = useDispatch();

  const onSubmitForm = newDocuments => {
    newDocuments.forEach(d => {
      dispatch(
        linkDocumentToEntrance({
          entranceId,
          document: d
        })
      );
    });
    setIsDocumentSearchVisible(false);
  };

  return (
    <ScrollableContent
      dense
      collapsible={false}
      anchorId="documents"
      title={formatMessage({ id: 'Documents' })}
      icon={
        permissions.isAuth &&
        isEditAllowed && (
          <Box display="flex" gap={0.5}>
            <Tooltip title={formatMessage({ id: 'Create a new document' })}>
              <Button
                color="secondary"
                size="small"
                variant="outlined"
                onClick={navigateToNewDocument}
                startIcon={<EntityIcon iconType="bibliography" size={20} />}>
                {formatMessage({ id: 'New' })}
              </Button>
            </Tooltip>
            <Tooltip
              title={
                isDocumentSearchVisible
                  ? formatMessage({ id: 'Cancel this search' })
                  : formatMessage({ id: 'Assign an existing document' })
              }>
              <Button
                color={isDocumentSearchVisible ? 'inherit' : 'secondary'}
                size="small"
                variant="outlined"
                onClick={() =>
                  setIsDocumentSearchVisible(!isDocumentSearchVisible)
                }
                startIcon={
                  isDocumentSearchVisible ? (
                    <CancelIcon />
                  ) : (
                    <EntityIcon
                      iconType="bibliography"
                      size={20}
                      BadgeIcon={LinkIcon}
                    />
                  )
                }>
                {formatMessage({
                  id: isDocumentSearchVisible ? 'Cancel' : 'Associate'
                })}
              </Button>
            </Tooltip>
          </Box>
        )
      }
      content={
        <>
          {isDocumentSearchVisible && (
            <>
              <SearchDocumentForm onSubmit={onSubmitForm} />
              <DividerStyled />
            </>
          )}

          <DocumentsList
            documents={documents}
            emptyMessageComponent={
              <Alert
                severity="info"
                content={formatMessage({
                  id: 'There is currently no document for this entrance.'
                })}
              />
            }
            onUnlink={
              permissions.isModerator && isEditAllowed
                ? async document => {
                    dispatch(
                      unlinkDocumentToEntrance({
                        entranceId,
                        documentId: document.id
                      })
                    );
                  }
                : null
            }
          />
        </>
      }
    />
  );
};

Documents.propTypes = {
  documents: DocumentsList.propTypes.documents,
  entranceId: PropTypes.number.isRequired,
  isEditAllowed: PropTypes.bool
};

export default Documents;
