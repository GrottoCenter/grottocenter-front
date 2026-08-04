import { useEffect } from 'react';
import { useIntl, FormattedRelativeTime } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import AppLink from '../AppLink';
import CustomIcon from '../CustomIcon';

function getRelativeTimeProps(dateStr) {
  const diffMs = new Date(dateStr) - Date.now();
  const absSec = Math.abs(diffMs) / 1000;
  if (absSec < 3600)
    return { value: Math.round(diffMs / 60000), unit: 'minute' };
  if (absSec < 86400)
    return { value: Math.round(diffMs / 3600000), unit: 'hour' };
  if (absSec < 2592000)
    return { value: Math.round(diffMs / 86400000), unit: 'day' };
  if (absSec < 31536000)
    return { value: Math.round(diffMs / 2592000000), unit: 'month' };
  return { value: Math.round(diffMs / 31536000000), unit: 'year' };
}

function actionFmt(action, formatMessage) {
  if (action === 'create') return formatMessage({ id: 'created' });
  if (action === 'update') return formatMessage({ id: 'updated' });
  if (action === 'delete') return formatMessage({ id: 'deleted' });
  if (action === 'restore') return formatMessage({ id: 'restored' });
  return formatMessage({ id: 'changed' });
}

function entityFmt(entity, formatMessage) {
  if (entity === 'location') return formatMessage({ id: 'a location' });
  if (entity === 'description') return formatMessage({ id: 'a description' });
  if (entity === 'rigging') return formatMessage({ id: 'a rigging' });
  if (entity === 'history') return formatMessage({ id: 'a history' });
  if (entity === 'comment') return formatMessage({ id: 'a comment' });
  if (entity === 'cave') return formatMessage({ id: 'the cave' });
  if (entity === 'entrance') return formatMessage({ id: 'the entrance' });
  if (entity === 'massif') return formatMessage({ id: 'the massif' });
  if (entity === 'document') return formatMessage({ id: 'the document' });
  if (entity === 'grotto') return formatMessage({ id: 'the organization' });
  return formatMessage({ id: 'unknown' });
}

function subEntitygroupFmt(entities, formatMessage) {
  if (entities.length === 0) return '';
  if (entities.length === 1) return entityFmt(entities[0], formatMessage);

  const lastEntity = entityFmt(entities[entities.length - 1], formatMessage);
  const otherEntities = entities
    .slice(0, -1)
    .map(e => entityFmt(e, formatMessage))
    .join(' ');
  return `${otherEntities} ${formatMessage({ id: 'and' })} ${lastEntity}`;
}

function getEntityLinkUrl(type, id) {
  if (type === 'grotto') return `/ui/organizations/${id}`;
  if (type === 'entrance') return `/ui/entrances/${id}`;
  if (type === 'cave') return `/ui/caves/${id}`;
  if (type === 'document') return `/ui/documents/${id}`;
  if (type === 'massif') return `/ui/massifs/${id}`;
  return `/`;
}

function getEntityIcon(type) {
  if (type === 'cave' || type === 'entrance') return 'entrance';
  if (type === 'massif') return 'massif';
  if (type === 'document') return 'bibliography';
  if (type === 'grotto') return 'organization';
  return null;
}

const TimelineItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '6px 0',
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`
  }
}));

const IconBubble = styled(Box)(({ theme }) => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.veryLight,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  '& > span': { margin: 0 }
}));

const ChangeItem = ({ changeInfo }) => {
  const { formatMessage } = useIntl();
  const iconType = getEntityIcon(changeInfo.mainEntityType);
  const relTime = getRelativeTimeProps(changeInfo.date);
  const changeType = actionFmt(
    changeInfo.mainAction ?? changeInfo.subAction,
    formatMessage
  );

  const authorEl = (
    <AppLink
      to={`/ui/persons/${changeInfo.authorId}`}
      color="secondary"
      underline="hover"
      sx={{ fontWeight: 600 }}>
      {changeInfo.author}
    </AppLink>
  );

  const entityEl = (
    <AppLink
      to={getEntityLinkUrl(changeInfo.mainEntityType, changeInfo.mainEntityId)}
      underline="hover"
      sx={{ fontWeight: 600 }}>
      {changeInfo.name}
    </AppLink>
  );

  let sentence;
  if (changeInfo.mainAction != null) {
    const subText =
      changeInfo.subAction != null
        ? ` ${formatMessage({ id: 'with' })} ${subEntitygroupFmt(changeInfo.subEntityTypes, formatMessage)}`
        : '';
    sentence = (
      <>
        {authorEl} {changeType}{' '}
        {entityFmt(changeInfo.mainEntityType, formatMessage)} {entityEl}
        {subText && (
          <Typography variant="body2" component="span" color="text.secondary">
            {subText}
          </Typography>
        )}
      </>
    );
  } else {
    sentence = (
      <>
        {authorEl} {changeType}{' '}
        <Typography variant="body2" component="span" color="text.secondary">
          {subEntitygroupFmt(changeInfo.subEntityTypes, formatMessage)}{' '}
          {formatMessage({ id: 'on' })}{' '}
        </Typography>
        {entityFmt(changeInfo.mainEntityType, formatMessage)} {entityEl}
      </>
    );
  }

  return (
    <TimelineItem>
      <IconBubble>
        {iconType ? (
          <CustomIcon type={iconType} size={20} />
        ) : (
          <QuestionMarkIcon sx={{ fontSize: 20 }} color="primary" />
        )}
      </IconBubble>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 0.5,
            flexWrap: 'wrap'
          }}>
          <Typography variant="body2" component="span" sx={{ flex: 1 }}>
            {sentence}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ flexShrink: 0, mt: '2px' }}>
            <FormattedRelativeTime
              value={relTime.value}
              unit={relTime.unit}
              numeric="auto"
            />
          </Typography>
        </Box>
      </Box>
    </TimelineItem>
  );
};

const RecentChangesCard = ({ changes, isFetching, fetch }) => {
  useEffect(() => {
    fetch();
  }, [fetch]);

  if (isFetching || !changes) {
    return (
      <Box>
        {/* Fixed-length skeleton placeholders: position is the only identity
            they have, and the list never reorders. */}
        {/* eslint-disable react/no-array-index-key */}
        {[...Array(5)].map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: '12px',
              py: '10px',
              borderBottom: '1px solid rgba(0,0,0,0.08)'
            }}>
            <Skeleton
              variant="circular"
              width={36}
              height={36}
              sx={{ flexShrink: 0 }}
            />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="75%" />
              <Skeleton variant="text" width="35%" />
            </Box>
          </Box>
        ))}
        {/* eslint-enable react/no-array-index-key */}
      </Box>
    );
  }

  return (
    <Box>
      {changes.map(e => (
        <ChangeItem
          changeInfo={e}
          key={`${e.date}-${e.mainEntityType}-${e.mainEntityId}`}
        />
      ))}
    </Box>
  );
};

const changeInfoShape = PropTypes.shape({
  date: PropTypes.string,
  authorId: PropTypes.number,
  author: PropTypes.string,
  mainEntityType: PropTypes.string,
  mainEntityId: PropTypes.number,
  mainAction: PropTypes.string,
  subEntityTypes: PropTypes.arrayOf(PropTypes.string),
  subAction: PropTypes.string,
  name: PropTypes.string
});

ChangeItem.propTypes = { changeInfo: changeInfoShape };
RecentChangesCard.propTypes = {
  isFetching: PropTypes.bool,
  changes: PropTypes.arrayOf(changeInfoShape),
  fetch: PropTypes.func.isRequired
};

export default RecentChangesCard;
