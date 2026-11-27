import { API_URL } from '@/conf/apiRoutes';
import { cleanupError, sameId } from './api';

export const journalKey = accountId =>
  `organizationManagement.authorConversion:${API_URL}:${accountId}`;

export const readJournal = accountId => {
  try {
    const raw = localStorage.getItem(journalKey(accountId));
    if (!raw) return null;
    const journal = JSON.parse(raw);
    if (
      journal.version !== 1 ||
      !journal.organization?.id ||
      !journal.target?.id ||
      !['transferring', 'archiving', 'complete'].includes(journal.stage) ||
      !Array.isArray(journal.documents) ||
      !journal.documents.every(
        entry =>
          entry.id &&
          typeof entry.done === 'boolean' &&
          ['before', 'after'].every(key =>
            ['authors', 'authorsOrganization'].every(field =>
              Array.isArray(entry[key]?.[field])
            )
          )
      )
    ) {
      throw cleanupError('storageError');
    }
    return journal;
  } catch {
    throw cleanupError('storageError');
  }
};

export const saveJournal = (accountId, journal) => {
  try {
    const current = readJournal(accountId);
    if (
      current &&
      current.stage !== 'complete' &&
      (!sameId(current.organization.id, journal.organization.id) ||
        !sameId(current.target.id, journal.target.id))
    ) {
      throw cleanupError('busy');
    }
    localStorage.setItem(journalKey(accountId), JSON.stringify(journal));
  } catch (error) {
    if (error.code === 'organizationConversion.busy') throw error;
    throw cleanupError('storageError');
  }
};

export const withConversionLock = (accountId, callback) => {
  if (!navigator.locks) return callback();
  return navigator.locks.request(
    journalKey(accountId),
    { ifAvailable: true },
    lock => {
      if (!lock) throw cleanupError('busy');
      return callback();
    }
  );
};
