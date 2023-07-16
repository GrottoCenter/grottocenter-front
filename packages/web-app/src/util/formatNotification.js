const getLink = (entityType, entityId) => `/ui/${entityType}/${entityId}`;
const caveIconPath = '/images/iconsV3/cave_system.svg';
const documentIconPath = '/images/iconsV3/bibliography.svg';
const entranceIconPath = '/images/entry.svg';
const massifIconPath = '/images/massif.svg';
const organizationIconPath = '/images/club.svg';

const getRelatedCaveLinkAndIconPath = entity => {
  const caveId = entity.cave?.id;
  return {
    link: caveId ? getLink('caves', caveId) : undefined,
    iconPath: caveId ? caveIconPath : undefined
  };
};

const getRelatedEntranceLinkAndIconPath = entity => {
  const entranceId = entity.entrance?.id;
  return {
    link: entranceId ? getLink('entrances', entranceId) : undefined,
    iconPath: entranceId ? entranceIconPath : undefined
  };
};

const getRelatedMassifLinkAndIconPath = entity => {
  const massifId = entity.massif?.id;
  return {
    link: massifId ? getLink('massifs', massifId) : undefined,
    iconPath: massifId ? massifIconPath : undefined
  };
};

const getLinkAndIconPath = entity => {
  let link;
  let iconPath;

  // Some entity redirect directly to them (cave, document, entrance, massif, organization).
  // Other ones (comment, description, history, location, rigging) redirect to the ones listed above because they don't have a dedicated page.
  if (['comment', 'history', 'rigging'].includes(entity.type)) {
    const getters = [
      getRelatedCaveLinkAndIconPath,
      getRelatedEntranceLinkAndIconPath
    ];
    for (const getter of getters) {
      ({ link, iconPath } = getter(entity));
      if (link) break;
    }
  } else if (entity.type === 'cave') {
    link = getLink('caves', entity.id);
    iconPath = caveIconPath;
  } else if (entity.type === 'description') {
    const getters = [
      getRelatedCaveLinkAndIconPath,
      getRelatedEntranceLinkAndIconPath,
      getRelatedMassifLinkAndIconPath
    ];
    for (const getter of getters) {
      ({ link, iconPath } = getter(entity));
      if (link) break;
    }
  } else if (entity.type === 'document') {
    link = getLink('documents', entity.id);
    iconPath = documentIconPath;
  } else if (entity.type === 'entrance') {
    link = getLink('entrances', entity.id);
    iconPath = entranceIconPath;
  } else if (entity.type === 'location') {
    ({ link, iconPath } = getRelatedEntranceLinkAndIconPath(entity));
  } else if (entity.type === 'massif') {
    link = getLink('massifs', entity.id);
    iconPath = massifIconPath;
  } else if (entity.type === 'organization') {
    link = getLink('organizations', entity.id);
    iconPath = organizationIconPath;
  }

  return { link, iconPath };
};

const formatNotification = notification => {
  const {
    cave,
    comment,
    dateInscription,
    dateReadAt,
    description,
    document,
    history,
    entrance,
    location,
    massif,
    notificationType,
    notifier,
    organization,
    rigging
  } = notification;

  const isRead = !!dateReadAt;

  // Verb
  let verb = '';
  switch (notificationType.name) {
    case 'CREATE':
      verb = 'created';
      break;
    case 'DELETE':
      verb = 'deleted';
      break;
    case 'UPDATE':
      verb = 'updated';
      break;
    case 'VALIDATE':
      verb = 'validated';
      break;
    default:
  }

  // Entity data
  const possibleEntities = {
    cave,
    comment,
    description,
    document,
    entrance,
    history,
    location,
    massif,
    organization,
    rigging
  };
  let entity;
  for (const key of Object.keys(possibleEntities)) {
    const possibleEntity = possibleEntities[key];
    if (possibleEntity) {
      entity = { ...possibleEntity, type: key };
      break;
    }
  }

  // Exit if unknown entity
  if (!entity)
    return {
      dateInscription,
      entityName: 'unknown',
      entityType: 'unknown',
      iconPath: undefined,
      isRead,
      link: '#',
      notifier,
      verb
    };

  // Entity name
  let entityName = '';
  if (entity.name) entityName = entity.name;
  else if (entity.title) entityName = entity.title;
  else if (entity.titles) entityName = entity.titles[0]?.text;
  else if (entity.body) entityName = `${entity.body.slice(0, 50)}...`;

  // Entity type
  const entityType = entity.type;

  // Notification link & icon
  const { link, iconPath } = getLinkAndIconPath(entity);

  return {
    dateInscription,
    entityName,
    entityType,
    iconPath,
    isRead,
    link,
    notifier,
    verb
  };
};

export default formatNotification;
