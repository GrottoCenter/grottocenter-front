// Vector order is shared by the parser, sheet totals and regression fixtures.
export const EQUIPMENT_TYPES = [
  'hangers',
  'carabiners',
  'expansionBolts',
  'softAnchors',
  'slings'
];

const VECTORS = {
  S: [1, 1, 0, 0, 0],
  B: [0, 1, 0, 0, 0],
  G: [1, 1, 1, 0, 0],
  P: [0, 1, 0, 0, 0],
  AS: [0, 0, 0, 1, 0],
  AN: [0, 0, 0, 0, 1],
  AF: [0, 0, 0, 0, 1],
  DEV: [0, 1, 0, 0, 1],
  HANGER: [1, 0, 0, 0, 0],
  CARABINER: [0, 1, 0, 0, 0],
  SLING: [0, 0, 0, 0, 1]
};
const ALIASES = {
  S: 'spits?|spt|sp|s',
  B: 'broches?|br|quimics?|glue[ -]?in bolts?|resin anchors?|b',
  G: 'goujons?|expansion bolts?|gj|eb|g',
  P: 'pitons?|p',
  AS: 'amarrages? souples?|soft anchors?|as|sa',
  AF: 'amarrages? fores?|drilled anchors?|af|da',
  AN: 'amarrages? naturels?|natural anchors?|a\\.\\s*n\\.?|an|na|nat|naturels?',
  DEV: 'deviations?|deviateurs?|devia|dev\\.?|redirects?|redir',
  HANGER: 'plaquettes?|(?:bolt )?hangers?',
  CARABINER:
    'mousquetons?|mouskifs?|moschettoni|moschettone|mosquetones?|mosquetons?|carabiners?|karabiners?',
  SLING: 'sangles?|schlingen|schlinge|slings?|webbing|cinta tubular'
};
const ALL_TYPES = `(?:${Object.values(ALIASES).join('|')})`;
const TYPE_PATTERN = Object.entries(ALIASES)
  .map(([kind, pattern]) => `(?<${kind}>${pattern})`)
  .join('|');
const QUANTITY = '\\d+(?:\\s*[x*×]\\s*\\d+)*';
const TOKEN_PATTERN = `(?<![a-z0-9])(?:y\\s*)?(?<qty>${QUANTITY})?\\s*(?:${TYPE_PATTERN})(?:mc|y)?(?![a-z0-9'])`;
const PLURALS = new Set([
  'spits',
  'broches',
  'goujons',
  'pitons',
  'naturels',
  'plaquettes',
  'hangers',
  'bolt hangers',
  'expansion bolts',
  'soft anchors',
  'drilled anchors',
  'natural anchors',
  'mousquetons',
  'mouskifs',
  'moschettoni',
  'mosquetones',
  'mosquetons',
  'carabiners',
  'karabiners',
  'sangles',
  'schlingen',
  'slings',
  'quimics',
  'glue in bolts',
  'resin anchors',
  'webbing',
  'cinta tubular'
]);
// Spellings use the sheet language, never the interface language. Short
// international notation (AN/NA, AS/SA, AF/DA, G/EB) works in every language.
const NUMBER_WORDS = {
  fra: {
    un: 1,
    une: 1,
    deux: 2,
    trois: 3,
    quatre: 4,
    cinq: 5,
    six: 6,
    sept: 7,
    huit: 8,
    neuf: 9,
    dix: 10
  },
  eng: {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10
  },
  deu: { ein: 1, eine: 1, zwei: 2, drei: 3, vier: 4, funf: 5 },
  spa: { un: 1, una: 1, dos: 2, tres: 3, cuatro: 4 },
  ita: { un: 1, uno: 1, una: 1, due: 2, tre: 3 },
  cat: { un: 1, una: 1, dos: 2, dues: 2, tres: 3 }
};
const LANGUAGE_CODES = {
  fr: 'fra',
  en: 'eng',
  de: 'deu',
  es: 'spa',
  it: 'ita',
  ca: 'cat'
};
const zeroVector = () => EQUIPMENT_TYPES.map(() => 0);
const scale = (kind, quantity) => VECTORS[kind].map(n => n * quantity);
// Saturate corrupt inventories instead of displaying unsafe integer totals.
const addQuantity = (sum, quantity) =>
  Math.min(Number.MAX_SAFE_INTEGER, sum + quantity);

