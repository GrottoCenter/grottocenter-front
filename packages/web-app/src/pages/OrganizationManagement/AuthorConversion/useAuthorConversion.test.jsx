import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { apiGet, apiGetWithRange, apiPost, apiPut } from '@/api/client';
import { useDeleteOrganization } from '@/hooks';
import { useCleanupSession } from './useCleanupSession';
import { useAuthorConversion } from './useAuthorConversion';
import { makeDocument, makeOrganization, person } from './fixtures';
import { journalKey, readJournal, saveJournal } from './journal';
import { makeJournal } from './api';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiGetWithRange: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn()
}));
vi.mock('@/hooks', () => ({ useDeleteOrganization: vi.fn() }));

let documents;
let deleted;
let publishedCount;
const deletion = vi.fn();
const onDeleted = vi.fn();
const onSaved = vi.fn();

const Probe = ({ target = person }) => {
  const session = useCleanupSession(1);
  const { mutation, blockers } = useAuthorConversion({
    accountId: 1,
    onSaved,
    onDeleted
  });
  return (
    <>
      <button
        type="button"
        disabled={mutation.isPending || !session.isReady}
        onClick={() => mutation.mutate({ organizationId: 42, target })}>
        Convert
      </button>
      <p>{mutation.status}</p>
      <p>{mutation.error?.code ?? mutation.error?.message}</p>
      <p>{blockers.map(blocker => blocker.key).join(',')}</p>
    </>
  );
};

const renderProbe = (target = person) =>
  renderWithProviders(<Probe target={target} />);
