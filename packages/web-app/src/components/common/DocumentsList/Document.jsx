import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  ListItem,
  Typography,
  ButtonGroup,
  Tooltip,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import React, { useState } from 'react';
import Linkify from 'linkify-react';
import { styled } from '@mui/material/styles';
import GCLink from '../GCLink';
import Files from './Files';
import { SnapshotButton } from '../../appli/Entry/Snapshots/UtilityFunction';
import Translate from '../Translate';
import StandardDialog from '../StandardDialog';
import linkifyOptions from '../../../helpers/linkifyOptions';

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

const Document = ({
  document,
  hasSnapshotButton = false,
  onUnlink,
  onImageClick,
  imageIndexOffset = 0
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down('sm'));
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
          <DocumentDescription>
            <Linkify options={linkifyOptions}> {document.description}</Linkify>
          </DocumentDescription>
        ) : (
          false
        )}
        {document.files ? (
          <Files
            files={document.files}
            description={document.description}
            onImageClick={onImageClick}
            imageIndexOffset={imageIndexOffset}
          />
        ) : (
          false
        )}
      </StyledListItemContainer>

      {(hasSnapshotButton || onUnlink) && (
        <Box style={{ flexShrink: 0, alignSelf: 'flex-start' }}>
          <ButtonGroup
            color="primary"
            size="small"
            orientation={isSmall ? 'vertical' : 'horizontal'}>
            {hasSnapshotButton && (
              <SnapshotButton
                color="primary"
                variant="outlined"
                id={document.id}
                type="documents"
                content={document}
              />
            )}
            {onUnlink && (
              <Tooltip title={formatMessage({ id: 'Unlink this document' })}>
                <Button
                  onClick={() => setUnlinkDialogOpen(true)}
                  color="primary"
                  aria-label={formatMessage({ id: 'unlink' })}>
                  <LinkOffIcon />
                </Button>
              </Tooltip>
            )}
          </ButtonGroup>
        </Box>
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
  onImageClick: PropTypes.func,
  imageIndexOffset: PropTypes.number,
  document: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    type: PropTypes.string,
    description: PropTypes.string,
    files: Files.propTypes.files
  })
};

export default Document;
