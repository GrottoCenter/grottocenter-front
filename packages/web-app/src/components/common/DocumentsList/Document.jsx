import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Box,
  ListItem,
  Paper,
  ButtonGroup,
  Tooltip,
  Button,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import DocumentTypeChip from '../DocumentTypeChip';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import React, { useState, useLayoutEffect, useRef } from 'react';
import Linkify from 'linkify-react';
import { isMobile } from 'react-device-detect';
import GCLink from '../GCLink';
import Files from './Files';
import { SnapshotButton } from '../../appli/Entry/Snapshots/UtilityFunction';
import Translate from '../Translate';
import StandardDialog from '../StandardDialog';
import linkifyOptions from '../../../helpers/linkifyOptions';

const Document = ({
  document,
  hasSnapshotButton = false,
  onUnlink,
  onImageClick,
  imageIndexOffset = 0
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobileView = useMediaQuery(theme.breakpoints.down('sm'));
  const [isUnlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const descriptionRef = useRef(null);

  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (!el) return;
    setIsClamped(el.scrollHeight > el.clientHeight);
  }, [document.description, isMobileView]);

  return (
    <ListItem disableGutters sx={{ display: 'block', py: 0.5 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
        {/* Header row: title + chip + actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1
          }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1,
              flex: 1,
              minWidth: 0
            }}>
            <Typography variant="h4" component="span">
              <GCLink internal={isMobile} href={`/ui/documents/${document.id}`}>
                {document.title}
              </GCLink>
            </Typography>
            <DocumentTypeChip type={document.type} />
          </Box>
          {(hasSnapshotButton || onUnlink) && (
            <Box sx={{ flexShrink: 0 }}>
              <ButtonGroup
                color="primary"
                size="small"
                orientation={isMobileView ? 'vertical' : 'horizontal'}>
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
        </Box>

        {/* Description with truncation */}
        {document.description && (
          <Box mt={1}>
            <Typography
              ref={descriptionRef}
              variant="body2"
              sx={{
                whiteSpace: 'break-spaces',
                color: 'text.primary',
                ...(isMobileView && !descriptionExpanded && {
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical'
                })
              }}>
              <Linkify options={linkifyOptions}>{document.description}</Linkify>
            </Typography>
            {isMobileView && isClamped && (
              <Button
                size="small"
                variant="text"
                endIcon={
                  descriptionExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
                sx={{ p: 0, minWidth: 0, mt: 0.5, textTransform: 'none' }}
                onClick={() => setDescriptionExpanded(e => !e)}>
                {formatMessage({
                  id: descriptionExpanded ? 'Show less' : 'Read more'
                })}
              </Button>
            )}
          </Box>
        )}

        {/* Files */}
        {document.files && (
          <Box mt={1}>
            <Files
              files={document.files}
              description={document.description}
              onImageClick={onImageClick}
              imageIndexOffset={imageIndexOffset}
            />
          </Box>
        )}
      </Paper>

      {onUnlink && (
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
      )}
    </ListItem>
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
