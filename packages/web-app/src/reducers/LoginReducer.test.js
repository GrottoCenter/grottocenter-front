import { authTokenName } from '@/conf/config';

afterEach(() => {
  localStorage.clear();
  vi.resetModules();
});

it.each(['missing', 'valid', 'expired'])(
  'initializes authorization with a %s stored token',
  async state => {
    localStorage.clear();
    const decoded = {
      id: 1,
      exp: Math.floor(Date.now() / 1000) + (state === 'valid' ? 3600 : -3600)
    };
    const token = `header.${btoa(JSON.stringify(decoded))}.signature`;
    if (state !== 'missing') localStorage.setItem(authTokenName, token);
    const { default: reducer } = await import('./LoginReducer');
    const login = reducer(undefined, { type: '@@INIT' });
    expect(login.authorizationHeader).toEqual(
      state === 'valid' ? { Authorization: `Bearer ${token}` } : undefined
    );
    expect(login.authTokenDecoded).toEqual(state === 'valid' ? decoded : null);
    if (state === 'expired')
      expect(localStorage.getItem(authTokenName)).toBeNull();
  }
);
