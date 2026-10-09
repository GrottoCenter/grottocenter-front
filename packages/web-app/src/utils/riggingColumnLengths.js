import { TEXT_LENGTH_LIMITS } from './textLengthLimits';

export const RIGGING_COLUMNS = ['obstacle', 'rope', 'anchor', 'observation'];
const RIGGING_SEPARATOR_LENGTH = '|;|'.length;

export const getRiggingColumnLengths = (rows = []) =>
  Object.fromEntries(
    RIGGING_COLUMNS.map(column => [
      column,
      rows.reduce((total, row) => total + (row?.[column]?.length ?? 0), 0) +
        Math.max(rows.length - 1, 0) * RIGGING_SEPARATOR_LENGTH
    ])
  );

export const hasOversizedRiggingColumn = lengths =>
  RIGGING_COLUMNS.some(
    column => lengths[column] > TEXT_LENGTH_LIMITS.RIGGING_COLUMN
  );
