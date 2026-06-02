import { toSI } from './numberUtils';

const MAX_VALUES_PER_INSERT = 100;

/**
 * Generate the full SQL import script from wizard state.
 *
 * @param {object} params
 * @param {string} params.caveId - Cave ID to associate with
 * @param {string} params.pointLabel - Label for the observation point
 * @param {number} params.authorId - Caver ID of the importing user
 * @param {string} params.timezone - Timezone offset string (e.g., 'Europe/Paris', '+02:00')
 * @param {Array} params.columns - Column mapping array
 * @param {Array} params.rows - Validated data rows (already normalized numbers + parsed timestamps)
 * @param {string} params.deviceName - Device name
 * @returns {string} - The full SQL script
 */
const generateSql = ({
  caveId,
  pointLabel,
  authorId,
  timezone,
  columns,
  rows
}) => {
  const measurementCols = columns.filter(c => c.role === 'measurement');
  const timestampCol = columns.find(c => c.role === 'timestamp');

  if (!timestampCol || measurementCols.length === 0 || rows.length === 0) {
    return '-- No data to import.\n';
  }

  // Compute stats for each time series
  const seriesStats = measurementCols.map((col, idx) => {
    const values = rows
      .map(r => r[col.index])
      .filter(v => v != null && Number.isFinite(v));
    const timestamps = rows
      .map(r => r[timestampCol.index])
      .filter(t => t != null);

    return {
      col,
      idx,
      label: `ts_${idx}`,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
      count: values.length,
      startDate: timestamps.length
        ? timestamps[0]
        : null,
      endDate: timestamps.length
        ? timestamps[timestamps.length - 1]
        : null
    };
  });

  // Detect sampling interval from first few timestamps
  const detectSamplingInterval = () => {
    const timestamps = rows
      .slice(0, 10)
      .map(r => r[timestampCol.index])
      .filter(t => t != null);
    if (timestamps.length < 2) return null;
    const intervals = [];
    for (let i = 1; i < timestamps.length; i += 1) {
      const diff = (new Date(timestamps[i]) - new Date(timestamps[i - 1])) / 1000;
      intervals.push(diff);
    }
    const allSame = intervals.every(d => d === intervals[0]);
    return allSame ? intervals[0] : null;
  };

  const samplingInterval = detectSamplingInterval();

  const lines = [];

  // Header
  lines.push(`-- ============================================================`);
  lines.push(`-- Import: Cave ${caveId} observation data`);
  lines.push(`-- Point: ${pointLabel}`);
  lines.push(`-- Columns: ${measurementCols.map(c => c.quantityKind.code).join(', ')}`);
  lines.push(`-- Rows: ${rows.length}`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- ============================================================`);
  lines.push('');
  lines.push('BEGIN;');
  lines.push('');

  // Temp table
  lines.push('CREATE TEMP TABLE _import_ts_ids (');
  lines.push('  label TEXT PRIMARY KEY,');
  lines.push('  ts_id INT NOT NULL');
  lines.push(');');
  lines.push('');

  // Fix sequences
  lines.push('SELECT setval(\'t_device_id_seq\', (SELECT COALESCE(MAX(id), 0) FROM t_device));');
  lines.push('SELECT setval(\'t_sensor_configuration_id_seq\', (SELECT COALESCE(MAX(id), 0) FROM t_sensor_configuration));');
  lines.push('SELECT setval(\'t_point_id_seq\', (SELECT COALESCE(MAX(id), 0) FROM t_point));');
  lines.push('SELECT setval(\'t_observation_id_seq\', (SELECT COALESCE(MAX(id), 0) FROM t_observation));');
  lines.push('SELECT setval(\'t_time_series_id_seq\', (SELECT COALESCE(MAX(id), 0) FROM t_time_series));');
  lines.push('');

  // Device
  lines.push(`INSERT INTO t_device (name, brand_name)`);
  lines.push(`  VALUES ('Imported device', NULL);`);
  lines.push('');

  // PL/pgSQL block for dynamic IDs
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('  v_device_id INT;');
  lines.push('  v_point_id INT;');
  lines.push('  v_obs_id INT;');
  lines.push('  v_ts_id INT;');
  lines.push('BEGIN');
  lines.push('');
  lines.push('  v_device_id := currval(\'t_device_id_seq\');');
  lines.push('');

  // Sensor configurations
  measurementCols.forEach(col => {
    lines.push(`  INSERT INTO t_sensor_configuration (id_device, id_quantity_kind, id_unit)`);
    lines.push(`    VALUES (v_device_id, ${col.quantityKind.id}, ${col.unit.id});`);
  });
  lines.push('');

  // Point
  lines.push(`  INSERT INTO t_point (id_author, date_inscription, label, id_cave, is_deleted)`);
  lines.push(`    VALUES (${authorId}, now(), '${escapeSql(pointLabel)}', ${caveId}, false)`);
  lines.push('    RETURNING id INTO v_point_id;');
  lines.push('');

  // Observation
  const obsDate = seriesStats[0].startDate || new Date().toISOString();
  lines.push(`  INSERT INTO t_observation (`);
  lines.push(`    id_author, date_inscription, observation_date, id_point, id_cave,`);
  lines.push(`    id_observation_type, observation_type_code, point_label, is_deleted`);
  lines.push(`  ) VALUES (`);
  lines.push(`    ${authorId}, now(), '${obsDate}', v_point_id, ${caveId},`);
  lines.push(`    2, 'physical_measurements', '${escapeSql(pointLabel)}', false`);
  lines.push(`  ) RETURNING id INTO v_obs_id;`);
  lines.push('');

  // Time series
  const sensorConfigOffset = measurementCols.length;
  measurementCols.forEach((col, idx) => {
    const stats = seriesStats[idx];
    const mediumId = col.medium ? col.medium.id : 'NULL';
    const mediumCode = col.medium ? `'${col.medium.code}'` : 'NULL';
    const intervalSql = samplingInterval != null ? samplingInterval : 'NULL';
    const startSql = stats.startDate ? `'${stats.startDate}'` : 'NULL';
    const endSql = stats.endDate ? `'${stats.endDate}'` : 'NULL';
    const tzSql = timezone ? `'${escapeSql(timezone)}'` : 'NULL';

    lines.push(`  INSERT INTO t_time_series (`);
    lines.push(`    id_author, date_inscription, id_observation, id_sensor_configuration,`);
    lines.push(`    id_medium, sampling_interval_seconds, start_date, end_date,`);
    lines.push(`    measurement_count, min_value, max_value, data_quality,`);
    lines.push(`    quantity_kind_code, unit_symbol, medium_code, timezone_offset, is_deleted`);
    lines.push(`  ) VALUES (`);
    lines.push(`    ${authorId}, now(), v_obs_id, currval('t_sensor_configuration_id_seq') - ${sensorConfigOffset - idx - 1},`);
    lines.push(`    ${mediumId}, ${intervalSql}, ${startSql}, ${endSql},`);
    lines.push(`    ${stats.count}, ${stats.min}, ${stats.max}, 'raw',`);
    lines.push(`    '${col.quantityKind.code}', '${col.unit.symbol}', ${mediumCode}, ${tzSql}, false`);
    lines.push(`  ) RETURNING id INTO v_ts_id;`);
    lines.push(`  INSERT INTO _import_ts_ids VALUES ('${stats.label}', v_ts_id);`);
    lines.push('');
  });

  lines.push('END $$;');
  lines.push('');

  // Measurements - chunked inserts
  measurementCols.forEach((col, idx) => {
    const stats = seriesStats[idx];
    const validRows = rows.filter(
      r => r[timestampCol.index] != null && r[col.index] != null && Number.isFinite(r[col.index])
    );

    for (let chunk = 0; chunk < validRows.length; chunk += MAX_VALUES_PER_INSERT) {
      const batch = validRows.slice(chunk, chunk + MAX_VALUES_PER_INSERT);
      lines.push('INSERT INTO t_measurement (id_time_series, value, value_si, timestamp)');
      lines.push(`SELECT ts_id, v.value, v.value_si, v.ts FROM _import_ts_ids, (VALUES`);

      const valueLines = batch.map((row, i) => {
        const value = row[col.index];
        const valueSi = toSI(value, col.quantityKind);
        const ts = row[timestampCol.index];
        const comma = i < batch.length - 1 ? ',' : '';
        return `  (${value}::numeric, ${valueSi}::numeric, '${ts}'::timestamptz)${comma}`;
      });
      lines.push(...valueLines);

      lines.push(`) AS v(value, value_si, ts)`);
      lines.push(`WHERE _import_ts_ids.label = '${stats.label}';`);
      lines.push('');
    }
  });

  // Cleanup
  lines.push('DROP TABLE _import_ts_ids;');
  lines.push('');
  lines.push('COMMIT;');

  return lines.join('\n');
};

const escapeSql = str => (str || '').replace(/'/g, "''");

export default generateSql;
