// Words are compared ignoring case and surrounding punctuation, so "Scialet"
// and "Scialet:" count as the same word.
const normalizeWord = word =>
  word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

// Case- and whitespace-insensitive form, for "is this the same text?" tests.
// Shared so every such comparison in the document children UI agrees on what
// counts as the same text.
export const collapseWhitespace = value =>
  (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

// Separators only — never a closing bracket, and never a full stop, which is
// part of abbreviations such as "janv." or "Vol.".
const trimSeparators = value =>
  value.replace(/^[\s\-–—:;,/|]+|[\s\-–—:;,/|]+$/g, '');

// datePublication is a truncated ISO string ("2011", "2011-06", "2011-06-15").
export const getPublicationYear = datePublication => {
  const match = /^(\d{4})/.exec(datePublication ?? '');
  return match ? match[1] : null;
};

/**
 * Label of a child document shown inside its collection: its title, minus the
 * leading words already displayed in the collection's own heading.
 *
 * Strictly subtractive and self-limiting. The only thing it removes is a run of
 * leading words that is also the start of the collection title — text the reader
 * has in front of them anyway — plus punctuation that run leaves behind. A title
 * that does not follow the collection's pattern shares no leading word and comes
 * back untouched, and the last word is never removed, so the label can never end
 * up empty.
 *
 * It deliberately does NOT strip a trailing year. Doing so looked harmless and
 * was measured against 6148 real issues: it cut "(Jan.-Mar. 2005)" down to
 * "(Jan.-Mar." leaving an unbalanced bracket, left orphan ":" and "–" behind,
 * and — worst — collapsed "Monthly Newsletter - February 1996" and
 * "… February 1993" onto the same label, making two different issues
 * indistinguishable. In a date, the year is what identifies the issue; it is
 * removed from the *display* by getChildDisplay only when something else on the
 * tile already states it.
 */
export const getChildLabel = (doc, collectionTitle) => {
  const title = (doc?.title ?? '').trim();
  if (title === '') return '';

  const titleWords = title.split(/\s+/);
  const collectionWords = (collectionTitle ?? '').trim().split(/\s+/);

  let start = 0;
  while (
    start < titleWords.length - 1 &&
    start < collectionWords.length &&
    normalizeWord(titleWords[start]) !== '' &&
    normalizeWord(titleWords[start]) === normalizeWord(collectionWords[start])
  )
    start += 1;

  const words = titleWords.slice(start);

  // Removing the shared prefix often exposes the separator that followed it
  // ("Bulletin 1960 - SMSP" -> "- SMSP"). Drop leading punctuation-only words,
  // never the last one.
  while (words.length > 1 && normalizeWord(words[0]) === '') words.shift();

  const label = trimSeparators(words.join(' '));
  return label === '' ? title : label;
};

// A trailing bracketed group is treated as a date qualifier only when it carries
// a 4-digit year: "No 105 (Mars 2019)", "No 47 (2018)". Groups without one are
// part of the name and stay put — "SMSP (Société Méridionale de Spéléologie)" is
// not a date. This test is on the group's own content, so it works even when the
// document has no datePublication of its own.
const TRAILING_GROUP = /\s*[([]([^()[\]]*)[)\]]\s*$/;

export const splitDateQualifier = label => {
  const match = TRAILING_GROUP.exec(label);
  if (!match) return { primary: label, secondary: null };

  const inner = match[1].trim();
  if (!/\d{4}/.test(inner)) return { primary: label, secondary: null };

  const primary = trimSeparators(label.slice(0, match.index));
  // A title that is nothing but a date keeps it as its label.
  if (primary === '') return { primary: label, secondary: null };

  return { primary, secondary: inner };
};

/**
 * The two lines a tile shows: the issue designation, and the date underneath.
 *
 * The date comes from the title's own qualifier when it has one — "Mars 2019"
 * is more informative than the bare year — and falls back to datePublication.
 * It is dropped when the designation already states it, so a title that is
 * itself a date ("Speleofotografia 2012" -> "2012") is not printed twice.
 */
export const getChildDisplay = (doc, collectionTitle) => {
  const { primary, secondary } = splitDateQualifier(
    getChildLabel(doc, collectionTitle)
  );
  const candidate = secondary ?? getPublicationYear(doc?.datePublication);
  const isRedundant =
    candidate !== null &&
    collapseWhitespace(primary).includes(collapseWhitespace(candidate));
  return { primary, secondary: isRedundant ? null : candidate };
};

/**
 * Whether a child's description says anything its title does not.
 *
 * Imported children very often repeat the collection name as their description
 * ("Scialet" under "Scialet No 47 (2018)"). Repeated on every row that is pure
 * noise, so the description is only worth showing when it is not already
 * contained in the title. Same notion of "the same text" as getChildDisplay's
 * redundancy test — hence the shared normalizer.
 */
export const hasOwnDescription = doc => {
  const description = collapseWhitespace(doc?.description);
  return (
    description !== '' && !collapseWhitespace(doc?.title).includes(description)
  );
};

/**
 * The span a collection's run actually covers, from its issues' publication
 * dates — in library practice the central descriptive element of a serial.
 *
 * Derived rather than read from a curated sentence, so it is present and
 * accurate for every collection. Years are 4-character strings, so comparing
 * them as text orders them correctly. Returns null when no issue is dated.
 */
export const getIssuesYearRange = documents => {
  const years = (documents ?? [])
    .map(doc => getPublicationYear(doc?.datePublication))
    .filter(Boolean);
  if (years.length === 0) return null;
  return {
    start: years.reduce((min, year) => (year < min ? year : min)),
    end: years.reduce((max, year) => (year > max ? year : max))
  };
};
