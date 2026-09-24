import L from 'leaflet';
import RBush from 'rbush';

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

const readViewBox = svgEl => {
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

const estimateTextBBox = el => {
  const tx = parseFloat(el.getAttribute('x') || '0') || 0;
  const ty = parseFloat(el.getAttribute('y') || '0') || 0;
  const dx = parseFloat(el.getAttribute('dx') || '0') || 0;
  const dy = parseFloat(el.getAttribute('dy') || '0') || 0;
  let fs = parseFloat(el.getAttribute('font-size') || '');
  if (Number.isNaN(fs) || fs <= 0) {
    let ancestor = el.parentElement;
    while (ancestor && Number.isNaN(fs)) {
      fs = parseFloat(ancestor.getAttribute('font-size') || '');
      ancestor = ancestor.parentElement;
    }
    if (Number.isNaN(fs) || fs <= 0) fs = 10;
  }
  const text = el.textContent || '';
  const width = Math.max(1, text.length * fs * 0.7);
  const cx = tx + dx;
  const cy = ty + dy;
  return {
    minX: cx - fs,
    minY: cy - fs,
    maxX: cx + width + fs,
    maxY: cy + fs
  };
};

const canDescend = el => {
  if (el.tagName.toLowerCase() !== 'g') return false;
  return !OPAQUE_GROUP_ATTRS.some(a => el.hasAttribute(a));
};

const collectItems = (svgEl, serializer) => {
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
          minX: bbox.x,
          minY: bbox.y,
          maxX: bbox.x + bbox.width,
          maxY: bbox.y + bbox.height
        };
      }
      items.push({
        ...box,
        z: items.length,
        html: serializer.serializeToString(child)
      });
    }
  };
  walk(svgEl);
  return items;
};

const collectDefsHtml = (svgEl, serializer) =>
  Array.from(svgEl.children)
    .filter(c => {
      const t = c.tagName.toLowerCase();
      return t === 'defs' || t === 'style';
    })
    .map(c => serializer.serializeToString(c))
    .join('');

const ANCHOR_ID_PREFIX = 'anchor-';

const collectAnchors = group => {
  const anchors = {};
  if (!group) return anchors;
  for (const child of Array.from(group.children)) {
    const id = child.getAttribute('id') || '';
    if (!id.startsWith(ANCHOR_ID_PREFIX)) continue;
    const anchorId = id.slice(ANCHOR_ID_PREFIX.length);
    const cx = parseFloat(child.getAttribute('cx'));
    const cy = parseFloat(child.getAttribute('cy'));
    if (!Number.isNaN(cx) && !Number.isNaN(cy)) {
      anchors[anchorId] = [cx, cy];
      continue;
    }
    const x = parseFloat(child.getAttribute('x'));
    const y = parseFloat(child.getAttribute('y'));
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      anchors[anchorId] = [x, y];
    }
  }
  return anchors;
};

const collectRootAttrs = svgEl => {
  const parts = [];
  for (const attr of Array.from(svgEl.attributes)) {
    if (['viewBox', 'width', 'height', 'xmlns'].includes(attr.name)) continue;
    parts.push(
      ` ${attr.name}="${attr.value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')}"`
    );
  }
  return parts.join('');
};

export const loadSvg = async url => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load SVG (${response.status})`);
  const svgText = await response.text();
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Malformed SVG');
  const svgEl = doc.documentElement;

  let viewBox = readViewBox(svgEl);

  const host = document.createElement('div');
  host.style.cssText =
    'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;pointer-events:none';
  host.appendChild(svgEl);
  document.body.appendChild(host);
  try {
    const anchorsGroup = svgEl.querySelector('#anchors');
    const anchors = collectAnchors(anchorsGroup);
    if (anchorsGroup) anchorsGroup.remove();

    if (!viewBox) {
      const bbox = svgEl.getBBox();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        viewBox = { x: bbox.x, y: bbox.y, w: bbox.width, h: bbox.height };
      }
    }
    if (!viewBox || viewBox.w <= 0 || viewBox.h <= 0) {
      throw new Error('SVG has no computable dimensions');
    }

    const serializer = new XMLSerializer();
    const items = collectItems(svgEl, serializer);
    const defsHtml = collectDefsHtml(svgEl, serializer);
    const rootAttrsHtml = collectRootAttrs(svgEl);
    const index = new RBush();
    index.load(items);
    return { viewBox, items, index, defsHtml, rootAttrsHtml, anchors };
  } finally {
    document.body.removeChild(host);
  }
};

const SvgTileLayer = L.GridLayer.extend({
  initialize(options = {}) {
    L.setOptions(this, {
      tileSize: 256,
      keepBuffer: 2,
      updateWhenIdle: false,
      background: '#fff',
      minZoom: -Infinity,
      maxZoom: Infinity,
      ...options
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

    this._renderTile(canvas, coords, size)
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
    const { viewBox } = this.options;
    const layerH = layerBounds.getNorth() - layerBounds.getSouth();
    const layerW = layerBounds.getEast() - layerBounds.getWest();
    const scaleX = viewBox.w / layerW;
    const scaleY = viewBox.h / layerH;
    return {
      x: viewBox.x + (bounds.getWest() - layerBounds.getWest()) * scaleX,
      y: viewBox.y + (layerBounds.getNorth() - bounds.getNorth()) * scaleY,
      w: (bounds.getEast() - bounds.getWest()) * scaleX,
      h: (bounds.getNorth() - bounds.getSouth()) * scaleY,
      pxW: size.x,
      pxH: size.y
    };
  },

  _renderTile(canvas, coords, size) {
    const { index, defsHtml, rootAttrsHtml } = this.options;
    const svgBox = this._tileToSvgBox(coords);
    const visible = index.search({
      minX: svgBox.x,
      minY: svgBox.y,
      maxX: svgBox.x + svgBox.w,
      maxY: svgBox.y + svgBox.h
    });

    if (visible.length === 0) return Promise.resolve();

    visible.sort((a, b) => a.z - b.z);
    const bodyHtml = visible.map(it => it.html).join('');
    const svgString =
      `<svg xmlns="${SVG_NS}"${rootAttrsHtml} ` +
      `viewBox="${svgBox.x} ${svgBox.y} ${svgBox.w} ${svgBox.h}" ` +
      `width="${svgBox.pxW}" height="${svgBox.pxH}">` +
      `${defsHtml}${bodyHtml}</svg>`;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        canvas.getContext('2d').drawImage(img, 0, 0, size.x, size.y);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('SVG image failed to decode'));
      };
      img.src = url;
    });
  }
});

export default SvgTileLayer;
