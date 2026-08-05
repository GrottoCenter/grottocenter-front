// Shared legends for rigging notation (obstacles and anchors).
// Each item maps an i18n abbreviation key to its i18n label key.
// Used by the read-only table (Entry/Riggings) and the edition toolbars
// (EntitiesForm/Riggings) — keep a single source of truth here.

export const OBSTACLE_LEGEND = [
  { abbrevKey: 'obstacle.abbrev.pit', labelKey: 'obstacle.label.pit' },
  { abbrevKey: 'obstacle.abbrev.step', labelKey: 'obstacle.label.step' },
  { abbrevKey: 'obstacle.abbrev.climb', labelKey: 'obstacle.label.climb' },
  {
    abbrevKey: 'obstacle.abbrev.waterfall',
    labelKey: 'obstacle.label.waterfall'
  },
  { abbrevKey: 'obstacle.abbrev.handline', labelKey: 'obstacle.label.handline' }
];

export const ANCHOR_LEGEND = [
  { abbrevKey: 'anchor.abbrev.spit', labelKey: 'anchor.label.spit' },
  { abbrevKey: 'anchor.abbrev.bolt', labelKey: 'anchor.label.bolt' },
  { abbrevKey: 'anchor.abbrev.expansion', labelKey: 'anchor.label.expansion' },
  { abbrevKey: 'anchor.abbrev.piton', labelKey: 'anchor.label.piton' },
  { abbrevKey: 'anchor.abbrev.natural', labelKey: 'anchor.label.natural' },
  { abbrevKey: 'anchor.abbrev.soft', labelKey: 'anchor.label.soft' },
  { abbrevKey: 'anchor.abbrev.drilled', labelKey: 'anchor.label.drilled' },
  { abbrevKey: 'anchor.abbrev.redirect', labelKey: 'anchor.label.redirect' }
];
