import { entityUrl, makePdfBlock } from './model';

export const hasPdfStatistics = statistics =>
  Number.isFinite(statistics?.nb_caves);

export const makeStatisticsPdfBlock = (
  entity,
  statistics,
  intl,
  entityType,
  origin
) => {
  const t = id => intl.formatMessage({ id });
  const values = [
    ...[
      ['nb_caves', 'cave_with_entrances'],
      ['nb_networks', 'network_count'],
      ['diving_caves', 'diveable_caves']
    ].flatMap(([field, id]) =>
      Number.isFinite(statistics[field])
        ? [
            `${intl.formatNumber(statistics[field])} ${intl.formatMessage({ id }, { count: statistics[field] })}`
          ]
        : []
    ),
    ...(Number.isFinite(statistics.nb_massifs)
      ? [
          `${intl.formatNumber(statistics.nb_massifs)} ${t(statistics.nb_massifs === 1 ? 'massif' : 'massifs')}`
        ]
      : [])
  ];
  for (const [label, value] of [
    ['average depth', statistics.avg?.avg_depth],
    ['average length', statistics.avg?.avg_length],
    ['cumulated length', statistics.total_length?.value]
  ]) {
    if (Number.isFinite(value))
      values.push(
        `${t(label)}: ${intl.formatNumber(value, { maximumFractionDigits: 1 })} m`
      );
  }
  if (Number.isFinite(statistics.total_length?.nb_data))
    values.push(
      `${t('Calculated on')} ${intl.formatNumber(statistics.total_length.nb_data)} ${t('caves')}`
    );
  for (const [field, label] of [
    ['cave_with_max_depth', 'is the deepest cave of the'],
    ['cave_with_max_length', 'is the longest cave of the']
  ]) {
    const cave = statistics[field];
    if (!cave || !Number.isFinite(cave.value)) continue;
    values.push(
      `${cave.name_cave ?? ''} · ${intl.formatNumber(cave.value)} m · ${t(label)} ${t(entityType)}`
    );
    if (cave.id_cave != null)
      values.push(entityUrl('caves', cave.id_cave, origin));
  }
  return makePdfBlock(
    'statistics',
    'More information',
    [
      {
        id: entity.id,
        title: t(
          'Statistics are recomputed periodically and may not reflect the latest changes.'
        ),
        body: values.join('\n')
      }
    ],
    intl
  );
};
