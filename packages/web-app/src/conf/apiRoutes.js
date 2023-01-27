export const apiVersion = 'v1';
export const API_URL = process.env.REACT_APP_API_URL;
const API_BASE_PATH = `${API_URL}/api/${apiVersion}`;

export const dynamicNumbersUrl = {
  documents: `${API_BASE_PATH}/documents/count`,
  entrances: `${API_BASE_PATH}/entrances/count`,
  officialPartners: `${API_BASE_PATH}/partners/count`,
  organizations: `${API_BASE_PATH}/organizations/count`,
  publicEntrances: `${API_BASE_PATH}/entrances/publicCount`,
  users: `${API_BASE_PATH}/cavers/users/count`,
  countries: `${API_BASE_PATH}/countries/count`
};

export const cumulatedLengthUrl = `${API_BASE_PATH}/caves/cumulated-length`;

// ===== Auth urls
export const changePasswordUrl = `${API_BASE_PATH}/account/password`;
export const changeEmailUrl = `${API_BASE_PATH}/account/email`;
export const loginUrl = `${API_BASE_PATH}/login`;
export const logoutUrl = `${API_BASE_PATH}/logout`;
export const signUpUrl = `${API_BASE_PATH}/signup`;
export const forgotPasswordUrl = `${API_BASE_PATH}/forgotPassword`;

// ===== Caves urls
export const getCaveUrl = `${API_BASE_PATH}/caves/`;
export const postCreateCaveUrl = `${API_BASE_PATH}/caves`;
export const putCaveUrl = caveId => `${API_BASE_PATH}/caves/${caveId}`;

// ===== Countries urls
export const getCountryUrl = countryId =>
  `${API_BASE_PATH}/countries/${countryId}`;
export const getStatisticsCountryUrl = countryId =>
  `${API_BASE_PATH}/countries/${countryId}/statistics`;

// ===== Descriptions urls
export const postDescriptionUrl = `${API_BASE_PATH}/descriptions`;
export const putDescriptionUrl = descriptionId =>
  `${API_BASE_PATH}/descriptions/${descriptionId}`;

// ===== Comments urls
export const postCommentUrl = `${API_BASE_PATH}/comments`;
export const putCommentUrl = commentId =>
  `${API_BASE_PATH}/comments/${commentId}`;

// ===== Riggings urls
export const postRiggingsUrl = `${API_BASE_PATH}/riggings`;
export const putRiggingsUrl = riggingsId =>
  `${API_BASE_PATH}/riggings/${riggingsId}`;

// ===== Documents urls
export const getDocumentChildrenUrl = documentId =>
  `${API_BASE_PATH}/documents/${documentId}/children`;
export const getDocumentsUrl = `${API_BASE_PATH}/documents`;
export const getDocumentDetailsUrl = `${API_BASE_PATH}/documents/`;
export const getDocumentTypesUrl = `${API_BASE_PATH}/documents/types`;
export const postDocumentUrl = `${API_BASE_PATH}/documents`;
export const processDocumentIdsUrl = `${API_BASE_PATH}/documents/validate`;
export const putDocumentUrl = documentId =>
  `${API_BASE_PATH}/documents/${documentId}`;

export const identifierTypesUrl = `${API_BASE_PATH}/documents/identifierTypes`;
export const subjectsUrl = `${API_BASE_PATH}/documents/subjects`;
export const subjectsSearchUrl = `${API_BASE_PATH}/documents/subjects/search/logical/or`;

// ===== Duplicates urls
export const createNewEntranceFromDuplicateUrl = id =>
  `${API_BASE_PATH}/entrances/from-duplicate/${id}`;
export const createNewDocumentFromDuplicateUrl = id =>
  `${API_BASE_PATH}/documents/from-duplicate/${id}`;

export const getDuplicatesDocumentUrl = `${API_BASE_PATH}/document-duplicates`;
export const getDuplicatesEntranceUrl = `${API_BASE_PATH}/entrance-duplicates`;
export const getDuplicateDocumentUrl = duplicateId =>
  `${API_BASE_PATH}/document-duplicates/${duplicateId}`;
export const getDuplicateEntranceUrl = duplicateId =>
  `${API_BASE_PATH}/entrance-duplicates/${duplicateId}`;

export const deleteDuplicatesDocumentUrl = `${API_BASE_PATH}/document-duplicates`;
export const deleteDuplicatesEntranceUrl = `${API_BASE_PATH}/entrance-duplicates`;
export const deleteDuplicateDocumentUrl = id =>
  `${API_BASE_PATH}/document-duplicates/${id}`;
export const deleteDuplicateEntranceUrl = id =>
  `${API_BASE_PATH}/entrance-duplicates/${id}`;

// ===== Entrances urls
export const getRandomEntranceUrl = `${API_BASE_PATH}/entrances/findRandom`;
export const getEntranceUrl = `${API_BASE_PATH}/entrances/`;
export const entranceDetailPath = `${API_BASE_PATH}/entrances/`;
export const postCreateEntranceUrl = `${API_BASE_PATH}/entrances`;
export const putEntranceUrl = entranceId =>
  `${API_BASE_PATH}/entrances/${entranceId}`;

// ===== Geoloc urls
export const getMapCavesUrl = `${API_BASE_PATH}/geoloc/caves`;
export const getMapCavesCoordinatesUrl = `${API_BASE_PATH}/geoloc/cavesCoordinates`;
export const getMapEntrancesUrl = `${API_BASE_PATH}/geoloc/entrances`;
export const getMapEntrancesCoordinatesUrl = `${API_BASE_PATH}/geoloc/entrancesCoordinates`;
export const getMapGrottosUrl = `${API_BASE_PATH}/geoloc/grottos`;

