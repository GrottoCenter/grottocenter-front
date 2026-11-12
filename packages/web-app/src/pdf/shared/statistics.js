import { contribution, entityUrl } from './model';

export const hasPdfStatistics = statistics =>
  Number.isFinite(statistics?.nb_entrances);

export const makeStatisticsPdfBlock = (
  entity,
  statistics,
  intl,
  entityType,
  origin
) => {
  const t = id => intl.formatMessage({ id });
  const counts = [
    ...[
      ['nb_entrances', 'entrance_count', 'entrance'],
      ['nb_networks', 'network_count', 'network'],
      ['diving_caves', 'diveable_caves', 'diving_cave']
    ].flatMap(([field, id, icon]) =>
      Number.isFinite(statistics[field])
        ? [
            {
              key: field,
              label: intl.formatNumber(statistics[field]),
              value: intl.formatMessage({ id }, { count: statistics[field] }),
              icon
            }
          ]
        : []
    ),
    ...(Number.isFinite(statistics.nb_massifs)
      ? [
          {
            key: 'nb_massifs',
            label: intl.formatNumber(statistics.nb_massifs),
            value: t(statistics.nb_massifs === 1 ? 'massif' : 'massifs'),
            icon: 'massif'
          }
        ]
      : [])
  ];
  const measurements = [];
  for (const [label, value, icon] of [
    ['average depth', statistics.avg?.avg_depth, 'depth'],
    ['average length', statistics.avg?.avg_length, 'length'],
    ['cumulated length', statistics.total_length?.value, 'length']
  ]) {
    if (!Number.isFinite(value)) continue;
    let text = `${intl.formatNumber(value, { maximumFractionDigits: 1 })} m`;
    if (
      label === 'cumulated length' &&
      Number.isFinite(statistics.total_length?.nb_data)
    ) {
      text += ` (${intl.formatMessage(
        { id: 'pdf.cavesWithKnownLength' },
        { count: statistics.total_length.nb_data }
      )})`;
    }
    measurements.push({ key: label, label: t(label), value: text, icon });
  }
  const values = [];
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
  return {
    key: 'statistics',
    type: 'contributions',
    title: t('More information'),
    items: [
      ...[counts, measurements]
        .filter(details => details.length > 0)
        .map((details, index) => ({
          ...contribution({ id: `statistics-${index}` }, intl),
          details
        })),
      {
        ...contribution({ id: entity.id, body: values.join('\n') }, intl),
        metadata: t(
          'Statistics are recomputed periodically and may not reflect the latest changes.'
        )
      }
    ]
  };
};
