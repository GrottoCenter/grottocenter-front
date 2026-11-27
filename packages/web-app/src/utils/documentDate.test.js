import {
  isDocumentDateValid,
  normalizeDocumentDateInput
} from './documentDate';

it.each([
  ['31/12/2026', 'fr', '2026-12-31'],
  ['7.3.2026', 'de', '2026-03-07'],
  ['12/31/2026', 'en-US', '2026-12-31'],
  ['2026/12/31', 'ja', '2026-12-31'],
  ['31-12-2026', 'nl', '2026-12-31'],
  ['31.12.2026 г.', 'bg', '2026-12-31'],
  ['2026-12-31', 'nl', '2026-12-31'],
  ['2026-12', 'fr', '2026-12'],
  ['31/02/2026', 'fr', '31/02/2026']
])(
  'normalizes %s according to %s and preserves partial or invalid dates',
  (value, locale, expected) => {
    expect(normalizeDocumentDateInput(value, locale)).toBe(expected);
  }
);

it('applies the future-date rule to normalized local dates', () => {
  const date = normalizeDocumentDateInput('31/12/2099', 'fr');
  const now = new Date(2026, 0, 1);
  expect(isDocumentDateValid(date, false, now)).toBe(false);
  expect(isDocumentDateValid(date, true, now)).toBe(true);
});
