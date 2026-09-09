import L from 'leaflet';

const SVG_NS = 'http://www.w3.org/2000/svg';

const parseViewBox = svgEl => {
  const attr = svgEl.getAttribute('viewBox');
  if (!attr) return null;
  const parts = attr.split(/[\s,]+/).map(parseFloat);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return { x: parts[0], y: parts[1], w: parts[2], h: parts[3] };
};

const estimateTextBBox = el => {
  const tx = parseFloat(el.getAttribute('x') || '0');
  const ty = parseFloat(el.getAttribute('y') || '0');
  const fs = parseFloat(el.getAttribute('font-size') || '10');
  const text = el.textContent || '';
  const width = Math.max(1, text.length * fs * 0.7);
  return {
    x: tx - fs,
    y: ty - fs,
    right: tx + width + fs,
    bottom: ty + fs
  };
};

const collectBBoxes = svgEl => {
  const items = [];
  for (const child of Array.from(svgEl.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === 'defs' || tag === 'style' || tag === 'title' || tag === 'desc')
      continue;

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
  return items;
};

const collectDefinitions = svgEl => {
  const defs = [];
  for (const child of Array.from(svgEl.children)) {
    const tag = child.tagName.toLowerCase();
    if (tag === 'defs' || tag === 'style') defs.push(child);
  }
  return defs;
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
    return L.GridLayer.prototype.onRemove.call(this, map);
  },

  _load() {
    console.log('[SvgTileLayer] loading', this._url);
    const t0 = performance.now();
    return fetch(this._url)
      .then(response => response.text())
      .then(svgText => {
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        const svgEl = doc.documentElement;
        const viewBox = parseViewBox(svgEl);
        if (!viewBox) throw new Error('SVG has no valid viewBox');

        const hiddenHost = document.createElement('div');
        hiddenHost.style.cssText =
          'position:absolute;left:-99999px;top:-99999px;width:1px;height:1px;overflow:hidden;pointer-events:none';
        const mountedSvg = svgEl.cloneNode(true);
        hiddenHost.appendChild(mountedSvg);
        document.body.appendChild(hiddenHost);

        const items = collectBBoxes(mountedSvg);
        const defs = collectDefinitions(mountedSvg);

        this._viewBox = viewBox;
        this._items = items;
        this._defs = defs.map(d => d.cloneNode(true));
        this._sourceSvgAttrs = {};
        for (const attr of Array.from(svgEl.attributes)) {
          if (attr.name === 'viewBox' || attr.name === 'width' || attr.name === 'height')
            continue;
          this._sourceSvgAttrs[attr.name] = attr.value;
        }
        this._hiddenHost = hiddenHost;

        console.log(
          `[SvgTileLayer] parsed ${items.length} bboxed elements + ${defs.length} defs blocks in ${(performance.now() - t0).toFixed(0)}ms`
        );
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
        console.error('[SvgTileLayer] tile render failed', coords, err);
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
      y: this._viewBox.y + (layerBounds.getNorth() - bounds.getNorth()) * scaleY,
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

    const t0 = performance.now();
    const visible = this._items.filter(
      it =>
        it.right >= svgBox.x &&
        it.x <= right &&
        it.bottom >= svgBox.y &&
        it.y <= bottom
    );

    if (visible.length === 0) {
      return Promise.resolve();
    }

    const svg = document.createElementNS(SVG_NS, 'svg');
    for (const [name, value] of Object.entries(this._sourceSvgAttrs)) {
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
    const t1 = performance.now();

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        canvas.getContext('2d').drawImage(img, 0, 0, size.x, size.y);
        URL.revokeObjectURL(url);
        console.log(
          `[SvgTileLayer] tile ${coords.x},${coords.y},z${coords.z}: ${visible.length} els, build ${(t1 - t0).toFixed(0)}ms, raster ${(performance.now() - t1).toFixed(0)}ms`
        );
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
