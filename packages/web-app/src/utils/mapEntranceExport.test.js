import L from 'leaflet';
import {
  captureMapExportSelection,
  getMapExportBounds,
  makeMapExportSearch,
  prepareMapExportBlob
} from './mapEntranceExport';

const selection = { south: -0.1, west: -0.1, north: 0.1, east: 0.1 };
const bounds = getMapExportBounds(selection);
const file = text => ({ text: async () => text });
const link = 'https://grottocenter.org/ui/entrances/1';
const examples = {
  gpx: `<gpx xmlns="http://www.topografix.com/GPX/1/1"><wpt lat="0" lon="0"><name>Grotte &amp; été</name><link href="${
    link
  }" /></wpt></gpx>`,
  kml: `<kml xmlns="http://www.opengis.net/kml/2.2"><Document><Placemark><name>Grotte &amp; été</name><Point><coordinates>0,0</coordinates></Point><ExtendedData><Data name="grottocenterUrl"><value>${
    link
  }</value></Data></ExtendedData></Placemark></Document></kml>`,
  geojson: JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [0, 0] },
        properties: { name: 'Grotte & été', grottocenterUrl: link }
      }
    ]
  })
};

it('captures real Leaflet bounds without retaining a moving map', () => {
  const container = document.createElement('div');
  Object.defineProperties(container, {
    clientWidth: { value: 600 },
    clientHeight: { value: 400 }
  });
  document.body.appendChild(container);
  const map = L.map(container).setView([0, 0], 13);
  try {
    const snapshot = captureMapExportSelection(map);
    const original = JSON.stringify(snapshot);
    expect(getMapExportBounds(snapshot)).toHaveLength(1);
    map.panTo([45, 6], { animate: false });
    expect(JSON.stringify(snapshot)).toBe(original);
    expect(captureMapExportSelection(map)).not.toEqual(snapshot);
  } finally {
    map.remove();
    container.remove();
  }
});

it('allows large areas and normalizes viewports spanning multiple worlds', () => {
  expect(
    getMapExportBounds({ south: -10, west: -20, north: 10, east: 20 })
  ).toEqual([{ sw_lat: -10, sw_lng: -20, ne_lat: 10, ne_lng: 20 }]);
  expect(
    getMapExportBounds({ south: -95, west: -540, north: 95, east: 540 })
  ).toEqual([{ sw_lat: -90, sw_lng: -180, ne_lat: 90, ne_lng: 180 }]);
  expect(() => getMapExportBounds({ ...selection, east: NaN })).toThrow(
    'mapExport.error'
  );
});

it('splits an antimeridian viewport into two bounded range queries', () => {
  expect(getMapExportBounds({ ...selection, west: 170, east: 190 })).toEqual([
    { sw_lat: -0.1, sw_lng: 170, ne_lat: 0.1, ne_lng: 180 },
    { sw_lat: -0.1, sw_lng: -180, ne_lat: 0.1, ne_lng: -170 }
  ]);
});

it('sends only geographic ranges and public visibility, without identifiers or map filters', () => {
  const search = makeMapExportSearch(bounds[0]);
  expect(search).toEqual({
    entity: 'entrances',
    query: '*',
    matchAllFields: true,
    filter: {
      latitude: [-0.1, 0.1],
      longitude: [-0.1, 0.1],
      isSensitive: false
    }
  });
  expect(JSON.stringify(search).length).toBeLessThan(400);
});

it.each(['gpx', 'kml', 'geojson'])(
  'accepts complete %s with escaped names, zero coordinates and canonical links',
  async format => {
    const blob = file(examples[format]);
    await expect(prepareMapExportBlob([blob], format, bounds)).resolves.toBe(
      blob
    );
    await expect(
      prepareMapExportBlob(
        [file(examples[format].slice(0, -5))],
        format,
        bounds
      )
    ).rejects.toThrow('mapExport.invalidFile');
    await expect(
      prepareMapExportBlob(
        [blob],
        format,
        getMapExportBounds({ ...selection, south: 1, north: 2 })
      )
    ).rejects.toThrow('mapExport.invalidFile');
  }
);

it.each(['gpx', 'kml', 'geojson'])(
  'accepts entrance links from other API environments in %s',
  async format => {
    await Promise.all(
      [
        'http://localhost:1337/ui/entrances/1',
        'https://staging.grottocenter.org/ui/entrances/1/',
        'https://fr.wikicaves.org/ui/entrances/1?language=fr'
      ].map(url => {
        const blob = file(examples[format].replace(link, url));
        return expect(
          prepareMapExportBlob([blob], format, bounds)
        ).resolves.toBe(blob);
      })
    );
  }
);

