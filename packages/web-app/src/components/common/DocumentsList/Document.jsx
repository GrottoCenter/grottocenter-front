import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  ListItem,
  Paper,
  ButtonGroup,
  Tooltip,
  Button,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useState, useLayoutEffect, useRef } from 'react';
import Linkify from 'linkify-react';
import DocumentTypeChip from '../DocumentTypeChip';
import AppLink from '../AppLink';
import Files from './Files';
import { isImageFile } from './utils/imageUtils';
import { SnapshotButton } from '../../appli/Entry/Snapshots/UtilityFunction';
import Translate from '../Translate';
import StandardDialog from '../StandardDialog';
import OfflineDisabled from '../OfflineDisabled';
import { useOnlineStatus } from '../../../hooks';
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
  const isOnline = useOnlineStatus();
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
    <ListItem
      disableGutters
      sx={{
        display: 'block'
      }}>
      <Paper
        variant="outlined"
        sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
        {/* Header row: title + chip + actions */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 0.5
          }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 0.5,
              flex: 1,
              minWidth: 0
            }}>
            <Typography variant="h4" component="span">
              <AppLink to={`/ui/documents/${document.id}`}>
                {document.title}
              </AppLink>
            </Typography>
            <DocumentTypeChip type={document.type} />
            {document.isValidated === false && (
              <Chip
                variant="outlined"
                color="warning"
                size="small"
                icon={<HourglassEmptyIcon />}
                label={formatMessage({ id: 'Waiting for validation' })}
              />
            )}
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
                  // Unlinking is an API write, so it goes down with the
                  // connection. Guarded here rather than at each call site:
                  // this is the single component every documents list renders.
                  <OfflineDisabled>
                    <Tooltip
                      title={
                        isOnline
                          ? formatMessage({ id: 'Unlink this document' })
                          : ''
                      }>
                      <Button
                        onClick={() => setUnlinkDialogOpen(true)}
                        color="error"
                        disabled={!isOnline}
                        aria-label={formatMessage({ id: 'unlink' })}>
                        <LinkOffIcon />
                      </Button>
                    </Tooltip>
                  </OfflineDisabled>
                )}
              </ButtonGroup>
            </Box>
          )}
        </Box>

        {/* Description with truncation.
            Hidden when the document has any image file: the description is
            already shown in the lightbox next to the image, so repeating it
            here just eats vertical space. */}
        {document.description &&
          !document.files?.some(f => isImageFile(f.fileName)) && (
            <Box mt={0.5}>
              <Typography
                ref={descriptionRef}
                variant="body2"
                sx={{
                  whiteSpace: 'break-spaces',
                  color: 'text.primary',
                  ...(isMobileView &&
                    !descriptionExpanded && {
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical'
                    })
                }}>
                <Linkify options={linkifyOptions}>
                  {document.description}
                </Linkify>
              </Typography>
              {isMobileView && isClamped && (
                <Button
                  size="small"
                  variant="text"
                  endIcon={
                    descriptionExpanded ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )
                  }
                  sx={{
                    p: 0.25,
                    minWidth: 0,
                    textTransform: 'none'
                  }}
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
          <Box mt={0.5}>
            <Files
              files={document.files}
              description={document.description}
              documentTitle={document.title}
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
              variant="outlined"
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
              variant="contained"
              color="error"
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
    isValidated: PropTypes.bool,
    description: PropTypes.string,
    files: Files.propTypes.files
  })
};

export default Document;
