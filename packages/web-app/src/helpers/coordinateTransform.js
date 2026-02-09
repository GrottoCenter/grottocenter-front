import proj4 from 'proj4';

/**
 * Register projections with proj4
 * @param {Array} projections - Array of projection objects with code and definition
 */
export const registerProjections = projections => {
  if (!projections) return;

  projections.forEach(proj => {
    if (proj.code && proj.definition) {
      proj4.defs(proj.code, proj.definition);
    }
  });
};

/**
 * Transform coordinates from any CRS to WGS84 (EPSG:4326)
 * @param {Array} coords - Coordinate array (can be nested for polygons)
 * @param {string} sourceCRS - Source CRS identifier (e.g., 'urn:ogc:def:crs:EPSG::2154' or 'EPSG:2154')
 * @param {number} depth - Nesting depth (0 for [x,y], 1 for [[x,y],...], etc.)
 * @returns {Array} Transformed coordinates in WGS84
 * @throws {Error} If CRS is unknown or transformation fails
 */
export const transformToWGS84 = (coords, sourceCRS, depth = 0) => {
  if (
    !sourceCRS ||
    sourceCRS === 'urn:ogc:def:crs:OGC:1.3:CRS84' ||
    sourceCRS === 'EPSG:4326'
  ) {
    return coords;
  }

  const epsgMatch = sourceCRS.match(/EPSG::?(\d+)/);
  if (!epsgMatch) {
    throw new Error(`Unknown CRS format: ${sourceCRS}`);
  }

  const sourceProj = `EPSG:${epsgMatch[1]}`;
  const targetProj = 'EPSG:4326';

  // Verify the projection is registered before attempting transformation
  if (!proj4.defs(sourceProj)) {
    throw new Error(
      `Projection ${sourceProj} is not registered. ` +
        `The file's coordinate system may not be supported.`
    );
  }

  const transform = (coordArray, currentDepth) => {
    if (currentDepth === 0) {
      const [x, y] = coordArray;
      return proj4(sourceProj, targetProj, [x, y]);
    }
    return coordArray.map(item => transform(item, currentDepth - 1));
  };

  return transform(coords, depth);
};
