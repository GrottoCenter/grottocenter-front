// Compare words while ignoring case and surrounding punctuation, so that
// "Scialet" and "Scialet:" are recognised as the same word.
const normalizeWord = word =>
  word.toLowerCase().replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');

// datePublication is a truncated ISO string ("2011", "2011-06", "2011-06-15").
export const getPublicationYear = datePublication => {
  const match = /^(\d{4})/.exec(datePublication ?? '');
  return match ? match[1] : null;
};

/**
 * Label of a child document shown inside its collection: its title, minus the
 * parts already displayed around it.
 *
 * Strictly subtractive and self-limiting — it only removes text that is proven
 * redundant, never parsed or guessed:
 *  - a leading run of words that is also the start of the collection title
 *    (i.e. words already displayed in the page heading);
 *  - a trailing year equal to the child's own datePublication, which the tile
 *    displays on its own line.
 *
 * A title that does not follow the collection's pattern shares no leading word
 * and comes back untouched, and the last word is never removed — so the label
 * can never end up empty.
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
  // ("Bulletin 1960 - SMSP" -> "- SMSP"). Drop leading words made only of
  // punctuation, never the last one.
  while (words.length > 1 && normalizeWord(words[0]) === '') words.shift();

  const year = getPublicationYear(doc?.datePublication);
  if (year && words.length > 1 && normalizeWord(words.at(-1)) === year)
    words.pop();

  return words.join(' ');
};
