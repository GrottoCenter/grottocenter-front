import React, { useState } from 'react';
import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Typography
} from '@mui/material';
import {
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent
} from '@mui/lab';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  isCurrent,
  actualItem
}) => {
  const { formatMessage } = useIntl();
  const [open, setOpen] = useState(isCurrent ?? false);

  const snapshotTitle = snapshot.title ?? snapshot.name ?? snapshot.description?.title ?? '';
  const previousVersionTitle = previous?.title ?? previous?.name ?? previous?.description?.title ?? undefined;
  const rawDate = isCurrent
    ? (snapshot.dateReviewed ?? snapshot.dateInscription)
    : snapshot.id;
  const displayDate = rawDate ? new Date(rawDate) : null;

  return (
    <TimelineItem sx={{ '&::before': { flex: 0, padding: 0 } }}>
      <TimelineSeparator>
        <TimelineDot
          color={isCurrent ? 'primary' : 'grey'}
          variant={isCurrent ? 'filled' : 'outlined'}
          sx={{ mt: '10px' }}
        />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent sx={{ pb: 2, pt: 0 }}>
        <Box
          sx={{
            borderRadius: 1,
            bgcolor: 'grey.100',
            border: '1px solid',
            borderColor: open ? 'grey.300' : 'grey.200',
            overflow: 'hidden'
          }}>
          <Box
            onClick={() => setOpen(prev => !prev)}
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              px: 1,
              py: 1,
              '&:hover': { bgcolor: 'action.hover' }
            }}>
            <Box sx={{ flex: '0 0 auto' }}>
              {all && (
                <Typography variant="caption" color="text.secondary" display="block">
                  <Translate>{snapshotType === 'entrances' ? 'Information' : capitalize(snapshotType)}</Translate>
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary" display="block">
                {displayDate
                  ? `${displayDate.toLocaleDateString()} - ${displayDate.toLocaleTimeString()}`
                  : ''}
              </Typography>
              {reviewer ? (
                <AuthorAndDate author={reviewer} verb="Updated" textColor="inherit" />
              ) : author ? (
                <AuthorAndDate author={author} verb="Created" textColor="inherit" />
              ) : null}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" component="span" fontWeight={isCurrent ? 'bold' : 'regular'}>
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
            </Box>
            <IconButton size="small" color="action" sx={{ flexShrink: 0, mt: '-2px' }}>
              {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </IconButton>
          </Box>
          <Collapse in={open}>
            <Box sx={{ px: 2, pt: 1, pb: 1, borderTop: '1px solid', borderColor: 'grey.200' }}>
              {getAccordionBodyFromType(
                snapshotType,
                snapshot,
                isNetwork ?? false,
                previous
              )}
            </Box>
            {!isCurrent && snapshotType !== 'documents' && (
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