const start = async () => {
  const button = screen.getByRole('button', { name: 'Convert' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  documents = [makeDocument(), makeDocument({ id: 102 })];
  deleted = false;
  publishedCount = 0;
  useDeleteOrganization.mockReturnValue({ mutateAsync: deletion });
  deletion.mockImplementation(async () => {
    deleted = true;
  });
  apiGet.mockImplementation(async url => {
    if (url.includes('/cavers/')) return person;
    if (url.includes('/organizations/')) {
      return makeOrganization({
        isDeleted: deleted,
        publishedCount,
        authoredCount: documents.filter(document =>
          document.authorsOrganization.some(
            author => String(author.id) === '42'
          )
        ).length
      });
    }
    return structuredClone(
      documents.find(document =>
        new URL(url, 'https://example.test').pathname.endsWith(
          `/${document.id}`
        )
      )
    );
  });
  apiGetWithRange.mockResolvedValue({
    data: { documents: [] },
    contentRange: null
  });
  apiPost.mockImplementation(async (_url, body) => {
    const matches = body.filter['library.name']
      ? []
      : documents.filter(document =>
          document.authorsOrganization.some(
            author => String(author.id) === '42'
          )
        );
    return { results: structuredClone(matches), totalResults: matches.length };
  });
  apiPut.mockImplementation(async (url, { document }) => {
    const index = documents.findIndex(entry => url.includes(`/${entry.id}/`));
    documents[index] = {
      ...documents[index],
      authors: document.authors.map(id => ({ id })),
      authorsOrganization: document.authorsOrganization.map(id => ({ id }))
    };
  });
});

it('archives only after all transfers and their final verification succeed', async () => {
  renderProbe();
  await start();
  await screen.findByText('success');
  expect(apiPut).toHaveBeenCalledTimes(2);
  expect(deletion).toHaveBeenCalledWith({ id: 42, isPermanent: false });
  expect(onDeleted).toHaveBeenCalledWith(42);
  expect(readJournal(1).stage).toBe('complete');
  expect(
    documents.every(document => document.authorsOrganization.length === 0)
  ).toBe(true);
});

it('stops on the first failure and resumes against the same person after a reload', async () => {
  const update = apiPut.getMockImplementation();
  apiPut.mockImplementation(async (url, body) => {
    if (url.includes('/102/')) throw new Error('Connection lost');
    return update(url, body);
  });
  const first = renderProbe();
  await start();
  await screen.findByText('error');
  expect(deletion).not.toHaveBeenCalled();
  expect(readJournal(1).documents.map(entry => entry.done)).toEqual([
    true,
    false
  ]);
  first.unmount();
  apiPut.mockImplementation(update);
  apiPut.mockClear();
  renderProbe();
  await start();
  await screen.findByText('success');
  expect(apiPut).toHaveBeenCalledTimes(1);
  expect(apiPut.mock.calls[0][0]).toContain('/102/');
  expect(deletion).toHaveBeenCalledTimes(1);
});

it('reconciles an applied transfer whose response failed before saving the checkpoint', async () => {
  const update = apiPut.getMockImplementation();
  apiPut.mockImplementationOnce(async (url, body) => {
    await update(url, body);
    throw new Error('Response lost');
  });
  renderProbe();
  await start();
  await screen.findByText('error');
  expect(readJournal(1).documents[0].done).toBe(false);
  apiPut.mockClear();
  await start();
  await screen.findByText('success');
  expect(apiPut).toHaveBeenCalledTimes(1);
  expect(apiPut.mock.calls[0][0]).toContain('/102/');
});

it('never deletes again after a committed archive with a lost response', async () => {
  deletion.mockImplementationOnce(async () => {
    deleted = true;
    throw new Error('Response lost');
  });
  renderProbe();
  await start();
  await screen.findByText('error');
  expect(readJournal(1).stage).toBe('archiving');
  await start();
  await screen.findByText('success');
  expect(deletion).toHaveBeenCalledTimes(1);
});

it.each([false, true])(
  'resumes 111 completed transfers without searching homonyms (concurrent edit: %s)',
  async hasConcurrentEdit => {
    documents = Array.from({ length: 111 }, (_, index) =>
      makeDocument({ id: index + 1 })
    );
    const journal = makeJournal(
      makeOrganization({ name: 'AA' }),
      person,
      documents
    );
    saveJournal(1, {
      ...journal,
      documents: journal.documents.map(entry => ({ ...entry, done: true }))
    });
    documents = documents.map(document => ({
      ...document,
      authors: [...document.authors, { id: person.id }],
      authorsOrganization: []
    }));
    if (hasConcurrentEdit) documents[110].authors.push({ id: 999 });
    apiPost.mockImplementation(async (_url, body) => {
      if (body.filter['authorsOrganization.name']) {
        throw new Error('Would load 2413 documents belonging to another AA');
      }
      return { results: [], totalResults: 0 };
    });
    renderProbe();
    await start();
    if (hasConcurrentEdit) {
      await screen.findByText('organizationConversion.documentChanged');
      expect(deletion).not.toHaveBeenCalled();
      expect(readJournal(1).stage).toBe('transferring');
    } else {
      await screen.findByText('success');
      expect(deletion).toHaveBeenCalledTimes(1);
      expect(readJournal(1).stage).toBe('complete');
    }
    expect(apiPut).not.toHaveBeenCalled();
    expect(
      apiPost.mock.calls.every(([, body]) => body.filter['library.name'])
    ).toBe(true);
  }
);

it('blocks changing the target after a conversion has started', async () => {
  saveJournal(1, makeJournal(makeOrganization(), person, documents));
  renderProbe({ ...person, id: 99 });
  await start();
  await screen.findByText('organizationConversion.busy');
  expect(apiPut).not.toHaveBeenCalled();
  expect(deletion).not.toHaveBeenCalled();
});

it('stops before any write if the checkpoint cannot be persisted', async () => {
  const storage = vi
    .spyOn(Storage.prototype, 'setItem')
    .mockImplementation(() => {
      throw new Error('Quota exceeded');
    });
  renderProbe();
  await start();
  await screen.findByText('organizationConversion.storageError');
  expect(apiPut).not.toHaveBeenCalled();
  expect(deletion).not.toHaveBeenCalled();
  storage.mockRestore();
});

it('blocks archiving if a new dependency appears after transferring the documents', async () => {
  const update = apiPut.getMockImplementation();
  apiPut.mockImplementation(async (url, body) => {
    await update(url, body);
    publishedCount = 1;
  });
  renderProbe();
  await start();
  await screen.findByText('organizationConversion.blocked');
  expect(deletion).not.toHaveBeenCalled();
});

it('does not silently replace a corrupt checkpoint', async () => {
  localStorage.setItem(journalKey(1), '{broken');
  renderProbe();
  await start();
  await screen.findByText('organizationConversion.storageError');
  expect(apiPut).not.toHaveBeenCalled();
});

it('isolates checkpoints between moderator accounts', () => {
  saveJournal(1, makeJournal(makeOrganization(), person, documents));
  expect(readJournal(2)).toBeNull();
});

it('rejects a target which disappeared before resuming', async () => {
  apiGet.mockImplementationOnce(async () => null);
  renderProbe();
  await start();
  await waitFor(() =>
    expect(
      screen.getByText('organizationConversion.targetChanged')
    ).toBeVisible()
  );
  expect(apiPut).not.toHaveBeenCalled();
});
