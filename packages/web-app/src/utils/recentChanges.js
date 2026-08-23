export const getRecentChangeKey = change =>
  [
    change.date,
    change.authorId,
    change.mainEntityType,
    change.mainEntityId,
    change.mainAction,
    change.subAction
  ].join('-');
