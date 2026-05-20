import fc from 'fast-check';
import { postCreateCaveUrl } from '../../../conf/apiRoutes';

// Mock isomorphic-fetch at the module level
const mockFetch = jest.fn();
jest.mock('isomorphic-fetch', () => ({
  __esModule: true,
  default: (...args) => mockFetch(...args)
}));

// Import after mock setup
const { detachEntranceToNewCave } = require('../DetachEntrance');

/**
 * Shared arbitraries for entrance data.
 * Uses adversarial strings for names (unicode, whitespace, special chars)
 * and positive integers for IDs.
 */
const entranceNameArb = fc.oneof(
  { weight: 5, arbitrary: fc.string({ minLength: 1, maxLength: 50 }) },
  {
    weight: 2,
    arbitrary: fc.string({ minLength: 1, maxLength: 30, unit: 'grapheme' })
  },
  {
    weight: 2,
    arbitrary: fc.constantFrom(
      '北京洞穴',
      'café grotte',
      '🦇 cave',
      '<script>alert("xss")</script>',
      "O'Brien's Cave",
      '\t leading whitespace',
      'trailing\u00A0nbsp'
    )
  },
  {
    weight: 1,
    arbitrary: fc.string({ minLength: 1, maxLength: 20, unit: 'grapheme-ascii' })
  }
);

const entranceLanguageArb = fc.oneof(
  {
    weight: 7,
    arbitrary: fc.constantFrom('eng', 'fra', 'deu', 'spa', 'zho', 'ara')
  },
  { weight: 3, arbitrary: fc.string({ minLength: 1, maxLength: 10 }) }
);

const entranceIdArb = fc.oneof(
  { weight: 8, arbitrary: fc.integer({ min: 1, max: 100000 }) },
  {
    weight: 2,
    arbitrary: fc.constantFrom(1, Number.MAX_SAFE_INTEGER, 2147483647)
  }
);

const caveIdArb = fc.integer({ min: 1, max: 100000 });

function createMockGetState() {
  return () => ({
    login: {
      authorizationHeader: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    }
  });
}

