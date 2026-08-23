import { FormattedRelativeTime, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

import { getRecentChangeKey } from '@/utils/recentChanges';
import AppLink from './AppLink';
import CustomIcon from './CustomIcon';
import FetchErrorState from './FetchErrorState';

const getRelativeTimeProps = dateStr => {
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
};

const actionFmt = (action, formatMessage) => {
  if (action === 'create') return formatMessage({ id: 'created' });
  if (action === 'update') return formatMessage({ id: 'updated' });
  if (action === 'delete') return formatMessage({ id: 'deleted' });
  if (action === 'restore') return formatMessage({ id: 'restored' });
  return formatMessage({ id: 'changed' });
};

const entityFmt = (entity, formatMessage) => {
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
  if (entity === 'guideline') return formatMessage({ id: 'the guideline' });
  return formatMessage({ id: 'unknown' });
};

const subEntityGroupFmt = (entities, formatMessage) => {
  if (entities.length === 0) return '';
  if (entities.length === 1) return entityFmt(entities[0], formatMessage);

  const lastEntity = entityFmt(entities[entities.length - 1], formatMessage);
  const otherEntities = entities
    .slice(0, -1)
    .map(entity => entityFmt(entity, formatMessage))
    .join(' ');
  return `${otherEntities} ${formatMessage({ id: 'and' })} ${lastEntity}`;
};

const getEntityLinkUrl = (type, id) => {
  if (type === 'grotto') return `/ui/organizations/${id}`;
  if (type === 'entrance') return `/ui/entrances/${id}`;
  if (type === 'cave') return `/ui/caves/${id}`;
  if (type === 'document') return `/ui/documents/${id}`;
  if (type === 'massif') return `/ui/massifs/${id}`;
  return null;
};

const getEntityIcon = type => {
  if (type === 'cave' || type === 'entrance') return 'entrance';
  if (type === 'massif') return 'massif';
  if (type === 'document') return 'bibliography';
  if (type === 'grotto') return 'organization';
  if (type === 'guideline') return 'guidelines';
  return null;
};

const TimelineItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(0.75, 0),
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

const StrongText = ({ children }) => (
  <Typography variant="body2" component="span" sx={{ fontWeight: 600 }}>
    {children}
  </Typography>
);

const ChangeItem = ({ changeInfo }) => {
  const { formatMessage } = useIntl();
  const iconType = getEntityIcon(changeInfo.mainEntityType);
  const relTime = getRelativeTimeProps(changeInfo.date);
  const changeType = actionFmt(
    changeInfo.mainAction ?? changeInfo.subAction,
    formatMessage
  );
  const authorName = changeInfo.author || formatMessage({ id: 'unknown' });
  const entityName = changeInfo.name || formatMessage({ id: 'unknown' });
  const entityUrl = getEntityLinkUrl(
    changeInfo.mainEntityType,
    changeInfo.mainEntityId
  );

  const authorEl =
    changeInfo.authorId != null && changeInfo.author ? (
      <AppLink
        to={`/ui/persons/${changeInfo.authorId}`}
        color="secondary"
        underline="hover"
        sx={{ fontWeight: 600 }}>
        {authorName}
      </AppLink>
    ) : (
      <StrongText>{authorName}</StrongText>
    );

  const entityEl =
    entityUrl && changeInfo.mainAction !== 'delete' ? (
      <AppLink to={entityUrl} underline="hover" sx={{ fontWeight: 600 }}>
        {entityName}
      </AppLink>
    ) : (
      <StrongText>{entityName}</StrongText>
    );

  let sentence;
  if (changeInfo.mainAction != null) {
    const subText =
      changeInfo.subAction != null
        ? ` ${formatMessage({ id: 'with' })} ${subEntityGroupFmt(
            changeInfo.subEntityTypes,
            formatMessage
          )}`
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
          {subEntityGroupFmt(changeInfo.subEntityTypes, formatMessage)}{' '}
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
            sx={{ flexShrink: 0, mt: 0.25 }}>
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

const LoadingState = () => (
  <Box>
    {/* Fixed-length skeleton placeholders: position is their only identity. */}
    {/* eslint-disable react/no-array-index-key */}
    {[...Array(5)].map((_, index) => (
      <TimelineItem key={index}>
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
      </TimelineItem>
    ))}
    {/* eslint-enable react/no-array-index-key */}
  </Box>
);

const RecentChangesList = ({
  changes = [],
  isLoading = false,
  error = null,
  onRetry = null
}) => {
  const { formatMessage } = useIntl();

  if (isLoading && changes.length === 0) return <LoadingState />;

  if (error && changes.length === 0) {
    return (
      <FetchErrorState
        error={error}
        messageId="Unable to load recent changes"
        onRetry={onRetry}
      />
    );
  }

  if (changes.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled' }}>
        <HistoryOutlinedIcon sx={{ fontSize: 48, mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">
          {formatMessage({ id: 'No recent changes' })}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {changes.map(change => (
        <ChangeItem changeInfo={change} key={getRecentChangeKey(change)} />
      ))}
      {error && (
        <Box sx={{ mt: 1 }}>
          <FetchErrorState
            error={error}
            messageId="Unable to load recent changes"
            onRetry={onRetry}
          />
        </Box>
      )}
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

StrongText.propTypes = { children: PropTypes.node.isRequired };
ChangeItem.propTypes = { changeInfo: changeInfoShape.isRequired };
RecentChangesList.propTypes = {
  changes: PropTypes.arrayOf(changeInfoShape),
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.instanceOf(Error)
  ]),
  onRetry: PropTypes.func
};

export default RecentChangesList;