// ===== Histories urls
export const postHistoryUrl = `${API_BASE_PATH}/histories`;
export const putHistoryUrl = historyId =>
  `${API_BASE_PATH}/histories/${historyId}`;

// ===== Locations urls
export const postLocationUrl = `${API_BASE_PATH}/locations`;
export const putLocationUrl = locationId =>
  `${API_BASE_PATH}/locations/${locationId}`;

// ===== Snapshots urls
export const getSnapshotsUrl = (typeId, typeName, isNetwork) =>
  isNetwork
    ? `${API_BASE_PATH}/${typeName}/${typeId}/snapshots?isNetwork=${isNetwork}`
    : `${API_BASE_PATH}/${typeName}/${typeId}/snapshots`;

// ===== Massifs urls
export const getMassifUrl = `${API_BASE_PATH}/massifs/`;
export const postCreateMassifUrl = `${API_BASE_PATH}/massifs/`;
export const putMassifUrl = massifId => `${API_BASE_PATH}/massifs/${massifId}`;
export const getStatisticsMassifUrl = massifId =>
  `${API_BASE_PATH}/massifs/${massifId}/statistics`;

// ===== Notifications urls
export const countUnreadNotificationsUrl = `${API_URL}/api/${apiVersion}/notifications/unread/count`;
export const fetchNotificationsUrl = `${API_URL}/api/${apiVersion}/notifications`;
export const readNotificationUrl = notificationId =>
  `${API_URL}/api/${apiVersion}/notifications/${notificationId}/read`;

// ===== Organizations urls
export const getOrganizationUrl = `${API_BASE_PATH}/organizations/`;
export const postOrganizationUrl = `${API_BASE_PATH}/organizations`;
export const putOrganizationUrl = organizationId =>
  `${API_BASE_PATH}/organizations/${organizationId}`;

// ===== Persons / cavers urls
export const getAdminsUrl = `${API_BASE_PATH}/cavers/admins`;
export const getCaverUrl = `${API_BASE_PATH}/cavers/`;
export const getModeratorsUrl = `${API_BASE_PATH}/cavers/moderators`;
export const postPersonUrl = `${API_BASE_PATH}/cavers`;
export const postPersonGroupsUrl = userId =>
  `${API_BASE_PATH}/cavers/${userId}/groups`;
export const putCaverUrl = userId => `${API_BASE_PATH}/cavers/${userId}`;

// ===== RSS urls
export const frenchRssUrl = `${API_URL}/api/rss/FR`;
export const englishRssUrl = `${API_URL}/api/rss/EN`;

// ===== Search urls
export const advancedsearchUrl = `${API_BASE_PATH}/advanced-search`;
export const quicksearchUrl = `${API_BASE_PATH}/search`;

// ===== Subscriptions urls
export const getSubscriptionsUrl = caverId =>
  `${API_BASE_PATH}/cavers/${caverId}/subscriptions`;
export const subscribeToMassifUrl = massifId =>
  `${API_BASE_PATH}/massifs/${massifId}/subscribe`;
export const unsubscribeFromMassifUrl = massifId =>
  `${API_BASE_PATH}/massifs/${massifId}/unsubscribe`;
export const subscribeToCountryUrl = countryId =>
  `${API_BASE_PATH}/countries/${countryId}/subscribe`;
export const unsubscribeFromCountryUrl = countryId =>
  `${API_BASE_PATH}/countries/${countryId}/unsubscribe`;

// ===== ImportCSV urls
export const checkRowsEntrancesUrl = `${API_BASE_PATH}/entrances/check-rows`;
export const checkRowsDocumentsUrl = `${API_BASE_PATH}/documents/check-rows`;
export const importRowsEntrancesUrl = `${API_BASE_PATH}/entrances/import-rows`;
export const importRowsDocumentsUrl = `${API_BASE_PATH}/documents/import-rows`;

// ===== Misc urls
export const swaggerUrl = `${API_BASE_PATH}/swagger.yaml`;

export const getProjectionsUrl = `${API_URL}/api/convert`;
export const getForCarouselUrl = `${API_BASE_PATH}/partners/findForCarousel`;

export const getCaversDocumentsUrl = caverId =>
  `${API_BASE_PATH}/cavers/${caverId}/documents`;

export const getLanguagesUrl = `${API_BASE_PATH}/languages`;
export const regionsSearchUrl = `${API_BASE_PATH}/regions/search/logical/or`;
export const getLicensesUrl = `${API_BASE_PATH}/licenses`;
export const getFileFormatsUrl = `${API_BASE_PATH}/file-formats`;

export const putEntranceWithNewEntitiesUrl = entranceId =>
  `${API_BASE_PATH}/entrances/${entranceId}/new-entities`;
export const putDocumentyWithNewEntitiesUrl = docId =>
  `${API_BASE_PATH}/documents/${docId}/new-entities`;

export const patchNameUrl = id => `${API_BASE_PATH}/names/${id}`;
export const associateDocumentToEntranceUrl = (entranceId, documentId) =>
  `${API_BASE_PATH}/entrances/${entranceId}/documents/${documentId}`;
export const moveEntranceToCaveUrl = (entranceId, caveId) =>
  `${API_BASE_PATH}/entrances/${entranceId}/cave/${caveId}`;