function createMockDispatch() {
  const actions = [];
  const dispatch = action => {
    actions.push(action);
    return action;
  };
  dispatch.getActions = () => actions;
  return dispatch;
}

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Feature: detach-entrance-from-cave, Property 1: Cave creation payload derives from entrance data', () => {
  /**
   * For any entrance with non-empty name and valid language, the POST body
   * has name.text === entrance.name and name.language === entrance.language.
   *
   * Encodes: the cave creation step uses the entrance's name and language verbatim.
   * Covers: all valid entrance name/language combinations including adversarial unicode.
   *
   * **Validates: Requirements 2.2, 2.3, 3.1**
   */
  it('should POST cave with name.text and name.language matching entrance data', async () => {
    await fc.assert(
      fc.asyncProperty(
        entranceNameArb,
        entranceLanguageArb,
        entranceIdArb,
        caveIdArb,
        async (name, language, entranceId, newCaveId) => {
          const fetchCalls = [];
          mockFetch.mockReset();
          mockFetch.mockImplementation((...args) => {
            fetchCalls.push(args);
            if (fetchCalls.length === 1) {
              return Promise.resolve({
                status: 201,
                json: () => Promise.resolve({ id: newCaveId })
              });
            }
            return Promise.resolve({
              status: 200,
              json: () => Promise.resolve({})
            });
          });

          const dispatch = createMockDispatch();
          const getState = createMockGetState();
          const entrance = { id: entranceId, name, language };

          await detachEntranceToNewCave(entrance)(dispatch, getState);

          const [url, options] = fetchCalls[0];
          expect(url).toBe(postCreateCaveUrl);
          expect(options.method).toBe('POST');
          const body = JSON.parse(options.body);
          expect(body.name.text).toBe(name);
          expect(body.name.language).toBe(language);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: detach-entrance-from-cave, Property 2: Two-step orchestration uses correct cave ID', () => {
  /**
   * For any successful cave creation response with an id, the PATCH targets
   * moveEntranceToCaveUrl(entranceId, response.id).
   *
   * Encodes: the move step uses the cave ID returned by the creation step.
   * Covers: all valid entrance/cave ID combinations.
   *
   * **Validates: Requirements 3.2**
   */
  it('should PATCH moveEntranceToCaveUrl with the created cave ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        entranceNameArb,
        entranceLanguageArb,
        entranceIdArb,
        caveIdArb,
        async (name, language, entranceId, newCaveId) => {
          const fetchCalls = [];
          mockFetch.mockReset();
          mockFetch.mockImplementation((...args) => {
            fetchCalls.push(args);
            if (fetchCalls.length === 1) {
              return Promise.resolve({
                status: 201,
                json: () => Promise.resolve({ id: newCaveId })
              });
            }
            return Promise.resolve({
              status: 200,
              json: () => Promise.resolve({})
            });
          });

          const dispatch = createMockDispatch();
          const getState = createMockGetState();
          const entrance = { id: entranceId, name, language };

          await detachEntranceToNewCave(entrance)(dispatch, getState);

          expect(fetchCalls.length).toBeGreaterThanOrEqual(2);
          const [patchUrl, patchOptions] = fetchCalls[1];
          expect(patchUrl).toContain(
            `/entrances/${entranceId}/cave/${newCaveId}`
          );
          expect(patchOptions.method).toBe('PATCH');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: detach-entrance-from-cave, Property 3: Rollback on move failure', () => {
  /**
   * For any scenario where cave creation succeeds but move fails,
   * a DELETE is issued for the created cave's ID before dispatching failure.
   *
   * Encodes: rollback deletes the orphaned cave on move failure.
   * Covers: all valid entrance/cave ID combinations with move failure.
   *
   * **Validates: Requirements 4.2, 5.4**
   */
  it('should DELETE the created cave when move fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        entranceNameArb,
        entranceLanguageArb,
        entranceIdArb,
        caveIdArb,
        async (name, language, entranceId, newCaveId) => {
          const fetchCalls = [];
          mockFetch.mockReset();
          mockFetch.mockImplementation((...args) => {
            fetchCalls.push(args);
            if (fetchCalls.length === 1) {
              return Promise.resolve({
                status: 201,
                json: () => Promise.resolve({ id: newCaveId })
              });
            }
            if (fetchCalls.length === 2) {
              return Promise.resolve({
                status: 500,
                json: () =>
                  Promise.resolve({ message: 'Internal Server Error' })
              });
            }
            return Promise.resolve({ status: 200 });
          });

          const dispatch = createMockDispatch();
          const getState = createMockGetState();
          const entrance = { id: entranceId, name, language };

          await detachEntranceToNewCave(entrance)(dispatch, getState);

          expect(fetchCalls.length).toBe(3);
          const [deleteUrl, deleteOptions] = fetchCalls[2];
          expect(deleteUrl).toContain(`/caves/${newCaveId}`);
          expect(deleteOptions.method).toBe('DELETE');

          const actions = dispatch.getActions();
          const failureAction = actions.find(
            a => a.type === 'DETACH_ENTRANCE_FAILURE'
          );
          expect(failureAction).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: detach-entrance-from-cave, Property 4: Error propagation from either step', () => {
  /**
   * For any HTTP error from either step, DETACH_ENTRANCE_FAILURE is dispatched
   * with an error message.
   *
   * Encodes: errors from either API call result in a failure action.
   * Covers: cave creation failure and move failure scenarios.
   *
   * **Validates: Requirements 4.1**
   */
  it('should dispatch DETACH_ENTRANCE_FAILURE when cave creation fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        entranceNameArb,
        entranceLanguageArb,
        entranceIdArb,
        fc.integer({ min: 400, max: 599 }).filter(s => s !== 401),
        async (name, language, entranceId, errorStatus) => {
          mockFetch.mockReset();
          mockFetch.mockImplementation(() =>
            Promise.resolve({
              status: errorStatus,
              json: () =>
                Promise.resolve({ message: `Error ${errorStatus}` })
            })
          );

          const dispatch = createMockDispatch();
          const getState = createMockGetState();
          const entrance = { id: entranceId, name, language };

          await detachEntranceToNewCave(entrance)(dispatch, getState);

          const actions = dispatch.getActions();
          const failureAction = actions.find(
            a => a.type === 'DETACH_ENTRANCE_FAILURE'
          );
          expect(failureAction).toBeDefined();
          expect(failureAction.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should dispatch DETACH_ENTRANCE_FAILURE when move fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        entranceNameArb,
        entranceLanguageArb,
        entranceIdArb,
        caveIdArb,
        fc.integer({ min: 400, max: 599 }).filter(s => s !== 401),
        async (name, language, entranceId, newCaveId, errorStatus) => {
          let callCount = 0;
          mockFetch.mockReset();
          mockFetch.mockImplementation(() => {
            callCount += 1;
            if (callCount === 1) {
              return Promise.resolve({
                status: 201,
                json: () => Promise.resolve({ id: newCaveId })
              });
            }
            if (callCount === 2) {
              return Promise.resolve({
                status: errorStatus,
                json: () =>
                  Promise.resolve({ message: `Error ${errorStatus}` })
              });
            }
            return Promise.resolve({ status: 200 });
          });

          const dispatch = createMockDispatch();
          const getState = createMockGetState();
          const entrance = { id: entranceId, name, language };

          await detachEntranceToNewCave(entrance)(dispatch, getState);

          const actions = dispatch.getActions();
          const failureAction = actions.find(
            a => a.type === 'DETACH_ENTRANCE_FAILURE'
          );
          expect(failureAction).toBeDefined();
          expect(failureAction.error).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
