import L from 'leaflet';

const SVG_NS = 'http://www.w3.org/2000/svg';
const IGNORED_TAGS = new Set([
  'defs',
  'style',
  'title',
  'desc',
  'metadata'
]);
const OPAQUE_GROUP_ATTRS = [
  'transform',
  'style',
  'class',
  'filter',
  'mask',
  'clip-path',
  'opacity'
];

export const readViewBox = svgEl => {
  const attr = svgEl.getAttribute('viewBox');
  if (attr) {
    const parts = attr.split(/[\s,]+/).map(parseFloat);
    if (parts.length === 4 && parts.every(n => !Number.isNaN(n))) {
      return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
    }
  }
  const w = parseFloat(svgEl.getAttribute('width'));
  const h = parseFloat(svgEl.getAttribute('height'));
  if (!Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0) {
    return { x: 0, y: 0, w, h };
  }
  return null;
};

const computeRootBBox = svgEl => {
  const host = document.createElement('div');
  host.style.cssText =
    'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;pointer-events:none';
  host.appendChild(svgEl);
  document.body.appendChild(host);
  try {
    const bbox = svgEl.getBBox();
    if (bbox && bbox.width > 0 && bbox.height > 0) {
      return { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
    }
    return null;
  } finally {
    document.body.removeChild(host);
  }
};

export const fetchSvg = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load SVG (${response.status})`);
  const svgText = await response.text();
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Malformed SVG');
  const svgEl = doc.documentElement;
  let viewBox = readViewBox(svgEl);
  if (!viewBox) viewBox = computeRootBBox(svgEl.cloneNode(true));
  if (!viewBox || viewBox.w <= 0 || viewBox.h <= 0) {
    throw new Error('SVG has no computable dimensions');
  }
  return { svgText, viewBox };
};

const estimateTextBBox = el => {
  const tx = parseFloat(el.getAttribute('x') || '0');
  const ty = parseFloat(el.getAttribute('y') || '0');
  const fs = parseFloat(el.getAttribute('font-size') || '10') || 10;
  const text = el.textContent || '';
  const width = Math.max(1, text.length * fs * 0.7);
  return {
    x: tx - fs,
    y: ty - fs,
    right: tx + width + fs,
    bottom: ty + fs
  };
};

const canDescend = el => {
  if (el.tagName.toLowerCase() !== 'g') return false;
  return !OPAQUE_GROUP_ATTRS.some(a => el.hasAttribute(a));
};

const collectItems = svgEl => {
  const items = [];
  const walk = node => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase();
      if (IGNORED_TAGS.has(tag)) continue;
      if (canDescend(child)) {
        walk(child);
        continue;
      }
      let box;
      if (tag === 'text') {
        box = estimateTextBBox(child);
      } else {
        let bbox;
        try {
          bbox = child.getBBox();
        } catch (e) {
          continue;
        }
        if (!bbox || (bbox.width === 0 && bbox.height === 0)) continue;
        box = {
          x: bbox.x,
          y: bbox.y,
          right: bbox.x + bbox.width,
          bottom: bbox.y + bbox.height
        };
      }
      items.push({ node: child, ...box });
    }
  };
  walk(svgEl);
  return items;
};

const collectDefsNodes = svgEl => {
  const nodes = [];
  for (const child of Array.from(svgEl.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === 'defs' || tag === 'style') nodes.push(child);
  }
  return nodes;
};

const collectRootAttrs = svgEl => {
  const attrs = {};
  for (const attr of Array.from(svgEl.attributes)) {
    if (['viewBox', 'width', 'height'].includes(attr.name)) continue;
    attrs[attr.name] = attr.value;
  }
  return attrs;
};

const SvgTileLayer = L.GridLayer.extend({
  initialize(url, options = {}) {
    L.setOptions(this, {
      tileSize: 256,
      keepBuffer: 2,
      updateWhenIdle: false,
      background: '#fff',
      minZoom: -Infinity,
      maxZoom: Infinity,
      ...options
    });
    this._url = url;
    this._ready = null;
  },

  onAdd(map) {
    this._ready = this._load();
    return L.GridLayer.prototype.onAdd.call(this, map);
  },

  onRemove(map) {
    if (this._hiddenHost && this._hiddenHost.parentNode) {
      this._hiddenHost.parentNode.removeChild(this._hiddenHost);
    }
    this._hiddenHost = null;
    this._items = null;
    this._defs = null;
    return L.GridLayer.prototype.onRemove.call(this, map);
  },

  _load() {
    const preload =
      this.options.svgText && this.options.viewBox
        ? Promise.resolve({
            svgText: this.options.svgText,
            viewBox: this.options.viewBox
          })
        : fetchSvg(this._url);

    return preload.then(({ svgText, viewBox }) => {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      const svgEl = doc.documentElement;

      const hiddenHost = document.createElement('div');
      hiddenHost.style.cssText =
        'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;pointer-events:none';
      const mountedSvg = svgEl.cloneNode(true);
      hiddenHost.appendChild(mountedSvg);
      document.body.appendChild(hiddenHost);

      this._viewBox = viewBox;
      this._items = collectItems(mountedSvg);
      this._defs = collectDefsNodes(mountedSvg).map(d => d.cloneNode(true));
      this._rootAttrs = collectRootAttrs(svgEl);
      this._hiddenHost = hiddenHost;
    });
  },

  createTile(coords, done) {
    const size = this.getTileSize();
    const canvas = L.DomUtil.create('canvas', 'leaflet-tile');
    canvas.width = size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = this.options.background;
    ctx.fillRect(0, 0, size.x, size.y);

    this._ready
      .then(() => this._renderTile(canvas, coords, size))
      .then(() => done(null, canvas))
      .catch(err => {
        ctx.fillStyle = 'red';
        ctx.font = '11px sans-serif';
        ctx.fillText(String(err && err.message).slice(0, 30), 5, 15);
        done(err, canvas);
      });

    return canvas;
  },

  _tileToSvgBox(coords) {
    const size = this.getTileSize();
    const bounds = this._tileCoordsToBounds(coords);
    const layerBounds = L.latLngBounds(this.options.bounds);
    const layerH = layerBounds.getNorth() - layerBounds.getSouth();
    const layerW = layerBounds.getEast() - layerBounds.getWest();
    const scaleX = this._viewBox.w / layerW;
    const scaleY = this._viewBox.h / layerH;
    return {
      x: this._viewBox.x + (bounds.getWest() - layerBounds.getWest()) * scaleX,
      y:
        this._viewBox.y +
        (layerBounds.getNorth() - bounds.getNorth()) * scaleY,
      w: (bounds.getEast() - bounds.getWest()) * scaleX,
      h: (bounds.getNorth() - bounds.getSouth()) * scaleY,
      pxW: size.x,
      pxH: size.y
    };
  },

  _renderTile(canvas, coords, size) {
    const svgBox = this._tileToSvgBox(coords);
    const right = svgBox.x + svgBox.w;
    const bottom = svgBox.y + svgBox.h;

    const visible = this._items.filter(
      it =>
        it.right >= svgBox.x &&
        it.x <= right &&
        it.bottom >= svgBox.y &&
        it.y <= bottom
    );

    if (visible.length === 0) return Promise.resolve();

    const svg = document.createElementNS(SVG_NS, 'svg');
    for (const [name, value] of Object.entries(this._rootAttrs)) {
      svg.setAttribute(name, value);
    }
    svg.setAttribute('xmlns', SVG_NS);
    svg.setAttribute('viewBox', `${svgBox.x} ${svgBox.y} ${svgBox.w} ${svgBox.h}`);
    svg.setAttribute('width', svgBox.pxW);
    svg.setAttribute('height', svgBox.pxH);
    for (const def of this._defs) svg.appendChild(def.cloneNode(true));
    for (const it of visible) svg.appendChild(it.node.cloneNode(true));

    const svgString = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        canvas.getContext('2d').drawImage(img, 0, 0, size.x, size.y);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = err => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  }
});

export default SvgTileLayer;
