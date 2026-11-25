import { validate, version } from 'uuid';
import { getSessionTraceId, renewSessionTraceId } from './sessionTraceId';

it('creates a stable UUIDv7 immediately and replaces it on renewal', () => {
  const first = getSessionTraceId();
  expect(validate(first)).toBe(true);
  expect(version(first)).toBe(7);
  expect(getSessionTraceId()).toBe(first);
  renewSessionTraceId();
  const second = getSessionTraceId();
  expect(second).not.toBe(first);
  expect(validate(second)).toBe(true);
  expect(version(second)).toBe(7);
});

it('starts a fresh id on a new module load without using browser storage', async () => {
  const readStorage = vi.spyOn(Storage.prototype, 'getItem');
  const writeStorage = vi.spyOn(Storage.prototype, 'setItem');
  try {
    const first = getSessionTraceId();
    vi.resetModules();
    const reloaded = await import('./sessionTraceId');
    expect(reloaded.getSessionTraceId()).not.toBe(first);
    reloaded.renewSessionTraceId();
    expect(readStorage).not.toHaveBeenCalled();
    expect(writeStorage).not.toHaveBeenCalled();
  } finally {
    vi.restoreAllMocks();
  }
});
