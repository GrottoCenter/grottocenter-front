import { CRS, latLng, point } from 'leaflet';
import { apiFetch } from '@/api/client';
import { API_URL } from '@/conf/apiRoutes';
import mapLayers from '@/components/common/Maps/common/mapLayers';

export const fetchPdfResource = async (url, signal) => {
  const timeout = AbortSignal.timeout(30000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const parsed = new URL(url);
  const api = API_URL ? new URL(API_URL) : null;
  const isApi =
    api && parsed.origin === api.origin && parsed.pathname.startsWith('/api/');
  const response = isApi
    ? await apiFetch(url, { signal: requestSignal })
    : await fetch(url, { signal: requestSignal, credentials: 'omit' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.arrayBuffer();
};

export const createPdfMap = async (coordinates, zoom, signal, colors) => {
  const width = 1200;
  const height = 500;
  const tileSize = 256;
  const markers = coordinates.points ?? [coordinates];
  const polygons = coordinates.polygons ?? [];
  const positions = [
    ...markers.map(marker => [marker.longitude, marker.latitude]),
    ...polygons.flat(2)
  ];
  const project = (position, level) =>
    CRS.EPSG3857.latLngToPoint(latLng(position[1], position[0]), level);
  const boundsAt = level =>
    positions.reduce(
      (bounds, position) => {
        const projected = project(position, level);
        return {
          left: Math.min(bounds.left, projected.x),
          right: Math.max(bounds.right, projected.x),
          top: Math.min(bounds.top, projected.y),
          bottom: Math.max(bounds.bottom, projected.y)
        };
      },
      { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity }
    );
  if (!positions.length) throw new Error('Empty map geometry');
  let mapZoom = coordinates.fit ? 16 : zoom;
  let bounds = boundsAt(mapZoom);
  while (
    coordinates.fit &&
    mapZoom > 0 &&
    (bounds.right - bounds.left > width - 120 ||
      bounds.bottom - bounds.top > height - 120)
  ) {
    mapZoom--;
    bounds = boundsAt(mapZoom);
  }
  const center = point(
    (bounds.left + bounds.right) / 2,
    (bounds.top + bounds.bottom) / 2
  );
  const left = center.x - width / 2;
  const top = center.y - height / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  const layer = mapLayers.find(item => item.id === 'osm');
  const jobs = [];
  const worldTiles = 2 ** mapZoom;
  for (let x = Math.floor(left / tileSize); x * tileSize < left + width; x++)
    for (let y = Math.floor(top / tileSize); y * tileSize < top + height; y++) {
      if (y < 0 || y >= worldTiles) continue;
      const tileX = ((x % worldTiles) + worldTiles) % worldTiles;
      const url = layer.url
        .replace('{z}', mapZoom)
        .replace('{x}', tileX)
        .replace('{y}', y);
      jobs.push(
        fetchPdfResource(url, signal).then(async bytes => {
          const image = await createImageBitmap(new Blob([bytes]));
          try {
            signal.throwIfAborted();
            context.drawImage(image, x * tileSize - left, y * tileSize - top);
          } finally {
            image.close();
          }
        })
      );
    }
  await Promise.all(jobs);
  signal.throwIfAborted();
  context.strokeStyle = colors.primary;
  context.fillStyle = colors.primaryLight;
  context.lineWidth = 4;
  for (const polygon of polygons) {
    context.beginPath();
    for (const ring of polygon) {
      ring.forEach((position, index) => {
        const projected = project(position, mapZoom);
        if (index === 0) context.moveTo(projected.x - left, projected.y - top);
        else context.lineTo(projected.x - left, projected.y - top);
      });
      context.closePath();
    }
    context.save();
    context.globalAlpha = 0.25;
    context.fill('evenodd');
    context.restore();
    context.stroke();
  }
  for (const marker of markers) {
    const projected = project([marker.longitude, marker.latitude], mapZoom);
    const x = projected.x - left;
    const y = projected.y - top;
    context.fillStyle = colors.primary;
    context.beginPath();
    context.arc(x, y, marker.label ? 18 : 11, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = colors.contrastText;
    context.lineWidth = 3;
    context.stroke();
    if (marker.label) {
      context.fillStyle = colors.contrastText;
      context.font = 'bold 20px sans-serif';
      context.textAlign = 'center';
      context.fillText(marker.label, x, y + 7);
    }
  }
  context.textAlign = 'left';
  const centerLatitude = CRS.EPSG3857.pointToLatLng(center, mapZoom).lat;
  const metersPerPixel =
    (40075016.686 * Math.cos((centerLatitude * Math.PI) / 180)) /
    (worldTiles * tileSize);
  const scale = 10 ** Math.floor(Math.log10(metersPerPixel * 180));
  const scaleWidth = scale / metersPerPixel;
  context.fillStyle = colors.paper;
  context.fillRect(15, height - 65, scaleWidth + 20, 55);
  context.fillStyle = colors.text;
  context.font = '22px sans-serif';
  context.fillText(`${scale} m`, 25, height - 37);
  context.fillRect(25, height - 28, scaleWidth, 4);
  const blob = await new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
  if (!blob) throw new Error('Map encoding failed');
  return {
    image: new Uint8Array(await blob.arrayBuffer()),
    attribution: '© OpenStreetMap contributors · ODbL',
    source: 'https://www.openstreetmap.org/copyright'
  };
};
