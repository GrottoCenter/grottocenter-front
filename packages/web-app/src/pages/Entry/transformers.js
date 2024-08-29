export const getComments = comments =>
  comments
    .map(comment => ({
      author: comment?.author,
      reviewer: comment?.reviewer,
      body: comment?.body,
      creationDate: comment?.dateInscription
        ? new Date(comment?.dateInscription)
        : null,
      dateReviewed: comment?.dateReviewed
        ? new Date(comment?.dateReviewed)
        : null,
      id: comment?.id,
      isDeleted: comment?.isDeleted,
      access: comment?.approach,
      interest: comment?.aestheticism,
      progression: comment?.caving,
      language: comment?.language,
      title: comment?.title,
      eTTrail: comment?.eTTrail,
      eTUnderground: comment?.eTUnderground
    }))
    .sort((l1, l2) => l1.date < l2.date);

export const getDetails = data => ({
  altitude: data.altitude,
  author: data?.author,
  reviewer: data?.reviewer,
  cave: data.cave,
  coordinates:
    data.longitude && data.latitude ? [data.latitude, data.longitude] : null,
  country: data.country,
  creationDate: data.dateInscription ? new Date(data.dateInscription) : null,
  depth: data?.cave?.depth ?? 0,
  development: data?.cave?.length ?? 0,
  discoveryYear: data.discoveryYear,
  id: data.id,
  access: data?.stats?.approach ?? 0,
  interest: data?.stats?.aestheticism ?? 0,
  progression: data?.stats?.caving ?? 0,
  isDivingCave: data?.cave?.isDiving ?? null,
  isSensitive: data.isSensitive,
  language: data?.names?.[0]?.language ?? null,
  city: data.city,
  region: data.region,
  massif: data.massifs?.[0] ?? undefined,
  massifs: data.massifs,
  mountain: data?.massif?.name ?? null,
  name: data.name,
  precision: data.precision,
  temperature: data?.cave?.temperature ?? null,
  undergroundType: data?.massif?.undergroundType ?? null
});

export const getDescriptions = descriptions =>
  descriptions
    .map(description => ({
      author: description?.author,
      reviewer: description?.reviewer,
      body: description?.body,
      creationDate: description?.dateInscription
        ? new Date(description?.dateInscription)
        : null,
      reviewedDate: description?.dateReviewed
        ? new Date(description?.dateReviewed)
        : null,
      id: description?.id,
      isDeleted: description?.isDeleted,
      language: description?.language,
      title: description?.title,
      relevance: description?.relevance
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);

export const getHistories = histories =>
  histories
    .map(history => ({
      id: history?.id,
      isDeleted: history?.isDeleted,
      creationDate: history?.dateInscription
        ? new Date(history?.dateInscription)
        : null,
      reviewedDate: history?.dateReviewed
        ? new Date(history?.dateReviewed)
        : null,
      author: history?.author,
      reviewer: history?.reviewer,
      body: history?.body,
      relevance: history?.relevance,
      language: history?.language
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);

export const getRiggings = riggings =>
  riggings.map(rigging => ({
    obstacles: rigging?.obstacles ?? [],
    author: rigging?.author,
    reviewer: rigging?.reviewer,
    id: rigging.id,
    isDeleted: rigging?.isDeleted,
    language: rigging?.language || '',
    title: rigging?.title || '',
    date: rigging?.dateInscription ? new Date(rigging.dateInscription) : null,
    dateReviewed: rigging?.dateReviewed ? new Date(rigging?.dateReviewed) : null
  }));

export const getLocations = locations =>
  locations
    .map(location => ({
      id: location?.id,
      isDeleted: location?.isDeleted,
      title: location?.title,
      author: location?.author,
      reviewer: location?.reviewer,
      body: location?.body,
      creationDate: location?.dateInscription
        ? new Date(location?.dateInscription)
        : null,
      reviewedDate: location?.dateReviewed
        ? new Date(location?.dateReviewed)
        : null,
      relevance: location?.relevance,
      language: location?.language
    }))
    .sort((l1, l2) => l1.relevance < l2.relevance);
