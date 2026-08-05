import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Skeleton } from '@mui/material';
import { Timeline } from '@mui/lab';

import Alert from '../../../common/Alert';
import authorType from '../../../../types/author.type';
import AccordionSnapshot from './AccordionSnapshot';

const SUB_TYPES = [
  'descriptions',
  'locations',
  'histories',
  'riggings',
  'comments'
];

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
  const { previousMap, latestByGroup, renameInfoMap } = useMemo(() => {
    if (!hasData)
      return { previousMap: {}, latestByGroup: {}, renameInfoMap: {} };
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
    const renameInfo = {};
    Object.entries(groups).forEach(([key, group]) => {
      group.sort((a, b) => new Date(a.id) - new Date(b.id));
      // Rename snapshots come from h_name: they only carry the OLD name and have
      // no reviewer, and they carry no other data. So they must not become the
      // `previous` used to diff the next real snapshot, and their NEW name and
      // reviewer are resolved from the next real (non-rename) snapshot.
      const nextRealSnapshot = index => {
        for (let j = index + 1; j < group.length; j += 1) {
          if (!group[j].isNameChangeSnapshot) return group[j];
        }
        return null;
      };
      let prev = null;
      group.forEach((snapshot, index) => {
        const snapKey = `${snapshot.id}_${snapshot.t_id}`;
        prevMap[snapKey] = prev;
        if (snapshot.isNameChangeSnapshot) {
          const nextReal = nextRealSnapshot(index);
          renameInfo[snapKey] = {
            newName: nextReal?.name ?? nextReal?.caveName,
            reviewer: nextReal?.reviewer
          };
        } else {
          prev = snapshot;
          latest[key] = snapshot;
        }
      });
    });
    return {
      previousMap: prevMap,
      latestByGroup: latest,
      renameInfoMap: renameInfo
    };
  }, [data, hasData]);

  // Build a unified sorted timeline: current items + snapshots interleaved by date.
  // Each entry: { date: Date, element: ReactElement }
  const timelineItems = useMemo(() => {
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
                actualItem={currentTItem}
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
        const rename = renameInfoMap[`${snapshot.id}_${snapshot.t_id}`];
        items.push({
          date: snapshot.id ? new Date(snapshot.id) : new Date(0),
          element: (
            <AccordionSnapshot
              key={snapshot.id + snapshot.t_id}
              snapshot={snapshot}
              snapshotType={snapshotType}
              isNetwork={isNetwork}
              author={snapshot.author ?? snapshot.creator}
              reviewer={snapshot.reviewer ?? rename?.reviewer}
              previous={previousMap[`${snapshot.id}_${snapshot.t_id}`]}
              newName={rename?.newName}
              all
              actualItem={currentTItem}
            />
          )
        });
      });
    }

    items.sort((a, b) => b.date - a.date);
    return items;
  }, [
    data,
    hasData,
    currentTItem,
    isCurrentItemLoading,
    type,
    isNetwork,
    latestByGroup,
    previousMap,
    renameInfoMap
  ]);

  const hasItems = timelineItems.length > 0;

  return (
    <Box sx={{ px: 1 }}>
      {isCurrentItemLoading && (
        <Skeleton
          height={80}
          variant="rectangular"
          sx={{ borderRadius: 1, mb: 0.5 }}
        />
      )}
      {hasItems ? (
        <Timeline
          sx={{
            p: 0.25,
            m: 0.25,
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
    creator: PropTypes.shape({
      id: PropTypes.number,
      nickname: PropTypes.string
    }),
    descriptions: PropTypes.arrayOf(PropTypes.shape({})),
    locations: PropTypes.arrayOf(PropTypes.shape({})),
    histories: PropTypes.arrayOf(PropTypes.shape({})),
    riggings: PropTypes.arrayOf(PropTypes.shape({})),
    comments: PropTypes.arrayOf(PropTypes.shape({}))
  }),
  isCurrentItemLoading: PropTypes.bool
};

export default AccordionSnapshotListPage;
