import {
  render,
  screen,
  fireEvent,
  within,
  waitFor
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';

import grottoTheme from '../../../conf/grottoTheme';
import FileSelectorInput, { REJECTION_REASONS } from './index';

// Only the keys FileSelectorInput actually renders. Declaring them explicitly
// (instead of pulling in the full en.json) makes a typo in a formatMessage id
// fail loudly instead of silently missing.
const messages = {
  'Drop files here or click to select': 'Drop files here or click to select',
  'Drop a file here or click to select': 'Drop a file here or click to select',
  'Drag and drop files here': 'Drag and drop files here',
  'Drag and drop a file here': 'Drag and drop a file here',
  'Upload files': 'Upload files',
  'Upload a file': 'Upload a file',
  'Choose files': 'Choose files',
  'Choose a file': 'Choose a file',
  'fileSelector.open': 'Open',
  'fileSelector.acceptedFormats': 'Accepted formats',
  'fileSelector.addFile': 'Add a file',
  'fileSelector.addFiles': 'Add files',
  Remove: 'Remove',
  or: 'or'
};

const renderIn = ui =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <ThemeProvider theme={grottoTheme}>{ui}</ThemeProvider>
    </IntlProvider>
  );

const makeFile = (name, { type = 'text/plain', size = 10 } = {}) => {
  const file = new File(['a'.repeat(size)], name, { type });
  // File constructor in jsdom occasionally stamps size=0 for empty content;
  // stub it explicitly so maxSize checks read the right number.
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const createDataTransfer = files => ({
  dataTransfer: {
    files,
    items: files.map(file => ({
      kind: 'file',
      type: file.type,
      getAsFile: () => file
    })),
    types: ['Files']
  }
});

describe('FileSelectorInput', () => {
  afterEach(() => vi.restoreAllMocks());

  test('reveals long format lists on mobile without opening the file picker', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: query.includes('max-width'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {}
    }));
    const { container } = renderIn(
      <FileSelectorInput
        onFilesAdd={vi.fn()}
        accept={{
          'application/pdf': ['.pdf'],
          'application/zip': ['.zip'],
          'image/png': ['.png'],
          'image/jpeg': ['.jpg']
        }}
      />
    );
    const clickSpy = vi.spyOn(container.querySelector('input'), 'click');
    const toggle = screen.getByText('Accepted formats');
    const list = screen.getByText('.jpg, .pdf, .png, .zip');
    expect(list).not.toBeVisible();
    expect(screen.getByTestId('file-picker')).not.toContainElement(toggle);
    await userEvent.click(toggle);
    expect(list).toBeVisible();
    await userEvent.click(toggle);
    expect(list).not.toBeVisible();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  test('opens the file picker on click', async () => {
    const onFilesAdd = vi.fn();
    renderIn(
      <FileSelectorInput
        onFilesAdd={onFilesAdd}
        extensions={['.pdf', '.zip', '.png', '.jpg']}
      />
    );
    expect(screen.queryByText('Accepted formats')).not.toBeInTheDocument();
    expect(screen.getByText('.jpg, .pdf, .png, .zip')).toBeVisible();
    const dropzone = screen.getByRole('button', {
      name: /Drop files here or click to select/i
    });
    const input = dropzone.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click');
    await userEvent.click(dropzone);
    expect(clickSpy).toHaveBeenCalled();
  });

  test('opens the picker on Enter and Space via keyboard', () => {
    const onFilesAdd = vi.fn();
    renderIn(<FileSelectorInput onFilesAdd={onFilesAdd} />);
    const dropzone = screen.getByRole('button', {
      name: /Drop files here or click to select/i
    });
    const input = dropzone.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click');
    dropzone.focus();
    fireEvent.keyDown(dropzone, { key: 'Enter' });
    fireEvent.keyDown(dropzone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  test('does not open the picker or call onFilesAdd when disabled', async () => {
    const onFilesAdd = vi.fn();
    renderIn(<FileSelectorInput onFilesAdd={onFilesAdd} disabled />);
    const dropzone = screen.getByRole('button', {
      name: /Drop files here or click to select/i
    });
    const input = dropzone.querySelector('input[type="file"]');
    const clickSpy = vi.spyOn(input, 'click');
    await userEvent.click(dropzone);
    fireEvent.keyDown(dropzone, { key: 'Enter' });
    fireEvent.drop(
      dropzone,
      createDataTransfer([makeFile('ignored.txt', { type: 'text/plain' })])
    );
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(clickSpy).not.toHaveBeenCalled();
    expect(onFilesAdd).not.toHaveBeenCalled();
  });

  test('accepted files are passed to onFilesAdd on drop', async () => {
    const onFilesAdd = vi.fn();
    renderIn(
      <FileSelectorInput
        onFilesAdd={onFilesAdd}
        accept={{ 'text/plain': ['.txt'] }}
      />
    );
    const dropzone = screen.getByRole('button', {
      name: /Drop files here or click to select/i
    });
    const file = makeFile('hello.txt', { type: 'text/plain' });
    fireEvent.drop(dropzone, createDataTransfer([file]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(onFilesAdd).toHaveBeenCalledTimes(1);
    expect(onFilesAdd.mock.calls[0][0][0].name).toBe('hello.txt');
  });

  test('rejects files that exceed maxSize and normalizes the reason', async () => {
    const onFilesAdd = vi.fn();
    const onFileRejections = vi.fn();
    renderIn(
      <FileSelectorInput
        onFilesAdd={onFilesAdd}
        onFileRejections={onFileRejections}
        maxSize={5}
      />
    );
    const dropzone = screen.getByRole('button', {
      name: /Drop files here or click to select/i
    });
    const oversized = makeFile('big.txt', { type: 'text/plain', size: 100 });
    fireEvent.drop(dropzone, createDataTransfer([oversized]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(onFilesAdd).not.toHaveBeenCalled();
    expect(onFileRejections).toHaveBeenCalledTimes(1);
    const rejections = onFileRejections.mock.calls[0][0];
    expect(rejections[0].reasons).toContain(REJECTION_REASONS.TOO_LARGE);
    expect(rejections[0].fileName).toBe('big.txt');
  });

  test('rejects files whose type is not accepted', async () => {
    const onFilesAdd = vi.fn();
    const onFileRejections = vi.fn();
    renderIn(
      <FileSelectorInput
        onFilesAdd={onFilesAdd}
        onFileRejections={onFileRejections}
        accept={{ 'text/csv': ['.csv'] }}
      />
    );
    const dropzone = screen.getByRole('button', {
      name: /Drop files here or click to select/i
    });
    const wrongType = makeFile('doc.pdf', { type: 'application/pdf' });
    fireEvent.drop(dropzone, createDataTransfer([wrongType]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(onFilesAdd).not.toHaveBeenCalled();
    expect(onFileRejections).toHaveBeenCalledTimes(1);
    const rejections = onFileRejections.mock.calls[0][0];
    expect(rejections[0].reasons).toContain(
      REJECTION_REASONS.TYPE_NOT_ACCEPTED
    );
  });

  test('when multiple=false, dropping multiple files is fully rejected', async () => {
    const onFilesAdd = vi.fn();
    const onFileRejections = vi.fn();
    renderIn(
      <FileSelectorInput
        multiple={false}
        onFilesAdd={onFilesAdd}
        onFileRejections={onFileRejections}
      />
    );
    const dropzone = screen.getByRole('button', {
      name: /Drop a file here or click to select/i
    });
    const first = makeFile('a.txt', { type: 'text/plain' });
    const second = makeFile('b.txt', { type: 'text/plain' });
    fireEvent.drop(dropzone, createDataTransfer([first, second]));
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
    expect(onFilesAdd).not.toHaveBeenCalled();
    expect(onFileRejections).toHaveBeenCalled();
    const rejections = onFileRejections.mock.calls[0][0];
    expect(rejections).toHaveLength(2);
    expect(
      rejections.every(({ reasons }) =>
        reasons.includes(REJECTION_REASONS.TOO_MANY_FILES)
      )
    ).toBe(true);
  });

  test('rejects an oversized multi-file batch and preserves type errors', async () => {
    const onFilesAdd = vi.fn();
    const onFileRejections = vi.fn();
    renderIn(
      <FileSelectorInput
        onFilesAdd={onFilesAdd}
        onFileRejections={onFileRejections}
        maxFiles={2}
        accept={{ 'text/plain': ['.txt'] }}
      />
    );
    const validFiles = ['a.txt', 'b.txt', 'c.txt'].map(name => makeFile(name));
    const wrongType = makeFile('wrong.pdf', { type: 'application/pdf' });
    fireEvent.drop(
      screen.getByTestId('file-dropzone'),
      createDataTransfer([...validFiles, wrongType])
    );

    await waitFor(() => expect(onFileRejections).toHaveBeenCalledOnce());
    expect(onFilesAdd).not.toHaveBeenCalled();
    const rejections = onFileRejections.mock.calls[0][0];
    expect(rejections).toHaveLength(4);
    for (const file of validFiles) {
      expect(rejections).toContainEqual({
        file,
        fileName: file.name,
        reasons: [REJECTION_REASONS.TOO_MANY_FILES]
      });
    }
    expect(rejections).toContainEqual({
      file: wrongType,
      fileName: 'wrong.pdf',
      reasons: [REJECTION_REASONS.TYPE_NOT_ACCEPTED]
    });
  });

  test('accepts valid files from a mixed batch within the file limit', async () => {
    const onFilesAdd = vi.fn();
    const onFileRejections = vi.fn();
    renderIn(
      <FileSelectorInput
        onFilesAdd={onFilesAdd}
        onFileRejections={onFileRejections}
        maxFiles={2}
        accept={{ 'text/plain': ['.txt'] }}
      />
    );
    const validFile = makeFile('valid.txt');
    const wrongType = makeFile('wrong.pdf', { type: 'application/pdf' });
    fireEvent.drop(
      screen.getByTestId('file-dropzone'),
      createDataTransfer([validFile, wrongType])
    );

    await waitFor(() => expect(onFileRejections).toHaveBeenCalledOnce());
    expect(onFilesAdd).toHaveBeenCalledExactlyOnceWith([validFile]);
    expect(onFileRejections.mock.calls[0][0]).toEqual([
      {
        file: wrongType,
        fileName: 'wrong.pdf',
        reasons: [REJECTION_REASONS.TYPE_NOT_ACCEPTED]
      }
    ]);
  });

  test.each(['survey.th2', 'outline.geojson'])(
    'accepts %s by extension when the browser provides no MIME type',
    async fileName => {
      const onFilesAdd = vi.fn();
      renderIn(
        <FileSelectorInput onFilesAdd={onFilesAdd} accept=".th2,.geojson" />
      );
      const file = makeFile(fileName, { type: '' });
      fireEvent.drop(
        screen.getByTestId('file-dropzone'),
        createDataTransfer([file])
      );

      await waitFor(() =>
        expect(onFilesAdd).toHaveBeenCalledExactlyOnceWith([file])
      );
    }
  );

  test('lists files outside the drop zone and removes the named file', async () => {
    const onFilesAdd = vi.fn();
    const onFileRemove = vi.fn();
    renderIn(
      <FileSelectorInput
        onFilesAdd={onFilesAdd}
        onFileRemove={onFileRemove}
        files={[{ fileName: 'existing.txt' }]}
      />
    );
    expect(screen.getByText('existing.txt')).toBeInTheDocument();
    const dropzone = screen.getByTestId('file-dropzone');
    const row = screen.getByTestId('selected-file-existing.txt');
    expect(dropzone).not.toContainElement(row);
    const removeButton = screen.getByRole('button', {
      name: 'Remove existing.txt'
    });
    await userEvent.click(removeButton);
    expect(onFileRemove).toHaveBeenCalledWith('existing.txt');
  });

  test('opens existing files in a new tab and keeps actions out of the picker', async () => {
    renderIn(
      <FileSelectorInput
        onFilesAdd={vi.fn()}
        files={[
          {
            fileName: 'notes.pdf',
            completePath: 'https://example.org/notes.pdf'
          },
          {
            fileName: 'survey.pdf',
            completePath: 'https://example.org/survey.pdf'
          }
        ]}
        renderFileDetails={file => <span>Details for {file.fileName}</span>}
      />
    );
    const link = screen.getByRole('link', { name: 'Open notes.pdf' });
    expect(link).toHaveAttribute('href', 'https://example.org/notes.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      within(screen.getByTestId('selected-file-notes.pdf')).getByText(
        'Details for notes.pdf'
      )
    ).toBeVisible();
    const input = screen.getByTestId('file-dropzone').querySelector('input');
    const clickSpy = vi.spyOn(input, 'click');
    await userEvent.click(screen.getByText('Details for notes.pdf'));
    expect(clickSpy).not.toHaveBeenCalled();
  });

  test('keeps removal disabled while the selector is disabled', () => {
    const onFileRemove = vi.fn();
    renderIn(
      <FileSelectorInput
        disabled
        onFilesAdd={vi.fn()}
        onFileRemove={onFileRemove}
        files={[{ fileName: 'locked.pdf' }]}
      />
    );
    const remove = screen.getByRole('button', { name: 'Remove locked.pdf' });
    expect(remove).toBeDisabled();
    fireEvent.click(remove);
    expect(onFileRemove).not.toHaveBeenCalled();
  });

  test('shares the local preview URL with file details and releases it on removal', async () => {
    const createObjectURL = vi.fn(() => 'blob:local-preview');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal(
      'URL',
      new Proxy(URL, {
        get: (target, key) => {
          if (key === 'createObjectURL') return createObjectURL;
          if (key === 'revokeObjectURL') return revokeObjectURL;
          return Reflect.get(target, key);
        }
      })
    );
    try {
      const { unmount } = renderIn(
        <FileSelectorInput
          onFilesAdd={vi.fn()}
          files={[{ fileName: 'local.pdf', file: makeFile('local.pdf') }]}
          renderFileDetails={(_file, url) => <a href={url}>Test pagination</a>}
        />
      );
      expect(
        screen.getByRole('link', { name: 'Test pagination' })
      ).toHaveAttribute('href', 'blob:local-preview');
      await waitFor(() =>
        expect(
          screen.getByRole('link', { name: 'Open local.pdf' })
        ).toHaveAttribute('href', 'blob:local-preview')
      );
      expect(createObjectURL).toHaveBeenCalledTimes(1);
      unmount();
      expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-preview');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
