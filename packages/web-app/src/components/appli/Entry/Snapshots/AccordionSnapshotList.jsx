import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Skeleton } from '@mui/material';
import { Timeline } from '@mui/lab';

import Alert from '../../../common/Alert';
import authorType from '../../../../types/author.type';
import AccordionSnapshot from './AccordionSnapshot';

const TIMELINE_SX = {
  p: 0,
  m: 0,
  '& .MuiTimelineItem-root:last-child .MuiTimelineConnector-root': {
    display: 'none'
  }
};

const AccordionSnapshotList = ({
  data,
  type,
  isNetwork,
  currentItem,
  isCurrentItemLoading
}) => {
  const { formatMessage } = useIntl();

  const hasCurrentItem = currentItem && Object.keys(currentItem).length > 0;

  // Filter out the current version from snapshot list if the API included it
  const currentTimestamp = hasCurrentItem
    ? (currentItem.dateReviewed ?? currentItem.dateInscription)
    : null;
  const filteredData = data
    ? Object.fromEntries(
        Object.entries(data).map(([snapshotType, snapshots]) => [
          snapshotType,
          snapshots.filter(s => s.id !== currentTimestamp)
        ])
      )
    : null;

  const hasRevisions =
    filteredData &&
    Object.values(filteredData).some(snapshots => snapshots.length > 0);

  const mostRecentSnapshot = (() => {
    if (!hasRevisions) return null;
    const firstType = Object.keys(filteredData)[0];
    const items = filteredData[firstType];
    return items?.length > 0 ? items[items.length - 1] : null;
  })();

  const snapshotElements = hasRevisions
    ? Object.keys(filteredData).map(snapshotType => {
        const snapshotItems = filteredData[snapshotType];
        const { items } = snapshotItems.reduce(
          ({ items: acc, prev }, snapshot) => ({
            items: [
              ...acc,
              <AccordionSnapshot
                key={snapshot.id + snapshot.t_id}
                snapshot={snapshot}
                snapshotType={snapshotType}
                isNetwork={isNetwork}
                author={snapshot.author}
                reviewer={snapshot.reviewer}
                previous={prev}
              />
            ],
            prev: snapshot
          }),
          { items: [], prev: null }
        );
        return [...items].reverse();
      })
    : null;

  const hasItems = hasCurrentItem || hasRevisions;

  return (
    <Box sx={{ px: 2 }}>
      {isCurrentItemLoading && (
        <Skeleton height={80} variant="rectangular" sx={{ borderRadius: 1, mb: 1 }} />
      )}
      {hasItems ? (
        <>
          <Timeline sx={TIMELINE_SX}>
            {hasCurrentItem && (
              <AccordionSnapshot
                snapshot={currentItem}
                snapshotType={type}
                isNetwork={isNetwork}
                author={currentItem.author}
                reviewer={currentItem.reviewer}
                previous={mostRecentSnapshot}
                isCurrent
              />
            )}
            {hasRevisions && snapshotElements}
          </Timeline>
        </>
      ) : (
        !isCurrentItemLoading && (
          <Alert
            severity="info"
            content={formatMessage(
              { id: 'This is the only version of this {type}.' },
              { type }
            )}
          />
        )
      )}
    </Box>
  );
};

AccordionSnapshotList.propTypes = {
  data: PropTypes.shape({}),
  type: PropTypes.string,
  isNetwork: PropTypes.bool,
  currentItem: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    name: PropTypes.string,
    author: authorType,
    reviewer: authorType,
    dateInscription: PropTypes.string,
    dateReviewed: PropTypes.string
  }),
  isCurrentItemLoading: PropTypes.bool
};

export default AccordionSnapshotList;
