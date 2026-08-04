import { useState } from 'react';
import { Box, Chip, Collapse, IconButton, Typography } from '@mui/material';
import {
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent
} from '@mui/lab';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { getAccordionBodyFromType } from './UtilityFunction';
import authorType from '../../../../types/author.type';
import { HighLightsChar } from '../../../common/Highlights';
import RestoreSnapshot from './component/RestoreSnapshot';
import AuthorAndDate from '../../../common/Contribution/AuthorAndDate';
import Translate from '../../../common/Translate';
import { capitalize } from '../../../../utils/strings';

const AccordionSnapshot = ({
  snapshot,
  snapshotType,
  isNetwork,
  author,
  reviewer,
  previous,
  actualItem,
  newName,
  all,
  isCurrent
}) => {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(isCurrent ?? false);

  const isNameChange = !!snapshot.isNameChangeSnapshot;
  const isEntranceSnapshot = snapshotType === 'entrances';

  // For entrance snapshots, use the entrance name directly (falling back to
  // title/description title); cave/network renames are surfaced by dedicated
  // rename snapshots, so this stays a plain contextual label, not a diff.
  const snapshotTitle = isEntranceSnapshot
    ? (snapshot.name ?? snapshot.title ?? snapshot.description?.title ?? '')
    : (snapshot.title ?? snapshot.name ?? snapshot.description?.title ?? '');
  const previousVersionTitle = isEntranceSnapshot
    ? (previous?.name ??
      previous?.title ??
      previous?.description?.title ??
      undefined)
    : (previous?.title ??
      previous?.name ??
      previous?.description?.title ??
      undefined);
  const rawDate = isCurrent
    ? (snapshot.dateReviewed ?? snapshot.dateInscription)
    : snapshot.id;
  const displayDate = rawDate ? new Date(rawDate) : null;

  // Who to credit, and for what. A rename is always an update, even when only
  // the original author is known; otherwise a reviewer means an update and a
  // bare author means the creation.
  let attribution = null;
  if (isNameChange && (reviewer ?? author)) {
    attribution = { author: reviewer ?? author, verb: 'Updated' };
  } else if (reviewer) {
    attribution = { author: reviewer, verb: 'Updated' };
  } else if (author) {
    attribution = { author, verb: 'Created' };
  }

  // The current version and entrance snapshots show a plain label: for
  // entrances, name/caveName are contextual labels resolved across tables
  // rather than diffable fields, and renames get their own snapshot.
  let titleContent = snapshotTitle;
  if (!isCurrent && isNameChange) {
    // The name IS the change: snapshotTitle holds the OLD name (raw h_name
    // value) and newName is resolved from the next real snapshot.
    titleContent = <HighLightsChar oldText={snapshotTitle} newText={newName} />;
  } else if (!isCurrent && !isEntranceSnapshot) {
    titleContent = (
      <HighLightsChar oldText={previousVersionTitle} newText={snapshotTitle} />
    );
  }

  let dotColor = 'grey';
  if (isNameChange) dotColor = 'secondary';
  else if (isCurrent) dotColor = 'primary';

  return (
    <TimelineItem sx={{ '&::before': { flex: 0, padding: 0.25 } }}>
      <TimelineSeparator>
        <TimelineDot
          color={dotColor}
          variant={isCurrent ? 'filled' : 'outlined'}
          sx={{ mt: '10px' }}
        />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ pb: 1, pt: 0.25, pr: 0.25 }}>
        <Box
          sx={{
            borderRadius: 1,
            bgcolor: 'grey.100',
            border: '1px solid',
            borderColor: open ? 'grey.300' : 'grey.200',
            overflow: 'hidden'
          }}>
          <Box
            onClick={isNameChange ? undefined : () => setOpen(prev => !prev)}
            sx={{
              cursor: isNameChange ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 0.5,
              px: 0.5,
              py: 0.5,
              ...(isNameChange
                ? {}
                : { '&:hover': { bgcolor: 'action.hover' } })
            }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'flex-start' },
                gap: 0.5
              }}>
              <Box sx={{ flex: '0 0 auto' }}>
                {all && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block">
                    <Translate>
                      {snapshotType === 'entrances'
                        ? 'Information'
                        : capitalize(snapshotType)}
                    </Translate>
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block">
                  {displayDate
                    ? `${displayDate.toLocaleDateString()} - ${displayDate.toLocaleTimeString()}`
                    : ''}
                </Typography>
                {attribution && (
                  <AuthorAndDate
                    author={attribution.author}
                    verb={attribution.verb}
                    textColor="inherit"
                  />
                )}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexWrap: 'wrap'
                }}>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight={isCurrent ? 'bold' : 'regular'}>
                  {titleContent}
                </Typography>
                {isCurrent && (
                  <Chip
                    label={formatMessage({ id: 'Current version' })}
                    color="primary"
                    size="small"
                    sx={{ flexShrink: 0 }}
                  />
                )}
                {!previous && (
                  <Chip
                    label={formatMessage({ id: 'Initial version' })}
                    color="primary"
                    variant="outlined"
                    size="small"
                    sx={{ flexShrink: 0 }}
                  />
                )}
                {isNameChange && (
                  <Chip
                    icon={<DriveFileRenameOutlineIcon />}
                    label={formatMessage({ id: 'Renamed' })}
                    color="secondary"
                    variant="outlined"
                    size="small"
                    sx={{ flexShrink: 0 }}
                  />
                )}
              </Box>
            </Box>
            {!isNameChange && (
              <IconButton
                size="small"
                color="action"
                sx={{ flexShrink: 0, mt: '-2px' }}>
                {open ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            )}
          </Box>
          <Collapse in={open && !isNameChange}>
            <Box
              sx={{
                px: 1,
                pt: 0.5,
                pb: 0.5,
                borderTop: '1px solid',
                borderColor: 'grey.200'
              }}>
              {getAccordionBodyFromType(
                snapshotType,
                snapshot,
                isNetwork ?? false,
                previous
              )}
            </Box>
            {!isCurrent && snapshotType !== 'documents' && !isNameChange && (
              <Box sx={{ px: 1, pb: 1 }}>
                <RestoreSnapshot
                  snapshot={snapshot}
                  snapshotType={snapshotType}
                  isNetwork={isNetwork}
                  actualItem={actualItem}
                />
              </Box>
            )}
          </Collapse>
        </Box>
      </TimelineContent>
    </TimelineItem>
  );
};

AccordionSnapshot.propTypes = {
  snapshot: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    caveName: PropTypes.string,
    isNameChangeSnapshot: PropTypes.bool,
    description: PropTypes.shape({ title: PropTypes.string }),
    dateInscription: PropTypes.string,
    dateReviewed: PropTypes.string
  }),
  snapshotType: PropTypes.string,
  isNetwork: PropTypes.bool,
  author: authorType,
  reviewer: authorType,
  newName: PropTypes.string,
  previous: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    caveName: PropTypes.string,
    description: PropTypes.shape({ title: PropTypes.string }),
    date: PropTypes.string,
    dateReviewed: PropTypes.string
  }),
  actualItem: PropTypes.shape({
    isDeleted: PropTypes.bool
  }),
  all: PropTypes.bool,
  isCurrent: PropTypes.bool
};

export default AccordionSnapshot;
