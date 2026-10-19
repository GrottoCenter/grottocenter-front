import { authorIcon, caverIcon, personIcon } from '@/assets/icons';

export const DEFAULT_PERSON_TYPE = 'CAVER';

const PERSON_TYPES = Object.freeze({
  CAVER: { labelId: 'Caver', iconType: 'caver', iconSource: caverIcon },
  AUTHOR: { labelId: 'Author', iconType: 'author', iconSource: authorIcon }
});

export const isPersonType = type => Object.hasOwn(PERSON_TYPES, type);

export const getPersonTypeLabelId = type =>
  (isPersonType(type) && PERSON_TYPES[type].labelId) || 'unknown';

export const getPersonIconType = type =>
  (isPersonType(type) && PERSON_TYPES[type].iconType) || 'person';

export const getPersonIconSource = type =>
  (isPersonType(type) && PERSON_TYPES[type].iconSource) || personIcon;
