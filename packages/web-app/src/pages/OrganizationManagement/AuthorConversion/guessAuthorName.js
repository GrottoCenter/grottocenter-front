// Best-effort suggestions for this temporary cleanup, always editable. Prefer
// explicit commas and uppercase surnames; ambiguous all-uppercase names follow
// the surname-first citation convention used by imported authors.
const PARTICLES = new Set([
  'de',
  'du',
  'des',
  'della',
  'del',
  'di',
  'da',
  'do',
  'dos',
  'das',
  'le',
  'la',
  'van',
  'von',
  'der',
  'den'
]);

const isInitial = word => /^(?:\p{L}{1,3}\.)(?:-?\p{L}{1,3}\.)*$/u.test(word);
const isParticle = word => PARTICLES.has(word.toLowerCase());
const isUppercase = word =>
  word === word.toUpperCase() && word !== word.toLowerCase();

const makeNames = (surname, name) => ({
  surname: surname.trim().toUpperCase(),
  name: name.trim()
});

export const guessAuthorName = value => {
  const normalized = value.trim().replace(/\s+/g, ' ');
  const comma = normalized.indexOf(',');
  if (comma !== -1) {
    return makeNames(normalized.slice(0, comma), normalized.slice(comma + 1));
  }
  const words = normalized ? normalized.split(' ') : [];
  if (words.length < 2) return makeNames(normalized, '');
  if (isInitial(words.at(-1))) {
    return makeNames(words.slice(0, -1).join(' '), words.at(-1));
  }

  let leading = 0;
  while (
    leading < words.length &&
    (isUppercase(words[leading]) || isParticle(words[leading]))
  )
    leading += 1;
  if (leading === words.length) {
    leading = 1;
    while (leading < words.length && isParticle(words[leading - 1]))
      leading += 1;
    return makeNames(
      words.slice(0, leading).join(' '),
      words.slice(leading).join(' ')
    );
  }
  while (leading > 0 && isInitial(words[leading - 1])) leading -= 1;
  if (leading > 0 && words.slice(0, leading).some(word => !isParticle(word))) {
    return makeNames(
      words.slice(0, leading).join(' '),
      words.slice(leading).join(' ')
    );
  }

  let trailing = words.length;
  while (
    trailing > 0 &&
    (isUppercase(words[trailing - 1]) || isParticle(words[trailing - 1]))
  )
    trailing -= 1;
  if (trailing === words.length) {
    trailing -= 1;
    while (trailing > 0 && isParticle(words[trailing - 1])) trailing -= 1;
  }
  return makeNames(
    words.slice(trailing).join(' '),
    words.slice(0, trailing).join(' ')
  );
};
