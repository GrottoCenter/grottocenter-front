import { useLocation } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Tooltip, Button } from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import PropTypes from 'prop-types';
import AppLink from '../../../common/AppLink';
import {
  CommentSnapshots,
  DocumentSnapshots,
  EntranceCaveSnapshots,
  EntranceNetworkSnapshots,
  GenericSnapshots,
  RiggingSnapshots
} from './component/SnapshotComponents';

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

// URL-building logic extracted so consumers that render their own history
// affordance (e.g. an item in a menu list) don't need to render a whole
// SnapshotButton and reach into its internals.
const useSnapshotUrl = ({
  id,
  type,
  isNetwork,
  getAll = false,
  parentId,
  parentType,
  isDeleted
}) => {
  const location = useLocation();

  // Remember the page the history was opened from so the snapshot page's "back"
  // button returns here. Some entities (e.g. guidelines) have no standalone
  // route of their own, and others (regions) live under nested URLs, so we can't
  // reliably rebuild the origin URL from `type`/`id` alone.
  const backTo = encodeURIComponent(`${location.pathname}${location.search}`);

  return `/ui/${type}/${id}/snapshots?${[
    isNetwork !== undefined ? `isNetwork=${isNetwork}` : '',
    getAll ? `all=true` : '',
    parentId !== undefined ? `parentId=${parentId}` : '',
    parentType ? `parentType=${parentType}` : '',
    // Entities without a standalone route (e.g. guidelines) can't be re-fetched
    // by the snapshot page, so carry the current soft-delete state along to gate
    // the rollback button (a deleted item must be restored before rolling back).
    isDeleted !== undefined ? `isDeleted=${isDeleted}` : '',
    `backTo=${backTo}`
  ]
    .filter(e => e)
    .join('&')}`;
};

const SnapshotButton = ({
  id,
  type,
  label,
  isNetwork,
  getAll = false,
  parentId,
  parentType,
  isDeleted,
  startIcon = <HistoryIcon />,
  tooltipTitle,
  ...grpProps
}) => {
  const { formatMessage } = useIntl();
  const url = useSnapshotUrl({
    id,
    type,
    isNetwork,
    getAll,
    parentId,
    parentType,
    isDeleted
  });

  return (
    <Tooltip
      title={
        tooltipTitle ??
        formatMessage({ id: 'Access the revision history page' })
      }>
      <Button
        {...grpProps}
        component={AppLink}
        to={url}
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
  label: PropTypes.string,
  isNetwork: PropTypes.bool,
  getAll: PropTypes.bool,
  parentId: PropTypes.number,
  parentType: PropTypes.string,
  isDeleted: PropTypes.bool,
  startIcon: PropTypes.node,
  tooltipTitle: PropTypes.string
};

const sortSnapshots = dataToStore => {
  const sortedItems = [];

  Object.keys(dataToStore).forEach(type =>
    dataToStore[type].forEach(item => sortedItems.push({ [type]: [item] }))
  );

  sortedItems.sort((aObj, bObj) => {
    const a = aObj[Object.keys(aObj)[0]];
    const b = bObj[Object.keys(bObj)[0]];
    const dateA = a[0]?.id ? new Date(a[0].id) : new Date(0);
    const dateB = b[0]?.id ? new Date(b[0].id) : new Date(0);
    return dateB - dateA;
  });

  return sortedItems;
};

export {
  SnapshotButton,
  useSnapshotUrl,
  getAccordionBodyFromType,
  sortSnapshots
};
