import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  documentKeys,
  organizationKeys,
  organizationManagementKeys,
  personKeys,
  quicksearchKeys,
  snapshotKeys,
  statsKeys
} from '@/api/queryKeys';
import { useDeleteOrganization } from '@/hooks';
import {
  auditOrganization,
  cleanupError,
  getOrganization,
  getPerson,
  makeJournal,
  sameId,
  transferDocument
} from './api';
import { readJournal, saveJournal, withConversionLock } from './journal';
import { requireSessionSnapshot } from './session';

export const useAuthorConversion = ({ accountId, onSaved, onDeleted }) => {
  const queryClient = useQueryClient();
  const deletion = useDeleteOrganization();
  const [progress, setProgress] = useState(null);
  const [blockers, setBlockers] = useState([]);
  const save = journal => {
    saveJournal(accountId, journal);
    onSaved(journal);
  };

  const mutation = useMutation({
    retry: false,
    networkMode: 'always',
    meta: { errorPresentation: 'inline' },
    mutationFn: ({ organizationId, target }) =>
      withConversionLock(accountId, async () => {
        setBlockers([]);
        const checkOnline = () => {
          if (!navigator.onLine) throw cleanupError('offline');
        };
        checkOnline();
        let journal = readJournal(accountId);
        if (journal?.stage === 'complete') journal = null;
        if (
          journal &&
          (!sameId(journal.organization.id, organizationId) ||
            !sameId(journal.target.id, target.id))
        ) {
          throw cleanupError('busy');
        }
        const person = await getPerson(target.id);
        if (
          !sameId(person?.id, target.id) ||
          !['AUTHOR', 'CAVER'].includes(person.type)
        ) {
          throw cleanupError('targetChanged');
        }

        // Recover a committed deletion whose response was lost. Never repeat a
        // DELETE against an already archived organization.
        const source = await getOrganization(organizationId);
        if (source.isDeleted && journal?.stage === 'archiving') {
          for (const entry of journal.documents) {
            // Reconcile reads sequentially before declaring the run complete.
            // eslint-disable-next-line no-await-in-loop
            await transferDocument({ ...entry, done: true });
          }
          const complete = { ...journal, stage: 'complete' };
          save(complete);
          return complete;
        }

        const audit = await auditOrganization(organizationId, {
          snapshot: requireSessionSnapshot(queryClient, accountId),
          onProgress: setProgress
        });
        if (audit.blockers.length) {
          setBlockers(audit.blockers);
          throw cleanupError('blocked');
        }
        if (!journal) {
          journal = makeJournal(audit.organization, person, audit.documents);
          save(journal);
        } else {
          const planned = new Set(
            journal.documents.map(entry => String(entry.id))
          );
          if (
            audit.documents.some(document => !planned.has(String(document.id)))
          ) {
            throw cleanupError('documentChanged');
          }
        }

        for (let index = 0; index < journal.documents.length; index += 1) {
          checkOnline();
          setProgress({
            phase: 'transferring',
            done: index,
            total: journal.documents.length,
            documentId: journal.documents[index].id
          });
          // Sequential so a failed/uncertain request stops all later writes.
          // eslint-disable-next-line no-await-in-loop
          await transferDocument(journal.documents[index]);
          journal = {
            ...journal,
            documents: journal.documents.map((entry, i) =>
              i === index ? { ...entry, done: true } : entry
            )
          };
          save(journal);
        }

        checkOnline();
        const finalAudit = await auditOrganization(organizationId, {
          snapshot: requireSessionSnapshot(queryClient, accountId),
          onProgress: setProgress
        });
        if (finalAudit.blockers.length) {
          setBlockers(finalAudit.blockers);
          throw cleanupError('blocked');
        }
        if (finalAudit.documents.length) throw cleanupError('documentChanged');
        // Recheck completed documents as well: a concurrent edit must not be
        // hidden by an empty organization counter or an old local checkpoint.
        for (const entry of journal.documents) {
          // Each verification is a read; done:true forbids another write.
          // eslint-disable-next-line no-await-in-loop
          await transferDocument({ ...entry, done: true });
        }
        checkOnline();
        setProgress({ phase: 'archiving', done: 0, total: 0 });
        journal = { ...journal, stage: 'archiving' };
        save(journal);
        await deletion.mutateAsync({ id: organizationId, isPermanent: false });
        const deleted = await getOrganization(organizationId);
        if (!deleted.isDeleted) throw cleanupError('organizationChanged');
        journal = { ...journal, stage: 'complete' };
        save(journal);
        return journal;
      }),
    onSuccess: journal => onDeleted(journal.organization.id),
    onSettled: () => {
      [
        documentKeys.all,
        organizationKeys.all,
        organizationManagementKeys.all,
        personKeys.all,
        quicksearchKeys.all,
        snapshotKeys.all,
        statsKeys.all
      ].forEach(queryKey => queryClient.invalidateQueries({ queryKey }));
    }
  });

  return { mutation, progress, blockers };
};