const normalize = (text, language) => {
  let value = text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/\u00a0/g, ' ');
  const words = NUMBER_WORDS[LANGUAGE_CODES[language] || language] || {};
  Object.entries(words).forEach(([word, number]) => {
    value = value.replace(
      new RegExp(`\\b${word}\\b(?=\\s*${ALL_TYPES}(?![a-z]))`, 'g'),
      String(number)
    );
  });
  value = value
    .replace(/\b(\d+\s*)(as|af|an)s\b/g, '$1$2')
    .replace(/\b(\d+\s*)n\b/g, '$1an')
    // Known misspelling of "déviation" in existing anchor cells.
    .replace(/\bdevintion\b/g, 'dev')
    .replace(
      new RegExp(
        `(\\d+)\\s+(?:gros|grandes?|petites?|longue?)\\s*(${ALL_TYPES})(?![a-z])`,
        'g'
      ),
      '$1$2'
    )
    .replace(
      new RegExp(
        `(\\d+)\\s*(${ALL_TYPES})\\s*\\(\\s*(ou|or|oder)\\s+(\\d+)\\s*\\)`,
        'g'
      ),
      '$1$2 $3 $4$2'
    )
    .replace(
      new RegExp(
        `\\b(\\d+)\\s+(ou|or|oder)\\s+(\\d+)\\s*(${ALL_TYPES})(?![a-z])`,
        'g'
      ),
      '$1$4 $2 $3$4'
    )
    .replace(
      new RegExp(`\\((\\d+(?:\\s*\\+\\s*\\d+)+)\\s*(${ALL_TYPES})\\)`, 'g'),
      (_match, quantities, kind) =>
        `${quantities.match(/\d+/g).reduce((sum, n) => sum + Number(n), 0)}${kind}`
    )
    // Dimensions describe the anchor or sling, not a quantity of equipment.
    .replace(
      /\b\d+(?:[.,]\d+)?\s*(?:mm|cms?|metres?|meters?|mts?|feet|ft|m)\b|\bm\d+\b/g,
      ' '
    );
  return value;
};

const hasResidual = text =>
  Boolean(
    text
      // "3 spits (1 facultatif)" already includes that optional point.
      .replace(
        /\(\s*\d+\s+(?:facultatifs?|facultatives?|optionnels?|optionnelles?)\s*\)/g,
        ' '
      )
      .replace(/\bdont\s+\d+\s+en\s+y\b/g, ' ')
      .replace(/\b(?:a|vers)\s*-?\s*\d+(?:[.,]\d+)?\b/g, ' ')
      .replace(
        /\b(?:mc|m\.c|cp|y|frac|fractio|fractionnement|en y|en fixe|en hauteur|facultatifs?|facultatives?|optionnels?|optionnelles?|a vis|inox)\b/g,
        ' '
      )
      .replace(
        /\b(?:sur|et|puis|au|a|du|de|depart|tete|puits|plafond|gauche|droite|plein|vide|main|courante|arbres?|barres?|gros|grandes?|petites?|becquet|bequet|buis|diam|diametre|g|d|rg|rd)\b/g,
        ' '
      )
      .replace(/[\s+*,.;:/(){}[\]…→↓↑←–—-]+/g, '')
  );

const readNodes = value =>
  Array.from(value.matchAll(new RegExp(TOKEN_PATTERN, 'g'))).flatMap(match => {
    const kind = Object.keys(ALIASES).find(
      key => match.groups[key] !== undefined
    );
    const raw = match.groups[kind];
    const quantityText = match.groups.qty;
    // "à g." is a direction, not an implicit goujon.
    if (
      kind === 'G' &&
      raw === 'g' &&
      !quantityText &&
      /\ba\s*$/.test(value.slice(0, match.index))
    )
      return [];
    let quantity = PLURALS.has(raw) ? 0 : 1;
    if (quantityText)
      quantity = quantityText
        .match(/\d+/g)
        .reduce((product, factor) => product * Number(factor), 1);
    // Corrupt or gigantic quantities must not propagate Infinity into the UI.
    if (!Number.isSafeInteger(quantity)) quantity = 0;
    return [
      {
        kind,
        quantity,
        explicitQuantity: Boolean(quantityText),
        start: match.index,
        end: match.index + match[0].length
      }
    ];
  });

const isSupport = kind => ['S', 'B', 'G', 'P', 'AN', 'AF', 'AS'].includes(kind);
const MATERIAL_INDEX = { HANGER: 0, CARABINER: 1, SLING: 4 };

