import layers from './mapLayers';

describe('mapLayers', () => {
  it('uses the canonical OpenStreetMap tile endpoint', () => {
    const osmLayer = layers.find(layer => layer.id === 'osm');

    expect(osmLayer.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(osmLayer.referrerPolicy).toBe('strict-origin-when-cross-origin');
  });
});
