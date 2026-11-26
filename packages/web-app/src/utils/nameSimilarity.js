export const normalizeName = value =>
  typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
    : '';

export const nameTrigrams = name => {
  const characters = [...name];
  return new Set(
    characters
      .slice(0, -2)
      .map((_, index) => characters.slice(index, index + 3).join(''))
  );
};

export const nameSimilarity = (left, right) => {
  if (!left || !right) return 0;
  if (left === right) return 1;
  const a = nameTrigrams(left);
  const b = nameTrigrams(right);
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const gram of a) if (b.has(gram)) shared += 1;
  return (2 * shared) / (a.size + b.size);
};
