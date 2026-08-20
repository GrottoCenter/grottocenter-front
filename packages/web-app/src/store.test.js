import store from './store';
import {
  RESET_WIZARD,
  SET_FILE
} from './actions/Observations/importWizardTypes';

describe('store middleware', () => {
  afterEach(() => {
    store.dispatch({ type: RESET_WIZARD });
    vi.restoreAllMocks();
  });

  it('allows browser file metadata to change between wizard dispatches', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const file = new File(
      ['timestamp,value\n2026-08-13,1'],
      'observations.csv',
      {
        type: 'text/csv'
      }
    );
    store.dispatch({ type: SET_FILE, file });

    Object.defineProperty(file, 'lastModifiedDate', {
      configurable: true,
      value: new Date()
    });

    expect(() =>
      store.dispatch({ type: 'IMPORT_FILE_METADATA_UPDATED' })
    ).not.toThrow();
    expect(store.getState().importWizard.file).toBe(file);
    expect(consoleError).not.toHaveBeenCalled();
  });
});
