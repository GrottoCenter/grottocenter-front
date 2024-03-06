import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Tooltip, Button } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import TimelineIcon from '@mui/icons-material/Timeline';
import PropTypes from 'prop-types';
import {
  CommentSnapshots,
  DocumentSnapshots,
  EntranceCaveSnapshots,
  EntranceNetworkSnapshots,
  GenericSnapshots,
  RiggingSnapshots
} from './component/SnapshotComponents';

const storeInLocalStorage = item =>
  localStorage.setItem('t_item', JSON.stringify(item));

const getAccordionBodyFromType = (type, data, isNetwork, previous) => {
  switch (type) {
    case 'riggings':
      return (
        <RiggingSnapshots rigging={data} previous={previous} key={data.id} />
      );
    case 'entrances':
      return isNetwork ? (
        <EntranceNetworkSnapshots
          entrance={data}
          previous={previous}
          key={data.id}
        />
      ) : (
        <EntranceCaveSnapshots
          entrance={data}
          previous={previous}
          key={data.id}
        />
      );
    case 'documents':
      return (
        <DocumentSnapshots document={data} previous={previous} key={data.id} />
      );
    case 'comments':
      return (
        <CommentSnapshots comment={data} previous={previous} key={data.id} />
      );
    default:
      return <GenericSnapshots data={data} previous={previous} key={data.id} />;
  }
};

const SnapshotButton = item => {
  const { id, type, content, isNetwork, showLabel = false, ...grpProps } = item;
  const { formatMessage } = useIntl();
  return (
    <Tooltip title={formatMessage({ id: 'Access the revision history page' })}>
      <Button
        {...grpProps}
        component={Link}
        to={`/ui/${type}/${id}/snapshots${
          isNetwork !== undefined ? `?isNetwork=${isNetwork}` : ''
        }`}
        onClick={() => storeInLocalStorage(content)}
        target="_blank"
        rel="opener"
        startIcon={showLabel && <HistoryIcon />}>
        {showLabel ? formatMessage({ id: 'Revisions' }) : <HistoryIcon />}
      </Button>
    </Tooltip>
  );
};

const SnapshotPageButton = ({ id, isNetwork, ...grpProps }) => {
  const { formatMessage } = useIntl();
  return (
    <Tooltip
      title={formatMessage({
        id: 'Page of all types of revision history for this entrance'
      })}>
      <Button
        {...grpProps}
        component={Link}
        to={`/ui/entrances/${id}/snapshots?isNetwork=${isNetwork}&all=true`}
        target="_blank"
        rel="opener"
        startIcon={<TimelineIcon />}>
        {formatMessage({ id: 'All revisions' })}
      </Button>
    </Tooltip>
  );
};
SnapshotPageButton.propTypes = {
  id: PropTypes.number,
  isNetwork: PropTypes.bool
};

const sortSnapshots = dataToStore => {
  const sortedItems = [];

  Object.keys(dataToStore).map(type =>
    dataToStore[type].map(item => sortedItems.push({ [type]: [item] }))
  );

  sortedItems.sort((aObj, bObj) => {
    const a = aObj[Object.keys(aObj)[0]];
    const b = bObj[Object.keys(bObj)[0]];
    const aDate = new Date(a[0].id);
    const bDate = new Date(b[0].id);
    return new Date(bDate) - new Date(aDate);
  });

  return sortedItems;
};

sortSnapshots.prototype = {
  type: PropTypes.shape({
    id: PropTypes.string,
    t_id: PropTypes.string
  })
};

export {
  SnapshotButton,
  SnapshotPageButton,
  getAccordionBodyFromType,
  sortSnapshots
};
