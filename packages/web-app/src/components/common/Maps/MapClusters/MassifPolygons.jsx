import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as L from 'leaflet';
import PropTypes from 'prop-types';
import { MassifPopup } from '../common/Markers/Components';
import useRenderPopup from '../common/Markers/useRenderPopup';
import { MASSIF_POLYGON_STYLE, MASSIF_POLYGON_HOVER_STYLE } from './constants';

// Bounding-box area approximation — fast enough for sort ordering.
const getBboxArea = geometry => {
  const coords =
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates.flat(2)
      : geometry.coordinates.flat(1);
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  return (Math.max(...lngs) - Math.min(...lngs)) * (Math.max(...lats) - Math.min(...lats));
};

const MassifPolygons = ({ massifs = [] }) => {
  const map = useMap();
  const renderPopup = useRenderPopup();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.remove();
      layerRef.current = null;
    }

    if (!massifs || massifs.length === 0) return undefined;

    const geoJsonData = {
      type: 'FeatureCollection',
      features: massifs
        .filter(m => m.geogPolygon)
        .map(m => ({ m, area: getBboxArea(m.geogPolygon) }))
        .sort((a, b) => b.area - a.area)
        .map(({ m }) => ({
          type: 'Feature',
          geometry: m.geogPolygon,
          properties: {
            id: m.id,
            name: m.name,
            entranceCount: m.entranceCount ?? 0,
            networkCount: m.networkCount ?? 0
          }
        }))
    };

    layerRef.current = L.geoJSON(geoJsonData, {
      style: MASSIF_POLYGON_STYLE,
      onEachFeature: (feature, layer) => {
        layer.bindPopup(() =>
          renderPopup(<MassifPopup massif={feature.properties} />)
        );
        if (feature.properties.name) {
          layer.bindTooltip(feature.properties.name, { sticky: true });
        }
        layer.on('mouseover', () => {
          layer.setStyle(MASSIF_POLYGON_HOVER_STYLE);
        });
        layer.on('mouseout', () => {
          if (!layer.isPopupOpen()) {
            layer.setStyle(MASSIF_POLYGON_STYLE);
          }
        });
        layer.on('click', () => {
          layer.closeTooltip();
        });
        layer.on('popupclose', () => {
          layer.setStyle(MASSIF_POLYGON_STYLE);
        });
      }
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
    };
  }, [massifs, map, renderPopup]);

  return null;
};

MassifPolygons.propTypes = {
  massifs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string,
      geogPolygon: PropTypes.shape({
        type: PropTypes.string,
        coordinates: PropTypes.array
      }),
      entranceCount: PropTypes.number,
      networkCount: PropTypes.number
    })
  )
};

export default MassifPolygons;
