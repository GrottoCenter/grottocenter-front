import { useMapEvent } from 'react-leaflet';
import { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as L from 'leaflet';
import { hexbin as d3Hexbin } from 'd3-hexbin';
import { useIntl } from 'react-intl';
import { heatmapTypes } from './DataControl';
import {
  MARKERS_LIMIT,
  HEX_FLY_TO_DURATION,
  HEX_MAX_RADIUS,
  HEX_OPACITY
} from './constants';
import { brown, blue, green } from '@mui/material/colors';

// Solid fill color per type (mid-range from each palette)
const TYPE_COLORS = {
  [heatmapTypes.ENTRANCES]: brown[600],
  [heatmapTypes.NETWORKS]: blue[600],
  [heatmapTypes.MASSIFS]: green[600]
};

const HEX_RADIUS = HEX_MAX_RADIUS;

/**
 * POC 4 — Single hex grid with pie/donut arcs per cell.
 *
 * All active data types are tagged and merged into one array, then binned
 * into a shared hex grid. Each hexagon renders a mini pie chart showing
 * the proportion of each type in that cell.
 */
const usePieHexLayer = (heatOffZoom = MARKERS_LIMIT) => {
  const { formatMessage } = useIntl();
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragEndTimerRef = useRef(null);
  const dataRef = useRef({ dataByType: {}, activeTypes: [] });
  const rafRef = useRef(null);

  const map = useMapEvent('zoomend', () => {
    scheduleRedraw();
  });

  useMapEvent('moveend', () => {
    scheduleRedraw();
  });

  useMapEvent('dragstart', () => {
    isDraggingRef.current = true;
  });

  useMapEvent('dragend', () => {
    dragEndTimerRef.current = setTimeout(() => {
      dragEndTimerRef.current = null;
      isDraggingRef.current = false;
    }, 0);
  });

  const scheduleRedraw = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      redraw();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize SVG overlay
  useEffect(() => {
    const overlayPane = map.getPanes().overlayPane;
    const svg = d3.select(overlayPane).append('svg')
      .attr('class', 'pie-hex-overlay')
      .style('position', 'absolute')
      .style('pointer-events', 'none');
    const g = svg.append('g').attr('class', 'pie-hex-group');
    svgRef.current = svg;
    gRef.current = g;

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (dragEndTimerRef.current) clearTimeout(dragEndTimerRef.current);
      svg.remove();
      d3.selectAll('.pie-hex-tooltip').remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redraw = useCallback(() => {
    const svg = svgRef.current;
    const g = gRef.current;
    if (!svg || !g) return;

    const { dataByType, activeTypes } = dataRef.current;
    const zoom = map.getZoom();

    // Clear if above threshold or no active types
    if (zoom >= heatOffZoom || activeTypes.length === 0) {
      g.selectAll('*').remove();
      svg.style('display', 'none');
      return;
    }
    svg.style('display', null);

    const bounds = map.getBounds();
    const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
    const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());
    const width = bottomRight.x - topLeft.x;
    const height = bottomRight.y - topLeft.y;

    svg
      .attr('width', width)
      .attr('height', height)
      .style('left', `${topLeft.x}px`)
      .style('top', `${topLeft.y}px`);
    g.attr('transform', `translate(${-topLeft.x},${-topLeft.y})`);

    // Tag each point with its type and project to pixel coords
    const taggedPoints = [];
    activeTypes.forEach(type => {
      const coords = dataByType[type] || [];
      coords.forEach(([lng, lat]) => {
        const pt = map.latLngToLayerPoint([lat, lng]);
        taggedPoints.push({ x: pt.x, y: pt.y, type });
      });
    });

    if (taggedPoints.length === 0) {
      g.selectAll('*').remove();
      return;
    }

    // Bin into hex grid
    const hexbin = d3Hexbin()
      .x(d => d.x)
      .y(d => d.y)
      .radius(HEX_RADIUS)
      .extent([[topLeft.x, topLeft.y], [bottomRight.x, bottomRight.y]]);

    const bins = hexbin(taggedPoints);

    // Scale radius by count (sqrt scale)
    const maxCount = d3.max(bins, b => b.length) || 1;
    const radiusScale = d3.scaleSqrt()
      .domain([0, maxCount])
      .range([HEX_RADIUS * 0.4, HEX_RADIUS]);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arcGen = d3.arc();

    // Join bins
    const hexGroups = g.selectAll('.pie-hex')
      .data(bins, d => `${d.x},${d.y}`);

    hexGroups.exit().remove();

    const enter = hexGroups.enter()
      .append('g')
      .attr('class', 'pie-hex')
      .style('cursor', 'pointer')
      .style('pointer-events', 'all');

    const merged = enter.merge(hexGroups)
      .attr('transform', d => `translate(${d.x},${d.y})`);

    merged.each(function (bin) {
      const group = d3.select(this);
      group.selectAll('*').remove();

      const r = radiusScale(bin.length);

      // Count per type
      const counts = {};
      activeTypes.forEach(t => { counts[t] = 0; });
      bin.forEach(pt => { counts[pt.type] = (counts[pt.type] || 0) + 1; });

      const pieData = activeTypes
        .filter(t => counts[t] > 0)
        .map(t => ({ type: t, value: counts[t] }));

      if (pieData.length === 1) {
        // Single type: just a filled circle
        group.append('circle')
          .attr('r', r)
          .attr('fill', TYPE_COLORS[pieData[0].type])
          .attr('fill-opacity', HEX_OPACITY)
          .attr('stroke', '#000')
          .attr('stroke-width', 0.5);
      } else {
        // Multiple types: pie arcs
        const arcs = pie(pieData);
        arcs.forEach(arc => {
          group.append('path')
            .attr('d', arcGen.innerRadius(0).outerRadius(r)(arc))
            .attr('fill', TYPE_COLORS[arc.data.type])
            .attr('fill-opacity', HEX_OPACITY)
            .attr('stroke', '#000')
            .attr('stroke-width', 0.5);
        });
      }

      // Tooltip on hover
      group
        .on('mouseenter', function (event) {
          d3.selectAll('.pie-hex-tooltip').remove();
          const lines = pieData.map(
            d => `${d.value} ${formatMessage({ id: d.type })}`
          );
          const tooltip = d3.select(map.getContainer())
            .append('div')
            .attr('class', 'pie-hex-tooltip')
            .style('position', 'absolute')
            .style('padding', '8px')
            .style('background', '#616161e6')
            .style('color', 'white')
            .style('border-radius', '2px')
            .style('font-size', '12px')
            .style('font-weight', '400')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .html(lines.join('<br>'));

          const rect = map.getContainer().getBoundingClientRect();
          tooltip
            .style('left', `${event.clientX - rect.left + 12}px`)
            .style('top', `${event.clientY - rect.top - 12}px`);
        })
        .on('mouseleave', () => {
          d3.selectAll('.pie-hex-tooltip').remove();
        })
        .on('click', () => {
          if (isDraggingRef.current) return;
          d3.selectAll('.pie-hex-tooltip').remove();
          const latlngs = bin.map(pt => {
            // Reverse project from pixel to latlng
            return map.layerPointToLatLng([pt.x, pt.y]);
          });
          const clickBounds = new L.LatLngBounds(latlngs);
          map.flyToBounds(clickBounds, {
            maxZoom: MARKERS_LIMIT,
            duration: HEX_FLY_TO_DURATION
          });
        });

      // Hover scale effect
      group
        .on('mouseenter.scale', function () {
          d3.select(this).transition().duration(150)
            .attr('transform', `translate(${bin.x},${bin.y}) scale(1.2)`);
        })
        .on('mouseleave.scale', function () {
          d3.select(this).transition().duration(150)
            .attr('transform', `translate(${bin.x},${bin.y}) scale(1)`);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, heatOffZoom]);

  /**
   * @param {Object} dataByType - { entrances: [[lng,lat],...], ... }
   * @param {string[]} activeTypes - e.g. ['entrances', 'networks']
   */
  const updateLayers = useCallback((dataByType, activeTypes) => {
    dataRef.current = { dataByType, activeTypes };
    scheduleRedraw();
  }, [scheduleRedraw]);

  return { updateLayers };
};

export default usePieHexLayer;
