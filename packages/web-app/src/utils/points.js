export const getPointLocationMessageId = underground => {
  if (underground === true) return 'points.underground';
  if (underground === false) return 'points.surface';
  return 'Unknown';
};
