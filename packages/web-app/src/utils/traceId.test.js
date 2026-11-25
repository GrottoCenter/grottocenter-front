import { readTraceId } from './traceId';

const combined =
  '019abb54-1234-7000-8000-0123456789ab.019abb54-5678-7000-8000-0123456789ab';

it.each(['legacy_reference-1', combined, 'a'.repeat(128)])(
  'preserves and trims the complete response reference (%s)',
  value => {
    expect(readTraceId(new Headers({ 'X-Trace-Id': `  ${value}  ` }))).toBe(
      value
    );
  }
);

it.each(['', '   ', '<html>', 'not an id', 'a'.repeat(129)])(
  'rejects invalid or oversized references (%j)',
  value => {
    expect(readTraceId(new Headers({ 'X-Trace-Id': value }))).toBeUndefined();
  }
);

it('accepts missing response headers', () => {
  expect(readTraceId()).toBeUndefined();
  expect(readTraceId(new Headers())).toBeUndefined();
});
