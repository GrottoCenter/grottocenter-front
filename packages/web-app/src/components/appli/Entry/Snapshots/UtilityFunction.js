import React from 'react';
import { Link } from 'react-router-dom';
import { IconButton } from '@material-ui/core';
import HistoryIcon from '@material-ui/icons/History';
import TimelineIcon from '@material-ui/icons/Timeline';
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

const getAccordionBodyFromType = (type, data, isNetwork) => {
  switch (type) {
    case 'riggings':
      return <RiggingSnapshots rigging={data} key={data.id} />;
    case 'entrances':
      return isNetwork ? (
        <EntranceNetworkSnapshots entrance={data} key={data.id} />
      ) : (
        <EntranceCaveSnapshots entrance={data} key={data.id} />
      );
    case 'documents':
      return <DocumentSnapshots document={data} key={data.id} />;
    case 'comments':
      return <CommentSnapshots comment={data} key={data.id} />;
    default:
      return <GenericSnapshots data={data} key={data.id} />;
  }
};

const SnapshotButton = item => {
  const { id, type, content, isNetwork } = item;
  return (
    <IconButton
      component={Link}
      to={`/ui/${type}/${id}/snapshots${
        isNetwork !== undefined ? `?isNetwork=${isNetwork}` : ''
      }`}
      onClick={() => storeInLocalStorage(content)}
      color="primary"
      target="_blank"
      rel="noreferrer">
      <HistoryIcon />
    </IconButton>
  );
};

const PageVersionningButton = ({ id, isNetwork }) => (
  <IconButton
    component={Link}
    to={`/ui/entrances/${id}/snapshots?isNetwork=${isNetwork}&all=true`}
    color="primary"
    target="_blank"
    rel="noreferrer">
    <TimelineIcon />
  </IconButton>
);
PageVersionningButton.propTypes = {
  id: PropTypes.number,
  isNetwork: PropTypes.bool
};

export { SnapshotButton, PageVersionningButton, getAccordionBodyFromType };
