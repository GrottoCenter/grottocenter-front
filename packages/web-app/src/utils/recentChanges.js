export const getRecentChangeKey = change =>
  JSON.stringify([
    change.date,
    change.authorId,
    change.mainEntityType,
    change.mainEntityId,
    change.mainAction,
    change.subAction
  ]);
