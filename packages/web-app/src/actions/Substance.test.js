import { searchSubstances, createSubstance } from './Substance';

// Mock the Login module to prevent issues with checkAuthStatus
vi.mock('./Login', () => ({
  postLogout: () => () => {}
}));

const mockGetState = () => ({
  login: {
    authorizationHeader: { Authorization: 'Bearer test-token' }
  }
});

const mockDispatch = vi.fn(action => {
  if (typeof action === 'function') {
    return action(mockDispatch, mockGetState);
  }
  return action;
});

const mockFetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', mockFetch);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
  vi.unstubAllGlobals();
});

describe('searchSubstances', () => {
  it('returns results array on success', async () => {
    const mockResults = [
      {
        id: 1,
        name: 'Nitrate',
        formula: 'NO₃⁻',
        casNumber: null,
        externalId: '943',
        externalSource: 'PubChem'
      },
      {
        id: 2,
        name: 'Nitrite',
        formula: 'NO₂⁻',
        casNumber: null,
        externalId: null,
        externalSource: null
      }
    ];

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve(mockResults)
    });

    const result = await searchSubstances('nitra')(mockDispatch, mockGetState);

    expect(result).toEqual(mockResults);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/substances?search=nitra'),
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('returns empty array on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await searchSubstances('nitra')(mockDispatch, mockGetState);

    expect(result).toEqual([]);
  });

  it('returns empty array on server error (5xx)', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: () => Promise.resolve({ message: 'Internal error' })
    });

    const result = await searchSubstances('calc')(mockDispatch, mockGetState);

    expect(result).toEqual([]);
  });

  it('returns empty array on auth error (401)', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' })
    });

    const result = await searchSubstances('calc')(mockDispatch, mockGetState);

    expect(result).toEqual([]);
  });
});

describe('createSubstance', () => {
  it('returns created substance on 201', async () => {
    const substance = {
      id: 42,
      name: 'Nitramine',
      formula: 'CH3N3O2',
      casNumber: null,
      externalId: '12345',
      externalSource: 'PubChem'
    };

    mockFetch.mockResolvedValueOnce({
      status: 201,
      json: () => Promise.resolve(substance)
    });

    const data = {
      name: 'Nitramine',
      formula: 'CH3N3O2',
      externalId: '12345',
      externalSource: 'PubChem'
    };
    const result = await createSubstance(data)(mockDispatch, mockGetState);

    expect(result).toEqual(substance);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/substances'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(data)
      })
    );
  });

  it('returns existing substance on 200 (duplicate name)', async () => {
    const existing = {
      id: 1,
      name: 'Nitrate',
      formula: 'NO₃⁻',
      casNumber: null,
      externalId: '943',
      externalSource: 'PubChem'
    };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve(existing)
    });

    const result = await createSubstance({ name: 'Nitrate' })(
      mockDispatch,
      mockGetState
    );

    expect(result).toEqual(existing);
  });

  it('throws on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 500,
      json: () => Promise.resolve({ message: 'Internal server error' })
    });

    await expect(
      createSubstance({ name: 'Bad' })(mockDispatch, mockGetState)
    ).rejects.toThrow();
  });

  it('returns undefined on auth error (401)', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      json: () => Promise.resolve({ message: 'Unauthorized' })
    });

    const result = await createSubstance({ name: 'Test' })(
      mockDispatch,
      mockGetState
    );

    expect(result).toBeUndefined();
  });
});
