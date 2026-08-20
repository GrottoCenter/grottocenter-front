import * as L from 'leaflet';
import './setupLeafletRotate';

describe('setupLeafletRotate', () => {
  it('ignores non-element drag targets when adding or removing classes', () => {
    expect(() =>
      L.DomUtil.addClass(document, 'leaflet-drag-target')
    ).not.toThrow();
    expect(() =>
      L.DomUtil.removeClass(window, 'leaflet-drag-target')
    ).not.toThrow();
  });

  it('keeps Leaflet class utilities working for DOM elements', () => {
    const element = document.createElement('div');

    L.DomUtil.addClass(element, 'leaflet-drag-target');
    expect(element).toHaveClass('leaflet-drag-target');

    L.DomUtil.removeClass(element, 'leaflet-drag-target');
    expect(element).not.toHaveClass('leaflet-drag-target');
  });
});
