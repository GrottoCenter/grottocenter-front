const normalize = value =>
  typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
    : '';

const normalizeUrl = value => {
  if (!value) return '';
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    return `${url.hostname.replace(/^www\./, '').toLowerCase()}${url.pathname.replace(/\/+$/, '')}`;
  } catch {
    return '';
  }
};

const normalizedName = value =>
  normalize(
    typeof value === 'string'
      ? value.replace(/\s+\((\p{Lu}\p{Ll}+(?:[ -]\p{Lu}?\p{Ll}+)*)\)\s*$/u, '')
      : value
  ).replace(/\bed\b/g, 'editions');

const SIMILARITY_THRESHOLD = 0.8;

const nameTrigrams = name => {
  const characters = [...name];
  return new Set(
    characters
      .slice(0, -2)
      .map((_, index) => characters.slice(index, index + 3).join(''))
  );
};

export const findOrganizationDuplicates = organizations => {
  const byId = new Map(organizations.map(org => [String(org.id), org]));
  const parents = new Map([...byId.keys()].map(id => [id, id]));
  const keys = new Map();
  const locationBuckets = new Map();
  const acronymBuckets = new Map();
  const find = id => {
    let current = id;
    let root = current;
    while (parents.get(root) !== root) root = parents.get(root);
    while (current !== root) {
      const next = parents.get(current);
      parents.set(current, root);
      current = next;
    }
    return root;
  };

  for (const organization of organizations) {
    const id = String(organization.id);
    const name = normalizedName(organization.name);
    const city = normalize(organization.city);
    const country = normalize(organization.country).split(' ')[0];
    const postalCode = normalize(organization.postalCode);
    const acronym = organization.name
      ?.trim()
      .match(/^([\p{Lu}\p{N}]{3,10})(?=$|[^\p{L}\p{N}])/u)?.[1]
      ?.toLowerCase();
    const email = organization.mail?.trim().toLowerCase();
    const url = normalizeUrl(organization.url);
    const signals = [
      email && email !== 'no@mail.com' && [`email:${email}`, 'sameEmail'],
      url && [`url:${url}`, 'sameWebsite'],
      name &&
        city &&
        country && [
          `name:${name}|city:${city}|country:${country}`,
          'sameNameAndCity'
        ],
      name.length >= 8 &&
        !city &&
        !postalCode && [`alias:${country}:${name}`, 'sameNormalizedName']
    ].filter(Boolean);

    for (const [key, reason] of signals) {
      const match = keys.get(key);
      if (match) {
        parents.set(find(id), find(match.id));
        match.reasons.add(reason);
      } else {
        keys.set(key, { id, reasons: new Set() });
      }
    }

    if (acronym) {
      const records = acronymBuckets.get(acronym) ?? [];
      records.push({
        id,
        country,
        city,
        postalCode,
        isStandalone: name === acronym
      });
      acronymBuckets.set(acronym, records);
    }

    if (name.length >= 6 && country) {
      const record = {
        id,
        name,
        trigrams: nameTrigrams(name),
        numbers: (name.match(/\p{N}+/gu) ?? []).map(number =>
          number.replace(/^0+(?=\d)/, '')
        )
      };
      for (const [locationKey, reason] of [
        city && [`city:${country}:${city}`, 'similarNameAndCity'],
        postalCode && [
          `postal:${country}:${postalCode}`,
          'similarNameAndPostalCode'
        ]
      ].filter(Boolean)) {
        const bucket = locationBuckets.get(locationKey) ?? {
          reason,
          records: []
        };
        bucket.records.push(record);
        locationBuckets.set(locationKey, bucket);
      }
    }
  }

  const groups = new Map();
  for (const [id, organization] of byId) {
    const root = find(id);
    const group = groups.get(root) ?? { organizations: [], reasons: [] };
    group.organizations.push(organization);
    groups.set(root, group);
  }
  for (const { id, reasons } of keys.values()) {
    const group = groups.get(find(id));
    for (const reason of reasons) {
      if (!group.reasons.includes(reason)) group.reasons.push(reason);
    }
  }
  const exactGroups = [...groups.values()]
    .filter(group => group.organizations.length > 1)
    .map(group => {
      group.organizations.sort((a, b) => Number(a.id) - Number(b.id));
      return {
        ...group,
        key: group.organizations.map(org => org.id).join(':')
      };
    })
    .sort(
      (a, b) =>
        Number(b.reasons.includes('sameNormalizedName')) -
          Number(a.reasons.includes('sameNormalizedName')) ||
        a.organizations[0].name.localeCompare(b.organizations[0].name)
    );

  const similarPairs = new Map();
  for (const records of acronymBuckets.values()) {
    for (const standalone of records.filter(record => record.isStandalone)) {
      for (const candidate of records) {
        if (
          standalone.id === candidate.id ||
          find(standalone.id) === find(candidate.id) ||
          (standalone.country &&
            candidate.country &&
            standalone.country !== candidate.country) ||
          (standalone.city &&
            candidate.city &&
            standalone.city !== candidate.city &&
            !(
              standalone.postalCode &&
              standalone.postalCode === candidate.postalCode
            ))
        )
          continue;
        const ids = [standalone.id, candidate.id].sort(
          (a, b) => Number(a) - Number(b)
        );
        const key = `similar:${ids.join(':')}`;
        similarPairs.set(key, {
          key,
          organizations: ids.map(id => byId.get(id)),
          reasons: ['sharedAcronym']
        });
      }
    }
  }

  for (const { reason, records } of locationBuckets.values()) {
    const gramIndex = new Map();
    for (const record of records) {
      const shared = new Map();
      for (const gram of record.trigrams) {
        for (const previous of gramIndex.get(gram) ?? []) {
          shared.set(previous, (shared.get(previous) ?? 0) + 1);
        }
      }
      for (const [previous, count] of shared) {
        if (find(record.id) === find(previous.id)) continue;
        if (
          record.numbers.length &&
          previous.numbers.length &&
          record.numbers.join(':') !== previous.numbers.join(':')
        )
          continue;
        const similarity =
          (2 * count) / (record.trigrams.size + previous.trigrams.size);
        if (similarity < SIMILARITY_THRESHOLD) continue;
        const ids = [record.id, previous.id].sort(
          (a, b) => Number(a) - Number(b)
        );
        const key = `similar:${ids.join(':')}`;
        const pair = similarPairs.get(key) ?? {
          key,
          organizations: ids.map(id => byId.get(id)),
          reasons: [],
          nameSimilarity: Math.round(similarity * 100)
        };
        if (!pair.reasons.includes(reason)) pair.reasons.push(reason);
        pair.nameSimilarity = Math.round(similarity * 100);
        similarPairs.set(key, pair);
      }
      for (const gram of record.trigrams) {
        const matches = gramIndex.get(gram) ?? [];
        matches.push(record);
        gramIndex.set(gram, matches);
      }
    }
  }

  return [
    ...exactGroups,
    ...[...similarPairs.values()].sort(
      (a, b) =>
        (b.nameSimilarity ?? 0) - (a.nameSimilarity ?? 0) ||
        a.organizations[0].name.localeCompare(b.organizations[0].name)
    )
  ];
};