it.each([
  'not a URL',
  'https://grottocenter.org/ui/caves/1',
  'https://grottocenter.org/ui/entrances/invalid',
  'https://grottocenter.org/other/ui/entrances/1'
])('rejects an invalid entrance link: %s', async url => {
  await expect(
    prepareMapExportBlob(
      [file(examples.geojson.replace(link, url))],
      'geojson',
      bounds
    )
  ).rejects.toThrow('mapExport.invalidFile');
});

it.each(['gpx', 'kml', 'geojson'])(
  'accepts rounding at each %s viewport edge but rejects larger deviations',
  async format => {
    const blob = file(examples[format]);
    await Promise.all(
      [
        ['south', 1],
        ['north', -1],
        ['west', 1],
        ['east', -1]
      ].flatMap(([edge, direction]) => [
        expect(
          prepareMapExportBlob(
            [blob],
            format,
            getMapExportBounds({ ...selection, [edge]: direction * 5e-7 })
          )
        ).resolves.toBe(blob),
        expect(
          prepareMapExportBlob(
            [blob],
            format,
            getMapExportBounds({ ...selection, [edge]: direction * 2e-6 })
          )
        ).rejects.toThrow('mapExport.invalidFile')
      ])
    );
  }
);

it.each(['gpx', 'kml', 'geojson'])(
  'combines both sides of the antimeridian into one %s document',
  async format => {
    const wrapped = getMapExportBounds({ ...selection, west: 170, east: 190 });
    const replaceLongitude = value =>
      examples[format]
        .replace('lon="0"', `lon="${value}"`)
        .replace('>0,0<', `>${value},0<`)
        .replace('"coordinates":[0,0]', `"coordinates":[${value},0]`);
    const first = replaceLongitude(179);
    const second = replaceLongitude(-179).replace(
      '/entrances/1',
      '/entrances/2'
    );
    const blob = await prepareMapExportBlob(
      [file(first), file(second)],
      format,
      wrapped
    );
    const text = await blob.text();
    expect(text).toContain('/entrances/1');
    expect(text).toContain('/entrances/2');
    expect(text).toContain('-179');
    if (format === 'geojson') expect(JSON.parse(text).features).toHaveLength(2);
    else
      expect(
        new DOMParser()
          .parseFromString(text, 'application/xml')
          .getElementsByTagNameNS('*', format === 'gpx' ? 'wpt' : 'Placemark')
      ).toHaveLength(2);
  }
);

it('rejects empty, duplicate and oversized files', async () => {
  const data = JSON.parse(examples.geojson);
  const feature = data.features[0];
  await Promise.all(
    [
      [[], 'empty'],
      [[feature, feature], 'invalidFile'],
      [
        Array.from({ length: 10001 }, (_, id) => ({
          ...feature,
          properties: { ...feature.properties, grottocenterUrl: link + id }
        })),
        'tooMany'
      ]
    ].map(([features, error]) =>
      expect(
        prepareMapExportBlob(
          [file(JSON.stringify({ ...data, features }))],
          'geojson',
          bounds
        )
      ).rejects.toThrow(`mapExport.${error}`)
    )
  );
});

it('rejects missing XML coordinates instead of interpreting them as zero', async () => {
  await expect(
    prepareMapExportBlob(
      [file(examples.gpx.replace('lat="0"', 'lat=""'))],
      'gpx',
      bounds
    )
  ).rejects.toThrow('mapExport.invalidFile');
  await expect(
    prepareMapExportBlob(
      [file(examples.kml.replace('>0,0<', '>,<'))],
      'kml',
      bounds
    )
  ).rejects.toThrow('mapExport.invalidFile');
});

it('rejects duplicate entrance identifiers across the two antimeridian files', async () => {
  const wrapped = getMapExportBounds({ ...selection, west: 170, east: 190 });
  const data = JSON.parse(examples.geojson);
  const blobs = [179, -179].map((longitude, index) =>
    file(
      JSON.stringify({
        ...data,
        features: data.features.map(feature => ({
          ...feature,
          geometry: { type: 'Point', coordinates: [longitude, 0] },
          properties: {
            ...feature.properties,
            grottocenterUrl:
              index === 0 ? link : 'http://localhost:1337/ui/entrances/1/'
          }
        }))
      })
    )
  );
  await expect(prepareMapExportBlob(blobs, 'geojson', wrapped)).rejects.toThrow(
    'mapExport.invalidFile'
  );
});
