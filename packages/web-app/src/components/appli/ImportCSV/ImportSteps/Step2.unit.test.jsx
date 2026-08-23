import {
  act,
  render,
  screen,
  fireEvent,
  waitFor
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@mui/material/styles';
import { vi } from 'vitest';

import grottoTheme from '../../../../conf/grottoTheme';
import messages from '../../../../../public/lang/en.json';
import Step2 from './Step2';
import { ImportPageContentContext } from '../Provider';
import { ENTRANCE } from '../constants';

const makeCtx = overrides => ({
  updateAttribute: vi.fn(),
  selectedType: ENTRANCE,
  importSession: { reset: vi.fn() },
  ...overrides
});

const renderStep = ctx =>
  render(
    <IntlProvider
      locale="en"
      messages={messages}
      onError={err => {
        if (err.code !== 'MISSING_TRANSLATION') throw err;
      }}>
      <ThemeProvider theme={grottoTheme}>
        <ImportPageContentContext.Provider value={ctx}>
          <Step2 />
        </ImportPageContentContext.Provider>
      </ThemeProvider>
    </IntlProvider>
  );

const makeCsvFile = (name, content) => {
  const file = new File([content], name, { type: 'text/csv' });
  Object.defineProperty(file, 'size', { value: content.length });
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

// A valid entrance CSV — every column checkData enforces for ENTRANCE is
// present and the karstlink type matches so no row errors are produced.
const VALID_CSV =
  'id,rdf:type,dct:rights/cc:attributionName,dct:rights/karstlink:licenseType,gn:countryCode,w3geo:latitude,w3geo:longitude\n' +
  'test-1,karstlink:UndergroundCavity,someone,CC-BY-SA,FR,44.0,3.0\n';

describe('Step2 (CSV import)', () => {
  test('parses a valid CSV and stores the rows on the context', async () => {
    const ctx = makeCtx();
    renderStep(ctx);
    const dropzone = screen.getByRole('button', {
      name: /Drop a file here or click to select/i
    });
    const file = makeCsvFile('good.csv', VALID_CSV);
    fireEvent.drop(dropzone, createDataTransfer([file]));

    await waitFor(() => {
      expect(ctx.updateAttribute).toHaveBeenCalledWith('fileImported', true);
    });
    const importDataCalls = ctx.updateAttribute.mock.calls.filter(
      call => call[0] === 'importData' && Array.isArray(call[1])
    );
    expect(importDataCalls.length).toBeGreaterThan(0);
    expect(importDataCalls[0][1][0].id).toBe('test-1');
    expect(screen.getByText('good.csv')).toBeInTheDocument();
  });

  test('rejects a non-CSV file with a translated message', async () => {
    const ctx = makeCtx();
    renderStep(ctx);
    const dropzone = screen.getByRole('button', {
      name: /Drop a file here or click to select/i
    });
    const notCsv = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(notCsv, 'size', { value: 100 });
    fireEvent.drop(dropzone, createDataTransfer([notCsv]));

    await waitFor(() => {
      expect(
        screen.getByText('Only CSV files are accepted.')
      ).toBeInTheDocument();
    });
    expect(ctx.updateAttribute).not.toHaveBeenCalledWith('fileImported', true);
  });

  test('clears previous row errors when a replacement file is rejected', async () => {
    const ctx = makeCtx();
    renderStep(ctx);
    const dropzone = screen.getByRole('button', {
      name: /Drop a file here or click to select/i
    });
    const badCsv = makeCsvFile('bad.csv', 'id\nfoo\n');
    fireEvent.drop(dropzone, createDataTransfer([badCsv]));

    await waitFor(() => {
      expect(screen.getAllByText(/^Row /).length).toBeGreaterThan(0);
    });

    const notCsv = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    fireEvent.drop(dropzone, createDataTransfer([notCsv]));

    await waitFor(() => {
      expect(screen.queryByText(/^Row /)).not.toBeInTheDocument();
    });
    expect(
      screen.getByText('Only CSV files are accepted.')
    ).toBeInTheDocument();
  });

  test('ignores an obsolete file read when a newer file finishes first', async () => {
    const ctx = makeCtx();
    renderStep(ctx);
    const dropzone = screen.getByRole('button', {
      name: /Drop a file here or click to select/i
    });
    let resolveFirstRead;
    const first = makeCsvFile('first.csv', VALID_CSV);
    first.text = vi.fn(
      () =>
        new Promise(resolve => {
          resolveFirstRead = resolve;
        })
    );
    const second = makeCsvFile(
      'second.csv',
      VALID_CSV.replace('test-1', 'test-2')
    );

    fireEvent.drop(dropzone, createDataTransfer([first]));
    fireEvent.drop(dropzone, createDataTransfer([second]));

    await waitFor(() => {
      expect(screen.getByText('second.csv')).toBeInTheDocument();
    });
    await act(async () => {
      resolveFirstRead(VALID_CSV);
      await Promise.resolve();
    });
    expect(screen.queryByText('first.csv')).not.toBeInTheDocument();
    const importedRows = ctx.updateAttribute.mock.calls
      .filter(call => call[0] === 'importData' && Array.isArray(call[1]))
      .map(call => call[1][0].id);
    expect(importedRows).toEqual(['test-2']);
  });

  test('shows row errors and does not mark the step as imported when the CSV has missing columns', async () => {
    const ctx = makeCtx();
    renderStep(ctx);
    const dropzone = screen.getByRole('button', {
      name: /Drop a file here or click to select/i
    });
    // Missing required columns — checkData will surface errors and
    // fileImported must stay false.
    const badCsv = makeCsvFile('bad.csv', 'id\nfoo\n');
    fireEvent.drop(dropzone, createDataTransfer([badCsv]));

    await waitFor(() => {
      expect(screen.getByText('bad.csv')).toBeInTheDocument();
    });
    const importedTrueCalls = ctx.updateAttribute.mock.calls.filter(
      call => call[0] === 'fileImported' && call[1] === true
    );
    expect(importedTrueCalls).toHaveLength(0);
  });

  test('removing the file clears the imported state', async () => {
    const ctx = makeCtx();
    renderStep(ctx);
    const dropzone = screen.getByRole('button', {
      name: /Drop a file here or click to select/i
    });
    const file = makeCsvFile('good.csv', VALID_CSV);
    fireEvent.drop(dropzone, createDataTransfer([file]));

    await waitFor(() =>
      expect(screen.getByText('good.csv')).toBeInTheDocument()
    );
    ctx.updateAttribute.mockClear();
    ctx.importSession.reset.mockClear();

    const chip = screen.getByText('good.csv').closest('.MuiChip-root');
    const removeIcon = chip.querySelector('svg[data-testid="CancelIcon"]');
    await userEvent.click(removeIcon);

    expect(ctx.updateAttribute).toHaveBeenCalledWith('importData', undefined);
    expect(ctx.updateAttribute).toHaveBeenCalledWith('fileImported', false);
    expect(ctx.importSession.reset).toHaveBeenCalledOnce();
  });
});
