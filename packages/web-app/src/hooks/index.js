export {
  useCoordinatePreference,
  getCRSLabel,
  WGS84_DD,
  DMS_CODE
} from './useCoordinatePreference';
export { default as useProjections } from './queries/useProjections';
export {
  useAccount,
  useNotificationPreferences,
  useUpdateNotificationPreferences
} from './queries/useAccount';
export { useDebounce } from './useDebounce';
export { useBoolean } from './useBoolean';
export { useAuthNavigate } from './useAuthNavigate';
// Server-state reads live in ./queries and are re-exported here so consumers
// keep one import path — see docs/adr/0001-tanstack-query-server-state.md.
export { useFileFormats } from './queries/useFileFormats';
export { useLicenses, findLicenseByName } from './queries/useLicenses';
export { useDocumentTypes } from './queries/useDocumentTypes';
export { useIdentifierTypes } from './queries/useIdentifierTypes';
export { useSubjects } from './queries/useSubjects';
export { useLanguages } from './queries/useLanguages';
export { useDocument } from './queries/useDocument';
export { useDocumentChildren } from './queries/useDocumentChildren';
export { useDocuments } from './queries/useDocuments';
export {
  useAdvancedSearch,
  startAdvancedSearch,
  refineAdvancedSearch,
  resetAdvancedSearch
} from './queries/useAdvancedSearch';
export { useQuickSearch } from './queries/useQuickSearch';
export { useRegionsSearch } from './queries/useRegionsSearch';
export {
  useDuplicatesList,
  useDuplicate,
  useDeleteDuplicates,
  useDeleteDuplicate,
  useCreateEntityFromDuplicate
} from './queries/useDuplicates';
export {
  useCreateDocument,
  useUpdateDocument,
  useUpdateDocumentWithNewEntities
} from './mutations/useDocumentForm';
export {
  useBanCaver,
  useUnbanCaver,
  useUpdateAccount,
  useMoveEntranceToCave,
  useDetachEntranceToNewCave
} from './mutations/useAdminActions';
export {
  useChangePassword,
  useSignUp,
  useVerifyEmail,
  useForgotPassword,
  useResendVerificationEmail
} from './mutations/useAuthFlows';
export {
  useMfaEnroll,
  useMfaVerify,
  useMfaLogin,
  useMfaReset
} from './mutations/useMfa';
export { useMassif } from './queries/useMassif';
export { useCave } from './queries/useCave';
export { useEntrance } from './queries/useEntrance';
// Server-state writes live in ./mutations, same convention.
export { useDeleteDocument } from './mutations/useDeleteDocument';
export { useRestoreDocument } from './mutations/useRestoreDocument';
export { useDeleteMassif } from './mutations/useDeleteMassif';
export { useRestoreMassif } from './mutations/useRestoreMassif';
export {
  useLinkDocumentToMassif,
  useLinkDocumentsToMassif,
  useUnlinkDocumentToMassif
} from './mutations/useLinkDocumentToMassif';
export { useDeleteCave } from './mutations/useDeleteCave';
export { useRestoreCave } from './mutations/useRestoreCave';
export { useDeleteEntrance } from './mutations/useDeleteEntrance';
export { useRestoreEntrance } from './mutations/useRestoreEntrance';
export {
  useLinkDocumentToEntrance,
  useLinkDocumentsToEntrance,
  useUnlinkDocumentToEntrance
} from './mutations/useLinkDocumentToEntrance';
export {
  useCreateDescription,
  useUpdateDescription,
  useDeleteDescription,
  useRestoreDescription,
  useMoveDescriptionRelevance
} from './mutations/useDescription';
export {
  usePostGuideline,
  usePatchGuideline,
  useDeleteGuideline,
  useRestoreGuideline,
  useRollbackGuideline
} from './mutations/useGuideline';
export {
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useRestoreLocation,
  useMoveLocationRelevance
} from './mutations/useLocation';
export {
  useCreateHistory,
  useUpdateHistory,
  useDeleteHistory,
  useRestoreHistory,
  useMoveHistoryRelevance
} from './mutations/useHistory';
export {
  useCreateRigging,
  useUpdateRigging,
  useDeleteRigging,
  useRestoreRigging,
  useMoveRiggingRelevance
} from './mutations/useRigging';
export {
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useRestoreComment,
  useMoveCommentRelevance
} from './mutations/useComment';
export {
  useCreateEntrance,
  useUpdateEntrance,
  useUpdateEntranceWithNewEntities
} from './mutations/useEntranceForm';
export {
  useCreateCave,
  useUpdateCave,
  useCreateCaveAndEntrance,
  useUpdateCaveAndEntrance
} from './mutations/useCaveForm';
export {
  useCreateMassif,
  useUpdateMassif,
  useMarkMassifSensitive,
  useSetMassifSensitiveLock,
  useUnmarkMassifSensitive
} from './mutations/useMassifForm';
export { useUpdateName } from './mutations/useUpdateName';
export { usePerson } from './queries/usePerson';
export {
  useCreatePerson,
  useUpdatePerson,
  useDeletePerson,
  useUpdatePersonGroups
} from './mutations/usePerson';
export { useOrganization } from './queries/useOrganization';
export { useCountry } from './queries/useCountry';
export { useRegion } from './queries/useRegion';
export { useSnapshots } from './queries/useSnapshots';
export {
  useNotifications,
  useMenuNotifications
} from './queries/useNotifications';
export { useGuidelines } from './queries/useGuidelines';
export {
  useUnreadNotificationsCount,
  usePendingDocumentsCount,
  useDuplicatesCount
} from './queries/useCounts';
export {
  useReadNotification,
  useReadAllNotifications
} from './mutations/useNotifications';
export {
  useSubscribeToCountry,
  useUnsubscribeFromCountry,
  useSubscribeToRegion,
  useUnsubscribeFromRegion,
  useSubscribeToMassif,
  useUnsubscribeFromMassif
} from './mutations/useSubscriptions';
export {
  useConversations,
  useConversationMessages,
  useUnreadMessageCount
} from './queries/useMessages';
export {
  useArchiveConversation,
  useUnarchiveConversation,
  useSendMessage
} from './mutations/useMessages';
export {
  useSubstanceSearch,
  useCreateSubstance
} from './queries/useSubstances';
export { usePreviewSensitiveMassif } from './queries/usePreviewSensitiveMassif';
export {
  useLinkExploredEntrance,
  useUnlinkExploredEntrance
} from './mutations/useExploredEntrance';
export { useDbExport } from './queries/useDbExport';
export { useProcessDocuments } from './mutations/useProcessDocuments';
export { useImportCsvSession } from './useImportCsvSession';
export {
  useRandomEntrance,
  useRecentChanges,
  useRecentChangesFeed,
  usePartnersCarousel,
  useLatestBlogNews
} from './queries/useHomepageLists';
export {
  useGroups,
  useBannedCavers,
  useInvalidEmailCavers
} from './queries/useAdminLists';
export {
  useDynamicNumber,
  useCumulatedLength,
  useStatisticsCountry,
  useStatisticsRegion,
  useStatisticsMassif
} from './queries/useStats';
export {
  useCreateOrganization,
  useUpdateOrganization
} from './mutations/useOrganizationForm';
export {
  useDeleteOrganization,
  useRestoreOrganization,
  useJoinOrganization,
  useLeaveOrganization,
  useLinkCaveToOrganization,
  useUnlinkCaveFromOrganization
} from './mutations/useOrganization';
export {
  useSetCountryOrganization,
  useRemoveCountryOrganization,
  useSetRegionOrganization,
  useRemoveRegionOrganization,
  useSetMassifOrganization,
  useRemoveMassifOrganization
} from './mutations/useOrganizationAssociation';
export { useNotification } from './useNotification';
export { usePermissions } from './usePermissions';
export { useSessionExpiry } from './useSessionExpiry';
export { useSubscriptions } from './useSubscriptions';
export { useUserProperties } from './useUserProperties';
export { useMoveRelevanceWithUndo } from './useMoveRelevanceWithUndo';
export { useAnchorScroll } from './useAnchorScroll';
export { useScrollToHashOnLoad } from './useScrollToHashOnLoad';
export { useExplored } from './useExplored';
export { default as useSharePage } from './useSharePage';
export { default as useOpenLink } from './useOpenLink';
export { useOpenBi } from './useOpenBi';
export { useNameDuplicateSuggestions } from './useNameDuplicateSuggestions';
export { useNearbyEntrances } from './useNearbyEntrances';
export { useEntitySearch } from './useEntitySearch';
export { useOtherEntranceName } from './useOtherEntranceName';
export { default as useDeviceOrientation } from './useDeviceOrientation';
export { useMeasuredHeight } from './useMeasuredHeight';
export { useMeasuredWidth } from './useMeasuredWidth';
export { useLongPress } from './useLongPress';
export { useOnlineStatus } from './useOnlineStatus';
// Non-RQ reconnect paths: map viewport, intl catalogue and Leaflet tile redraw.
export { useRefetchOnReconnect } from './useRefetchOnReconnect';
export { useIsDesktopLayout } from './useIsDesktopLayout';
export { useSideMenuOffset } from './useSideMenuOffset';
export { useCanPromoteApp } from './useCanPromoteApp';
