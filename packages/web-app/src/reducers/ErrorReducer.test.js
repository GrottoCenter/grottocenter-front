import reducer from './ErrorReducer';

it('leaves map 429 warnings to the shared notifier without dropping other errors', () => {
  const previous = { error: { type: '500', message: 'Previous failure' } };
  expect(
    reducer(previous, {
      type: 'FETCH_MAP_ENTRANCES_FAILURE',
      error: { type: '429', message: 'Fetching entrances' }
    })
  ).toBe(previous);
  const error = { type: '429', message: 'Saving a document' };
  expect(reducer(previous, { type: 'SAVE_DOCUMENT_FAILURE', error })).toEqual({
    error
  });
  const serverError = { type: '500', message: 'Fetching entrances' };
  expect(
    reducer(previous, {
      type: 'FETCH_MAP_ENTRANCES_FAILURE',
      error: serverError
    })
  ).toEqual({ error: serverError });
});
