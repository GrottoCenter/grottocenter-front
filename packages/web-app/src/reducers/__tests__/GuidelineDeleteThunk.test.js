import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import fetch from 'isomorphic-fetch';
import massif from '../MassifReducer';
import { deleteGuideline } from '../../actions/Guideline/DeleteGuideline';

vi.mock('isomorphic-fetch', () => ({ default: vi.fn() }));

// Minimal login reducer so getState().login.authorizationHeader exists
const login = (state = { authorizationHeader: {} }) => state;

const makeStore = preloaded =>
  createStore(
    combineReducers({ massif, login }),
    preloaded,
    applyMiddleware(thunk)
  );

const seededMassif = {
  massif: {
    massif: {
      id: 42,
      guidelines: [
        { id: 7, title: 'g7', isDeleted: true, massifs: [{ id: 42 }] },
        { id: 8, title: 'g8', isDeleted: false, massifs: [{ id: 42 }] }
      ]
    },
    isFetching: false,
    error: null
  },
  login: { authorizationHeader: {} }
};

const mockFetch = ({ status, body }) => {
  fetch.mockImplementation(() =>
    Promise.resolve({
      status,
      json: () =>
        body === undefined
          ? Promise.reject(new Error('no body'))
          : Promise.resolve(body)
    })
  );
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('permanent delete thunk -> store', () => {
  it('204 No Content removes the guideline and reports success', async () => {
    const store = makeStore(seededMassif);
    mockFetch({ status: 204, body: undefined });
    const ok = await store.dispatch(
      deleteGuideline({ id: 7, isPermanent: true })
    );
    expect(ok).toBe(true);
    expect(store.getState().massif.massif.guidelines.map(g => g.id)).toEqual([
      8
    ]);
  });

  it('200 with the deleted guideline body removes it', async () => {
    const store = makeStore(seededMassif);
    mockFetch({
      status: 200,
      body: { id: 7, title: 'g7', isDeleted: true, massifs: [{ id: 42 }] }
    });
    await store.dispatch(deleteGuideline({ id: 7, isPermanent: true }));
    expect(store.getState().massif.massif.guidelines.map(g => g.id)).toEqual([
      8
    ]);
  });

  it('200 with a string id in the body still removes it', async () => {
    const store = makeStore(seededMassif);
    mockFetch({ status: 200, body: { id: '7' } });
    await store.dispatch(deleteGuideline({ id: 7, isPermanent: true }));
    expect(store.getState().massif.massif.guidelines.map(g => g.id)).toEqual([
      8
    ]);
  });

  it('403 error leaves the guideline in place and reports failure', async () => {
    const store = makeStore(seededMassif);
    mockFetch({ status: 403, body: { message: 'forbidden' } });
    const ok = await store.dispatch(
      deleteGuideline({ id: 7, isPermanent: true })
    );
    expect(ok).toBe(false);
    expect(store.getState().massif.massif.guidelines.map(g => g.id)).toEqual([
      7, 8
    ]);
  });

  it('FULL LIFECYCLE: load -> soft delete -> permanent delete', async () => {
    // Start from a NON-deleted guideline, as when the page first loads.
    const store = makeStore({
      massif: {
        massif: {
          id: 42,
          guidelines: [
            { id: 7, title: 'g7', isDeleted: false, massifs: [{ id: 42 }] },
            { id: 8, title: 'g8', isDeleted: false, massifs: [{ id: 42 }] }
          ]
        },
        isFetching: false,
        error: null
      },
      login: { authorizationHeader: {} }
    });

    // 1. Soft delete: API echoes the guideline with isDeleted + massifs.
    mockFetch({
      status: 200,
      body: { id: 7, title: 'g7', isDeleted: true, massifs: [{ id: 42 }] }
    });
    await store.dispatch(deleteGuideline({ id: 7, isPermanent: false }));
    const afterSoft = store.getState().massif.massif.guidelines;
    expect(afterSoft.find(g => g.id === 7).isDeleted).toBe(true); // shows grayed

    // 2. Permanent delete of the now soft-deleted guideline.
    mockFetch({ status: 204, body: undefined });
    await store.dispatch(deleteGuideline({ id: 7, isPermanent: true }));
    expect(store.getState().massif.massif.guidelines.map(g => g.id)).toEqual([
      8
    ]);
  });
});