const groupNodes = (nodes, value) => {
  const groups = [];
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    const following = nodes[index + 1];
    let vector = scale(node.kind, node.quantity);
    let { end } = node;
    let isUncertain = node.quantity === 0;
    if (following) {
      const gap = value.slice(node.end, following.start);
      const material =
        MATERIAL_INDEX[node.kind] !== undefined ? node : following;
      const anchor = material === node ? following : node;
      const isLinkedInventory =
        MATERIAL_INDEX[material.kind] !== undefined &&
        isSupport(anchor.kind) &&
        /^[ \t]+(?:sur|on|auf|avec|with|mit)[ \t]+$/.test(gap);
      const isPair =
        (node.kind === 'DEV' && isSupport(following.kind)) ||
        (following.kind === 'DEV' && isSupport(node.kind));
      const subset =
        following.kind === 'DEV' &&
        gap.match(/^\s*\(\s*dont\s+(\d+)\s+pour\s*$/);
      const simpleGap =
        !gap.includes('\n') &&
        /^[ /()]*(?:(?:sur|pour)\s*)?$/.test(gap) &&
        !(following.kind === 'DEV' && following.explicitQuantity);
      if (isLinkedInventory) {
        // "4 mousquetons sur 4 broches" describes the same connectors.
        // An unlinked inventory such as "3 mousquetons / 1dev" stays additive.
        vector = scale(anchor.kind, anchor.quantity);
        vector[MATERIAL_INDEX[material.kind]] = material.quantity;
        isUncertain ||= material.quantity === 0 || anchor.quantity === 0;
        end = following.end;
        index++;
      } else if (isPair && (simpleGap || subset)) {
        const support = node.kind === 'DEV' ? following : node;
        const count = node.kind === 'DEV' ? node.quantity : support.quantity;
        if (subset) {
          vector = scale(support.kind, support.quantity);
          const quantity = Number(subset[1]);
          const isSafeQuantity = Number.isSafeInteger(quantity);
          isUncertain ||=
            !isSafeQuantity ||
            quantity > support.quantity ||
            !Number.isSafeInteger(vector[4] + quantity);
          vector[4] = addQuantity(vector[4], isSafeQuantity ? quantity : 0);
        } else {
          vector = scale('DEV', count);
          if (support.kind === 'S' || support.kind === 'G') vector[0] = count;
          if (support.kind === 'G') vector[2] = count;
        }
        isUncertain ||=
          support.kind === 'AS' ||
          (node.kind === 'DEV' && ![1, count].includes(support.quantity));
        end = following.end;
        index++;
      }
    }
    groups.push({
      min: vector,
      max: [...vector],
      start: node.start,
      end,
      isUncertain
    });
  }
  return groups;
};

/**
 * Known contributions from one anchor cell. Alternatives use component-wise
 * bounds; unknown systems/quantities contribute nothing. A partial result is
 * not a guaranteed inventory or upper bound. Always display it approximately.
 * `status` is a regression diagnostic; the UI uses ~ for every equipment count.
 */
export const parseAnchorEquipment = (text, language = 'fra') => {
  const empty = { min: zeroVector(), max: zeroVector() };
  if (typeof text !== 'string' || !text.trim())
    return { ...empty, status: 'empty' };
  const value = normalize(text, language);
  if (
    /^(?:[\s/.,–—-]*|aucune?|rien|neant|keine?|not needed|none)$/.test(
      value.trim()
    )
  )
    return { ...empty, status: 'absence' };
  const nodes = readNodes(value);
  const groups = groupNodes(nodes, value);
  const merged = [];
  const consumed = groups.map(({ start, end }) => [start, end]);
  groups.forEach(group => {
    const previous = merged[merged.length - 1];
    if (
      previous &&
      /^\s*\(?\s*(?:ou|or|oder)\s*(?:y\s+sur\s*)?$/.test(
        value.slice(previous.end, group.start)
      )
    ) {
      consumed.push([previous.end, group.start]);
      previous.min = previous.min.map((n, i) => Math.min(n, group.min[i]));
      previous.max = previous.max.map((n, i) => Math.max(n, group.max[i]));
      previous.end = group.end;
      previous.isUncertain ||= group.isUncertain;
    } else merged.push(group);
  });
  // Positions refer to UTF-16 offsets from matchAll, including non-BMP text.
  const characters = value.split('');
  consumed.forEach(([start, end]) => characters.fill(' ', start, end));
  const kinds = nodes.map(node => node.kind);
  const inventoryOverlap =
    (kinds.includes('CARABINER') &&
      kinds.some(kind => ['S', 'B', 'G', 'P', 'DEV'].includes(kind))) ||
    (kinds.includes('HANGER') &&
      kinds.some(kind => ['S', 'G'].includes(kind))) ||
    (kinds.includes('SLING') &&
      kinds.some(kind => ['AN', 'AF', 'DEV'].includes(kind)));
  let isUncertain =
    inventoryOverlap ||
    merged.some(group => group.isUncertain) ||
    hasResidual(characters.join(''));
  const sumBound = bound =>
    EQUIPMENT_TYPES.map((_kind, i) =>
      merged.reduce((sum, group) => {
        isUncertain ||= !Number.isSafeInteger(sum + group[bound][i]);
        return addQuantity(sum, group[bound][i]);
      }, 0)
    );
  const min = sumBound('min');
  const max = sumBound('max');
  let status = 'unknown';
  if (max.some(n => n > 0)) status = isUncertain ? 'partial' : 'complete';
  return { min, max, status };
};

// Call once per sheet, with anchor cells only (observations may repeat them).
export const parseRiggingEquipment = (anchors, language) => {
  const totals = Object.fromEntries(
    EQUIPMENT_TYPES.map(kind => [kind, { min: 0, max: 0 }])
  );
  anchors.forEach(anchor => {
    const result = parseAnchorEquipment(anchor, language);
    EQUIPMENT_TYPES.forEach((kind, i) => {
      totals[kind].min = addQuantity(totals[kind].min, result.min[i]);
      totals[kind].max = addQuantity(totals[kind].max, result.max[i]);
    });
  });
  return totals;
};
