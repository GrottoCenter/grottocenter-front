import React from 'react';
import { useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Tooltip, Button } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
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

const SnapshotButton = ({
  id,
  type,
  content,
  label,
  isNetwork,
  getAll = false,
  startIcon = <HistoryIcon />,
  ...grpProps
}) => {
  const { formatMessage } = useIntl();
  return (
    <Tooltip title={formatMessage({ id: 'Access the revision history page' })}>
      <Button
        {...grpProps}
        component={Link}
        to={`/ui/${type}/${id}/snapshots?${[
          isNetwork !== undefined ? `isNetwork=${isNetwork}` : '',
          getAll ? `getAll=true` : ''
        ]
          .filter(e => e)
          .join('&')}`}
        onClick={!!content && (() => storeInLocalStorage(content))}
        target="_blank"
        rel="opener"
        startIcon={!!label && startIcon}>
        {!label && startIcon}
        {label}
      </Button>
    </Tooltip>
  );
};
SnapshotButton.propTypes = {
  id: PropTypes.number,
  type: PropTypes.string,
  content: PropTypes.shape({}),
  label: PropTypes.string,
  isNetwork: PropTypes.bool,
  getAll: PropTypes.bool,
  startIcon: PropTypes.node
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

export { SnapshotButton, getAccordionBodyFromType, sortSnapshots };
