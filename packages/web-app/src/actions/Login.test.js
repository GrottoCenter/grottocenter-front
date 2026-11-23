// @vitest-environment node

import { postLogout, LOGOUT } from './Login';

describe('postLogout', () => {
  let dispatch;
  let assignedHref;

  const stubLocation = pathname => {
    // Node lets us stub window without redefining jsdom's non-configurable
    // location property, including when CI runs with the vmThreads pool.
    assignedHref = undefined;
    vi.stubGlobal('window', {
      location: {
        pathname,
        set href(val) {
          assignedHref = val;
        }
      }
    });
  };

  beforeEach(() => {
    dispatch = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dispatches the LOGOUT action', () => {
    stubLocation('/');
    postLogout()(dispatch);
    expect(dispatch).toHaveBeenCalledWith({ type: LOGOUT });
  });

  it('redirects to / when logging out from a production URL', () => {
    stubLocation('/ui/map/44,5,10');
    postLogout()(dispatch);
    expect(assignedHref).toBe('/');
  });

  it('redirects to /pr/<n>/ when logging out from a preview URL', () => {
    stubLocation('/pr/1643/ui/map/44,5,10');
    postLogout()(dispatch);
    expect(assignedHref).toBe('/pr/1643/');
  });
});
