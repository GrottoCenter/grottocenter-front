import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';

import grottoTheme from '../../../conf/grottoTheme';
import messages from '../../../../public/lang/en.json';
import FileSelectorInput, { REJECTION_REASONS } from './index';

const renderIn = ui =>
  render(
    <IntlProvider
      locale="en"
      messages={messages}
      onError={err => {
        if (err.code !== 'MISSING_TRANSLATION') throw err;
      }}>
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
  test('opens the file picker on click', async () => {
    const onFilesAdd = vi.fn();
    renderIn(<FileSelectorInput onFilesAdd={onFilesAdd} />);
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

  test('renders one chip per file and calls onFileRemove when a chip is deleted', async () => {
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
    const removeButton = screen.getByTestId('CancelIcon').closest('svg');
    await userEvent.click(removeButton);
    expect(onFileRemove).toHaveBeenCalledWith('existing.txt');
  });
});
