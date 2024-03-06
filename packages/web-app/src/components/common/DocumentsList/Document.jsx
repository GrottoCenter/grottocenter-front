import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Chip,
  ListItem,
  ListItemIcon,
  Typography,
  ButtonGroup,
  Tooltip,
  Button
} from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import GCLink from '../GCLink';
import Files from './Files';
import { SnapshotButton } from '../../appli/Entry/Snapshots/UtilityFunction';
import Translate from '../Translate';
import StandardDialog from '../StandardDialog';

const StyledListItemContainer = styled('div')`
  width: 100%;
  margin: 0;
`;

const StyledChip = styled(Chip)`
  margin-left: ${({ theme }) => theme.spacing(2)};
  padding: 0 ${({ theme }) => theme.spacing(1)};
`;
const StyledListItem = styled(ListItem)`
  padding: 4px 0;
  margin: 0;
`;

const DocumentDescription = styled(Typography)`
  margin: 0.5em 0;
  white-space: break-spaces;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const Document = ({ document, hasSnapshotButton = false, onUnlink }) => {
  const { formatMessage } = useIntl();
  const [isUnlinkDialogOpen, setUnlinkDialogOpen] = useState(false);

  return (
    <StyledListItem>
      <StyledListItemContainer>
        <GCLink internal={false} href={`/ui/documents/${document.id}`}>
          {document.title}
        </GCLink>
        <StyledChip
          variant="outlined"
          size="small"
          color="primary"
          label={
            (document.type && formatMessage({ id: document.type })) ||
            formatMessage({ id: 'unknown' })
          }
        />
        {document.description ? (
          <DocumentDescription>{document.description}</DocumentDescription>
        ) : (
          false
        )}
        {document.files ? <Files files={document.files} /> : false}
      </StyledListItemContainer>

      {hasSnapshotButton || onUnlink ? (
        <ListItemIcon style={{ alignSelf: 'start' }}>
          <ButtonGroup color="primary">
            {hasSnapshotButton ? (
              <SnapshotButton
                color="primary"
                variant="outlined"
                id={document.id}
                type="documents"
                content={document}
              />
            ) : (
              false
            )}
            {onUnlink ? (
              <Tooltip
                title={formatMessage({
                  id: 'Unlink this document'
                })}>
                <Button
                  onClick={() => setUnlinkDialogOpen(true)}
                  color="primary"
                  aria-label="unlink">
                  <LinkOffIcon />
                </Button>
              </Tooltip>
            ) : (
              false
            )}
          </ButtonGroup>
        </ListItemIcon>
      ) : (
        false
      )}
      {onUnlink ? (
        <StandardDialog
          open={isUnlinkDialogOpen}
          onClose={() => setUnlinkDialogOpen(false)}
          title={formatMessage({ id: 'Unlink this document?' })}
          actions={[
            <Button
              key="no"
              onClick={() => setUnlinkDialogOpen(false)}
              disableElevation>
              <Translate>No</Translate>
            </Button>,
            <Button
              key="yes"
              disableElevation
              onClick={() => {
                setUnlinkDialogOpen(false);
                onUnlink(document);
              }}
              color="primary"
              autoFocus>
              <Translate>Yes</Translate>
            </Button>
          ]}>
          <Translate>
            Are you sure you want to unlink this document of this entity?
          </Translate>
        </StandardDialog>
      ) : (
        false
      )}
    </StyledListItem>
  );
};

Document.propTypes = {
  hasSnapshotButton: PropTypes.bool,
  onUnlink: PropTypes.func,
  document: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    files: Files.propTypes.files
  })
};

export default Document;
