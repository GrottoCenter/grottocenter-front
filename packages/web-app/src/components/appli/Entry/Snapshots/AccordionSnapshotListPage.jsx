import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Skeleton } from '@mui/material';
import { Timeline } from '@mui/lab';

import Alert from '../../../common/Alert';
import authorType from '../../../../types/author.type';
import AccordionSnapshot from './AccordionSnapshot';

const SUB_TYPES = ['descriptions', 'locations', 'histories', 'riggings', 'comments'];

const AccordionSnapshotListPage = ({
  data,
  type,
  isNetwork,
  currentTItem,
  isCurrentItemLoading
}) => {
  const { formatMessage } = useIntl();

  const hasData = data && Array.isArray(data) && data.length > 0;

  // sortSnapshots flattens data: each element is { [type]: [singleSnapshot] }.
  // Group all snapshots per (snapshotType, t_id) to compute `previous` and
  // find the most recent snapshot per entity (used as `previous` for current items).
  const { previousMap, latestByGroup } = (() => {
    if (!hasData) return { previousMap: {}, latestByGroup: {} };
    const groups = {};
    data.forEach(snapshotGroup => {
      const snapshotType = Object.keys(snapshotGroup)[0];
      const snapshot = snapshotGroup[snapshotType][0];
      const key = `${snapshotType}_${snapshot.t_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(snapshot);
    });
    const prevMap = {};
    const latest = {};
    Object.entries(groups).forEach(([key, group]) => {
      group.sort((a, b) => new Date(a.id) - new Date(b.id));
      group.forEach((snapshot, index) => {
        prevMap[`${snapshot.id}_${snapshot.t_id}`] =
          index > 0 ? group[index - 1] : null;
      });
      latest[key] = group[group.length - 1];
    });
    return { previousMap: prevMap, latestByGroup: latest };
  })();

  // Build a unified sorted timeline: current items + snapshots interleaved by date.
  // Each entry: { date: Date, element: ReactElement }
  const timelineItems = (() => {
    const items = [];

    // Current items
    if (hasData && currentTItem && !isCurrentItemLoading) {
      const candidatesByType = { [type]: [currentTItem] };
      SUB_TYPES.forEach(subType => {
        if (currentTItem[subType]?.length > 0) {
          candidatesByType[subType] = currentTItem[subType];
        }
      });

      Object.keys(candidatesByType).forEach(snapshotType => {
        candidatesByType[snapshotType].forEach(item => {
          const groupKey = `${snapshotType}_${item.id}`;
          if (!latestByGroup[groupKey]) return;
          const mostRecentSnapshot = latestByGroup[groupKey];
          const rawDate = item.dateReviewed ?? item.dateInscription;
          items.push({
            date: rawDate ? new Date(rawDate) : new Date(0),
            element: (
              <AccordionSnapshot
                key={`current_${snapshotType}_${item.id}`}
                snapshot={item}
                snapshotType={snapshotType}
                isNetwork={isNetwork}
                author={item.author ?? item.creator}
                reviewer={item.reviewer}
                previous={mostRecentSnapshot}
                isCurrent
                all
              />
            )
          });
        });
      });
    }

    // Past snapshots
    if (hasData) {
      data.forEach(snapshotGroup => {
        const snapshotType = Object.keys(snapshotGroup)[0];
        const snapshot = snapshotGroup[snapshotType][0];
        items.push({
          date: snapshot.id ? new Date(snapshot.id) : new Date(0),
          element: (
            <AccordionSnapshot
              key={snapshot.id + snapshot.t_id}
              snapshot={snapshot}
              snapshotType={snapshotType}
              isNetwork={isNetwork}
              author={snapshot.author ?? snapshot.creator}
              reviewer={snapshot.reviewer}
              previous={previousMap[`${snapshot.id}_${snapshot.t_id}`]}
              all
            />
          )
        });
      });
    }

    items.sort((a, b) => b.date - a.date);
    return items;
  })();

  const hasItems = timelineItems.length > 0;

  return (
    <Box sx={{ px: 2 }}>
      {isCurrentItemLoading && (
        <Skeleton height={80} variant="rectangular" sx={{ borderRadius: 1, mb: 1 }} />
      )}
      {hasItems ? (
        <Timeline
          sx={{
            p: 0,
            m: 0,
            '& .MuiTimelineItem-root:last-child .MuiTimelineConnector-root': {
              display: 'none'
            }
          }}>
          {timelineItems.map(({ element }) => element)}
        </Timeline>
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

AccordionSnapshotListPage.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({})),
  type: PropTypes.string,
  isNetwork: PropTypes.bool,
  currentTItem: PropTypes.shape({
    id: PropTypes.number,
    author: authorType,
    reviewer: authorType,
    creator: PropTypes.shape({ id: PropTypes.number, nickname: PropTypes.string }),
    descriptions: PropTypes.arrayOf(PropTypes.shape({})),
    locations: PropTypes.arrayOf(PropTypes.shape({})),
    histories: PropTypes.arrayOf(PropTypes.shape({})),
    riggings: PropTypes.arrayOf(PropTypes.shape({})),
    comments: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  isCurrentItemLoading: PropTypes.bool
};

export default AccordionSnapshotListPage;
