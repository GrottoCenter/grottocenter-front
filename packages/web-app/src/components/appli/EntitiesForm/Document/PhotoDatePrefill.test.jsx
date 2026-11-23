import { useContext } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

import { readPhotoDate } from '@/utils/photoDate';
import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentFormProvider, { DocumentFormContext } from './Provider';
import { IS_INTACT, IS_NEW } from './formElements/AddFileForm/FileHelpers';

vi.mock('@/utils/photoDate', () => ({ readPhotoDate: vi.fn() }));
vi.mock('./useParentDocumentSelection', () => ({ default: () => vi.fn() }));

let context;
const FormState = () => {
  context = useContext(DocumentFormContext);
  return <output data-testid="date">{context.document.datePublication}</output>;
};

const photo = name => ({
  file: new File(['image'], name),
  fileName: name,
  state: IS_NEW
});

const renderForm = overrides =>
  render(
    <DocumentFormProvider
      initialValues={{ type: DocumentTypes.IMAGE, ...overrides }}>
      <FormState />
    </DocumentFormProvider>
  );

const setFiles = files => act(() => context.updateAttribute('files', files));
const setDate = date =>
  act(() => context.updateAttribute('datePublication', date));
const expectDate = date =>
  waitFor(() => expect(context.document.datePublication).toBe(date));

beforeEach(() => {
  vi.clearAllMocks();
  readPhotoDate.mockResolvedValue('2012-02-29');
});

it('prefills an empty date when a new photo is attached', async () => {
  renderForm();
  setFiles([photo('capture.jpg')]);
  await expectDate('2012-02-29');
});

it.each(['2010', '2010-04', '2010-04-15'])(
  'preserves an existing or prefilled date with any precision: %s',
  async datePublication => {
    renderForm({ datePublication });
    setFiles([photo('capture.jpg')]);
    expect(screen.getByTestId('date')).toHaveTextContent(datePublication);
    expect(readPhotoDate).not.toHaveBeenCalled();
  }
);

it('uses the first usable capture date in attachment order', async () => {
  let resolveFirst;
  readPhotoDate
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFirst = resolve;
        })
    )
    .mockResolvedValueOnce('2011-06-20');
  renderForm();
  const first = photo('without-date.jpg');
  const second = photo('dated.jpg');
  setFiles([first]);
  // A second upload must not beat the first upload's still-running extraction.
  setFiles([first, second]);
  expect(readPhotoDate).toHaveBeenCalledTimes(1);
  await act(async () => resolveFirst(null));
  await expectDate('2011-06-20');
  expect(readPhotoDate.mock.calls.map(([file]) => file.name)).toEqual([
    'without-date.jpg',
    'dated.jpg'
  ]);
});

it('does not overwrite an automatic prefill when another image is added', async () => {
  renderForm();
  const first = photo('first.jpg');
  setFiles([first]);
  await expectDate('2012-02-29');
  setFiles([first, photo('second.jpg')]);
  expect(readPhotoDate).toHaveBeenCalledTimes(1);
  await expectDate('2012-02-29');
});

it.each(['2018-07-10', ''])(
  'preserves an explicit date edit while extraction is pending: %j',
  async date => {
    let resolve;
    readPhotoDate.mockImplementation(
      () =>
        new Promise(done => {
          resolve = done;
        })
    );
    renderForm();
    const file = photo('capture.jpg');
    setFiles([file]);
    setDate(date);
    await act(async () => resolve('2012-02-29'));
    await expectDate(date);
    setFiles([file, photo('later.jpg')]);
    expect(readPhotoDate).toHaveBeenCalledTimes(1);
    await expectDate(date);
  }
);

it('lets the contributor clear an automatic prefill without reinjecting it', async () => {
  renderForm();
  const file = photo('capture.jpg');
  setFiles([file]);
  await expectDate('2012-02-29');
  setDate('');
  setFiles([file, photo('later.jpg')]);
  await expectDate('');
  expect(readPhotoDate).toHaveBeenCalledTimes(1);
});

it('ignores a late result from a removed image', async () => {
  let resolve;
  readPhotoDate.mockImplementation(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  renderForm();
  setFiles([photo('capture.jpg')]);
  setFiles([]);
  await act(async () => resolve('2012-02-29'));
  await expectDate('');
});

it('does not use a late result after the document type changes', async () => {
  let resolve;
  readPhotoDate.mockImplementation(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  renderForm();
  setFiles([photo('capture.jpg')]);
  act(() => context.updateAttribute('type', DocumentTypes.EVENT));
  await act(async () => resolve('2012-02-29'));
  await expectDate('');
});

it('discards old results on reset and enables prefill for the next document', async () => {
  let resolve;
  readPhotoDate.mockImplementationOnce(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  renderForm();
  setFiles([photo('old.jpg')]);
  setDate('2010');
  act(() => context.resetContext({ type: DocumentTypes.IMAGE }));
  await act(async () => resolve('2011-06-20'));
  await expectDate('');
  setFiles([photo('new.jpg')]);
  await expectDate('2012-02-29');
});

it('does not reread metadata after unrelated metadata or attachment edits', async () => {
  let resolve;
  readPhotoDate.mockImplementation(
    () =>
      new Promise(done => {
        resolve = done;
      })
  );
  renderForm();
  const file = photo('capture.jpg');
  setFiles([file]);
  act(() => context.updateAttribute('title', 'A better title'));
  setFiles([{ ...file, isPanorama: true }]);
  await act(async () => resolve('2012-02-29'));
  await expectDate('2012-02-29');
  expect(readPhotoDate).toHaveBeenCalledTimes(1);
});

it('does not read existing hosted attachments', () => {
  renderForm({
    files: [
      { state: IS_INTACT, fileName: 'hosted.jpg', completePath: '/hosted.jpg' }
    ]
  });
  expect(readPhotoDate).not.toHaveBeenCalled();
});

it('leaves the field empty when metadata has no usable date', async () => {
  readPhotoDate.mockResolvedValue(null);
  renderForm();
  await act(async () => setFiles([photo('without-date.jpg')]));
  await expectDate('');
});

it.each([
  DocumentTypes.UNKNOWN,
  DocumentTypes.COLLECTION,
  DocumentTypes.EVENT,
  DocumentTypes.AUTHORIZATION_TO_PUBLISH
])('does not infer a publication date for %s', type => {
  renderForm({ type });
  setFiles([photo('capture.jpg')]);
  expect(readPhotoDate).not.toHaveBeenCalled();
});
