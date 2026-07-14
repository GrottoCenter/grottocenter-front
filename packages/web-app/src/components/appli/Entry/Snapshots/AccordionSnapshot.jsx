import React, { useState } from 'react';
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
  all,
  isCurrent
}) => {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(isCurrent ?? false);

  const isNameChange = !!snapshot.isNameChangeSnapshot;
  const isEntranceType = snapshotType === 'entrances';

  // For entrance snapshots, prioritize the cave/network name over the entrance
  // name: it's the value most relevant to disambiguate renamed entrances and
  // networks, and it still matches the entrance name for single-entrance caves.
  const snapshotTitle = isEntranceType
    ? (snapshot.name ?? snapshot.title ?? snapshot.description?.title ?? '')
    : (snapshot.title ?? snapshot.name ?? snapshot.description?.title ?? '');
  const previousVersionTitle = isEntranceType
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

  return (
    <TimelineItem sx={{ '&::before': { flex: 0, padding: 0 } }}>
      <TimelineSeparator>
        <TimelineDot
          color={isNameChange ? 'secondary' : isCurrent ? 'primary' : 'grey'}
          variant={isCurrent ? 'filled' : 'outlined'}
          sx={{ mt: '10px' }}
        />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ pb: 2, pt: 0, pr: 0 }}>
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
              gap: 1,
              px: 1,
              py: 1,
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
                gap: 1
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
                {isNameChange ? (
                  <AuthorAndDate
                    author={reviewer}
                    verb="Updated"
                    textColor="inherit"
                  />
                ) : reviewer ? (
                  <AuthorAndDate
                    author={reviewer}
                    verb="Updated"
                    textColor="inherit"
                  />
                ) : author ? (
                  <AuthorAndDate
                    author={author}
                    verb="Created"
                    textColor="inherit"
                  />
                ) : null}
              </Box>
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexWrap: 'wrap'
                }}>
                <Typography
                  variant="body2"
                  component="span"
                  fontWeight={isCurrent ? 'bold' : 'regular'}>
                  {isCurrent ? (
                    snapshotTitle
                  ) : (
                    <HighLightsChar
                      oldText={previousVersionTitle}
                      newText={snapshotTitle}
                    />
                  )}
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
                px: 2,
                pt: 1,
                pb: 1,
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
              <Box sx={{ px: 2, pb: 2 }}>
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
  previous: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    name: PropTypes.string,
    caveName: PropTypes.string,
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
