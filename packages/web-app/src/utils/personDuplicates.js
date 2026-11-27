import {
  DEFAULT_DELETED_CAVER_ID,
  PROTECTED_AUTHOR_LABEL_IDS
} from './personConstants';
import { isPersonType } from './personTypes';
import { normalizeName, nameSimilarity, nameTrigrams } from './nameSimilarity';

export const getPersonName = person =>
  person.nickname?.trim() ||
  [person.name, person.surname].filter(Boolean).join(' ') ||
  `#${person.id}`;

export const isMergePerson = person =>
  person?.id != null &&
  Number.isSafeInteger(Number(person.id)) &&
  Number(person.id) > 0 &&
  Number(person.id) !== DEFAULT_DELETED_CAVER_ID &&
  isPersonType(person.type) &&
  !person.isDeleted;

export const isMergeAuthorSource = person =>
  isMergePerson(person) &&
  person.type === 'AUTHOR' &&
  !Object.hasOwn(PROTECTED_AUTHOR_LABEL_IDS, Number(person.id));

export const canMergeAuthor = (source, target) =>
  isMergeAuthorSource(source) &&
  isMergePerson(target) &&
  Number(source.id) !== Number(target.id);

const nameTokens = value => normalizeName(value).split(' ').filter(Boolean);
const fullNameKey = value => {
  const tokens = nameTokens(value);
  return tokens.length >= 2 && tokens.some(token => token.length > 1)
    ? tokens.sort().join(' ')
    : '';
};

const compatibleInitials = (left, right) => {
  const a = left.split(' ');
  const b = right.split(' ');
  return (
    a.length === b.length &&
    a.every(
      (token, index) =>
        token === b[index] ||
        ((token.length === 1 || b[index].length === 1) &&
          token[0] === b[index][0])
    )
  );
};

const matchPeople = (a, b) => {
  if (a.first && a.last && b.first && b.last) {
    if (a.first === b.first && a.last === b.last) {
      return { reason: 'sameName', rank: 4 };
    }
    if (a.first === b.last && a.last === b.first) {
      return { reason: 'reversedName', rank: 3 };
    }
    if (a.last === b.last) {
      if (compatibleInitials(a.first, b.first)) {
        return { reason: 'initials', rank: 1 };
      }
      if (
        Math.min(a.first.length, b.first.length) >= 5 &&
        nameSimilarity(a.first, b.first) >= 0.8
      ) {
        return { reason: 'similarName', rank: 2 };
      }
    }
    if (
      a.first === b.first &&
      a.first.length > 1 &&
      Math.min(a.last.length, b.last.length) >= 5 &&
      nameSimilarity(a.last, b.last) >= 0.8
    ) {
      return { reason: 'similarName', rank: 2 };
    }
    // A matching nickname must not override contradictory structured names.
    return null;
  }
  if (a.fullKeys.some(key => b.fullKeys.includes(key))) {
    return { reason: 'sameFullName', rank: 3 };
  }
  return null;
};

// Index exact full names, surnames + first initial, and surname trigrams
// within an exact given name. Never compare the entire population pairwise.
export const findPersonDuplicates = (persons, onProgress = () => {}) => {
  const records = [
    ...new Map(
      persons.filter(isMergePerson).map(person => [String(person.id), person])
    ).values()
  ].map(person => {
    const first = normalizeName(person.name);
    const last = normalizeName(person.surname);
    return {
      person,
      first,
      last,
      fullKeys: [
        ...new Set(
          [
            first && last && fullNameKey(`${first} ${last}`),
            fullNameKey(person.nickname)
          ].filter(Boolean)
        )
      ]
    };
  });
  const index = new Map();
  const authorIndex = new Map();
  const pairs = [];
  records.forEach((record, position) => {
    const { first, last, person } = record;
    const keys = record.fullKeys.map(key => `full:${key}`);
    if (first && last) {
      keys.push(`last:${last}:${first[0]}`);
      if (first.length > 1 && last.length >= 5) {
        for (const gram of nameTrigrams(last)) {
          keys.push(`gram:${first}:${gram}`);
        }
      }
    }
    const candidates = new Set();
    const candidateIndex = isMergeAuthorSource(person) ? index : authorIndex;
    for (const key of keys) {
      for (const previous of candidateIndex.get(key) ?? [])
        candidates.add(previous);
    }
    for (const previous of candidates) {
      if (
        !canMergeAuthor(person, previous.person) &&
        !canMergeAuthor(previous.person, person)
      )
        continue;
      const match = matchPeople(record, previous);
      if (!match) continue;
      const people = [person, previous.person].sort(
        (a, b) => Number(a.id) - Number(b.id)
      );
      pairs.push({
        key: people.map(value => value.id).join(':'),
        persons: people,
        ...match
      });
    }
    for (const key of keys) {
      const bucket = index.get(key) ?? [];
      bucket.push(record);
      index.set(key, bucket);
      if (isMergeAuthorSource(person)) {
        const authors = authorIndex.get(key) ?? [];
        authors.push(record);
        authorIndex.set(key, authors);
      }
    }
    if (position % 500 === 0) onProgress(position, records.length);
  });
  onProgress(records.length, records.length);
  return pairs.sort(
    (a, b) =>
      b.rank - a.rank ||
      a.key.localeCompare(b.key, undefined, { numeric: true })
  );
};
