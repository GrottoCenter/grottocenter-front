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

  // A real current version is renderable (has an id). Some entities pass an
  // id-less marker carrying only isDeleted to gate the rollback button (see
  // SnapshotPage), which must not render an empty "current version" card.
  const hasCurrentItem = currentItem?.id != null;

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
    if (!items?.length) return null;
    // Skip rename snapshots: they only carry the renaming and no other data, so
    // they must not be used as the previous version to diff the current item.
    for (let i = items.length - 1; i >= 0; i -= 1) {
      if (!items[i].isNameChangeSnapshot) return items[i];
    }
    return null;
  })();

  const snapshotElements = hasRevisions
    ? Object.keys(filteredData).map(snapshotType => {
        const snapshotItems = filteredData[snapshotType];

        // Rename snapshots come from h_name: they only carry the OLD name and
        // have no reviewer. The NEW name and the actual reviewer live on the
        // next real (non-rename) snapshot — resolve them here.
        const nextRealSnapshot = index => {
          for (let j = index + 1; j < snapshotItems.length; j += 1) {
            if (!snapshotItems[j].isNameChangeSnapshot) return snapshotItems[j];
          }
          return null;
        };

        let prev = null;
        const items = snapshotItems.map((snapshot, index) => {
          const isRename = !!snapshot.isNameChangeSnapshot;
          const nextReal = isRename ? nextRealSnapshot(index) : null;
          const element = (
            <AccordionSnapshot
              key={snapshot.id + snapshot.t_id}
              snapshot={snapshot}
              snapshotType={snapshotType}
              isNetwork={isNetwork}
              author={snapshot.author}
              reviewer={snapshot.reviewer ?? nextReal?.reviewer}
              previous={prev}
              actualItem={currentItem}
              newName={
                isRename ? (nextReal?.name ?? nextReal?.caveName) : undefined
              }
            />
          );
          // Rename snapshots are ignored in the history chain: they carry no
          // data beyond the renaming, so they must not become the previous
          // version used to diff the next real snapshot.
          if (!isRename) prev = snapshot;
          return element;
        });
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
                actualItem={currentItem}
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
