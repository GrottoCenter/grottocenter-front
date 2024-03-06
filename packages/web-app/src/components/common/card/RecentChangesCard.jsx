import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import withTheme from '@mui/styles/withTheme';
import { styled } from '@mui/material/styles';
import GCLink from '../GCLink';

const nowd = new Date();
const A_DAY_MS = 1000 * 60 * 60 * 24;

function timeDiff(date, formatMessage) {
  const nbDayDiff = Math.trunc(
    (nowd.getTime() - new Date(date).getTime()) / A_DAY_MS
  );
  if (nbDayDiff === 0) return formatMessage({ id: 'Today' });
  if (nbDayDiff === 1) return formatMessage({ id: 'Yersteday' });
  return `${nbDayDiff} ${formatMessage({ id: 'Days ago' })}`;
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

  const lastEntity = entityFmt(entities.pop(), formatMessage);
  const otherEntities = entities
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

const GCLinkStyled = withTheme(styled(GCLink)`
  color: #ffcfac;
  font-size: 1.1em;
  font-weight: bold;
  text-decoration-thickness: 3px;
`);

const ChangeItem = ({ changeInfo }) => {
  // There is 4 type of sentences:
  // 1. author mainAction mainEntity
  // 2. author mainAction mainEntity and subAction subEntityType and subEntityType
  // 3. author subAction a subEntityType on mainEntity
  // 4. author subAction subEntityType and subEntityType on mainEntity

  // TODO Does the sentence formating work well on all languages ?
  const { formatMessage } = useIntl();

  const dateEl = (
    <Chip
      color="primary"
      sx={{ backgroundColor: '#5d4037' }}
      label={timeDiff(changeInfo.date, formatMessage)}
    />
  );
  const authorEl = (
    <GCLinkStyled href={`/ui/persons/${changeInfo.authorId}`} internal>
      {changeInfo.author}
    </GCLinkStyled>
  );
  const mainEntityEl = (
    <>
      {entityFmt(changeInfo.mainEntityType, formatMessage)}{' '}
      <GCLinkStyled
        href={getEntityLinkUrl(
          changeInfo.mainEntityType,
          changeInfo.mainEntityId
        )}
        internal>
        {changeInfo.name}
      </GCLinkStyled>{' '}
    </>
  );
  const changeType = actionFmt(
    changeInfo.mainAction ?? changeInfo.subAction,
    formatMessage
  );

  if (changeInfo.mainAction != null) {
    // Type 1 and 2
    let additionalParts;
    if (changeInfo.subAction != null)
      additionalParts = (
        <>
          {' '}
          {formatMessage({ id: 'with' })}{' '}
          {subEntitygroupFmt(changeInfo.subEntityTypes, formatMessage)}
        </>
      );
    return (
      <>
        <div>{dateEl}</div>
        <div>
          {authorEl} {changeType} {mainEntityEl} {additionalParts ?? ''}
        </div>
      </>
    );
  }

  // Type 3 and 4
  return (
    <>
      <div>{dateEl}</div>
      <div>
        {authorEl} {changeType}{' '}
        {subEntitygroupFmt(changeInfo.subEntityTypes, formatMessage)}{' '}
        {formatMessage({ id: 'on' })} {mainEntityEl}
      </div>
    </>
  );
};

const ChangeTable = styled('div')(
  ({ theme }) => `
    display: grid;
    gap: 0.3em;
    grid-template-rows: auto auto;
    & > *:nth-child(even){
      padding-bottom: 2em;
    }

    ${theme.breakpoints.up('sm')} {
      grid-template-columns: auto 1fr;
      grid-template-rows: unset;
      gap: 1.3em 0.5em;
      & > *:nth-child(odd){
        justify-self: end;
      }
      & > *:nth-child(even){
        padding-bottom: 0;
      }
    }
    `
);

const RecentChangesCard = ({ changes, isFetching, fetch }) => {
  useEffect(() => {
    fetch();
  }, [fetch]);

  if (isFetching || !changes) return <CircularProgress />;
  return (
    <ChangeTable>
      {changes.map(e => (
        <ChangeItem changeInfo={e} key={e.date} />
      ))}
    </ChangeTable>
  );
};

const changeInfo = PropTypes.shape({
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

ChangeItem.propTypes = { changeInfo };
RecentChangesCard.propTypes = {
  isFetching: PropTypes.bool,
  changes: PropTypes.arrayOf(changeInfo),
  fetch: PropTypes.func.isRequired
};

export default RecentChangesCard;
