import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import StraightenIcon from '@mui/icons-material/Straighten';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';
import { useIntl } from 'react-intl';

import CustomControl from './CustomControl';

const STATES = {
  IDLE: 'IDLE',
  MEASURING: 'MEASURING',
  MEASURED: 'MEASURED'
};

const METERS_PER_MILE = 1609.344;

const btnStyle = (active, secondary) => ({
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  background: active ? secondary.main : 'white',
  color: active ? secondary.contrastText : 'black',
  cursor: 'pointer',
  boxSizing: 'border-box',
  touchAction: 'manipulation'
});

const finishBtnStyle = {
  all: 'unset',
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 8px',
  height: 26,
  background: 'white',
  cursor: 'pointer',
  fontSize: 13,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  touchAction: 'manipulation'
};

const formatDistance = (meters, locale) => {
  const fmtMeter = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'meter',
    maximumFractionDigits: 0
  });
  const fmtKm = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilometer',
    maximumFractionDigits: 2
  });
  const fmtMile = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'mile',
    maximumFractionDigits: 2
  });
  const metricStr =
    meters < 1000 ? fmtMeter.format(meters) : fmtKm.format(meters / 1000);
  const imperialStr = fmtMile.format(meters / METERS_PER_MILE);
  return `${metricStr} · ${imperialStr}`;
};

const makeDotIcon = color =>
  L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 3px rgba(0,0,0,0.4)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
  });

const makeLabelIcon = (text, bgColor = 'rgba(30,30,30,0.85)') =>
  L.divIcon({
    className: '',
    html: `<div style="background:${bgColor};color:white;padding:3px 7px;border-radius:3px;white-space:nowrap;font-size:13px;font-weight:600;box-shadow:0 1px 4px rgba(0,0,0,0.5)">${text}</div>`,
    iconSize: null,
    iconAnchor: [-6, 12]
  });

const MeasureControl = () => {
  const map = useMap();
  const { formatMessage, locale } = useIntl();
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const { palette } = useTheme();
  const color = palette.secondary.main;
  const colorRef = useRef(color);
  colorRef.current = color;
  const dotIcon = useMemo(() => makeDotIcon(color), [color]);

  const [measureState, setMeasureState] = useState(STATES.IDLE);
  const [waypointCount, setWaypointCount] = useState(0);

  // Keep ref in sync to avoid stale closures in map event handlers
  const stateRef = useRef(STATES.IDLE);
  stateRef.current = measureState;

  const waypointsRef = useRef([]);
  const polylineRef = useRef(null);
  const dotMarkersRef = useRef([]);
  const labelRef = useRef(null);
  const totalDistRef = useRef(0);

  const refreshLabel = useCallback(
    (meters, latlng) => {
      const text = formatDistance(meters, localeRef.current);
      if (!labelRef.current) {
        labelRef.current = L.marker(latlng, {
          icon: makeLabelIcon(text),
          interactive: false,
          zIndexOffset: 1000
        }).addTo(map);
      } else {
        labelRef.current.setLatLng(latlng);
        labelRef.current.setIcon(makeLabelIcon(text));
      }
    },
    [map]
  );

  const clearLayers = useCallback(targetMap => {
    polylineRef.current?.remove();
    polylineRef.current = null;
    dotMarkersRef.current.forEach(m => m.remove());
    dotMarkersRef.current = [];
    labelRef.current?.remove();
    labelRef.current = null;
    waypointsRef.current = [];
    totalDistRef.current = 0;
    setWaypointCount(0);
    targetMap.getContainer().style.cursor = '';
  }, []);

  const handleFinish = useCallback(() => {
    if (waypointsRef.current.length < 1) {
      clearLayers(map);
      setMeasureState(STATES.IDLE);
      return;
    }
    const last = waypointsRef.current[waypointsRef.current.length - 1];
    if (labelRef.current) {
      labelRef.current.setLatLng(last);
      labelRef.current.setIcon(
        makeLabelIcon(
          formatDistance(totalDistRef.current, localeRef.current),
          colorRef.current
        )
      );
    }
    map.getContainer().style.cursor = '';
    setMeasureState(STATES.MEASURED);
  }, [map, clearLayers]);

  const handleToggle = useCallback(() => {
    if (stateRef.current === STATES.IDLE) {
      map.getContainer().style.cursor = 'crosshair';
      setMeasureState(STATES.MEASURING);
    } else {
      clearLayers(map);
      setMeasureState(STATES.IDLE);
    }
  }, [map, clearLayers]);

  useEffect(
    () => () => {
      clearLayers(map);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useMapEvents({
    click(e) {
      if (stateRef.current !== STATES.MEASURING) return;
      if (e.originalEvent._measureDblclick) return;

      const { latlng } = e;
      const points = waypointsRef.current;

      const dot = L.marker(latlng, {
        icon: dotIcon,
        interactive: false,
        zIndexOffset: 900
      }).addTo(map);
      dotMarkersRef.current.push(dot);

      if (points.length > 0) {
        const prev = points[points.length - 1];
        totalDistRef.current += L.latLng(prev).distanceTo(latlng);

        if (!polylineRef.current) {
          polylineRef.current = L.polyline([prev, latlng], {
            color,
            weight: 3,
            dashArray: '6, 4'
          }).addTo(map);
        } else {
          polylineRef.current.addLatLng(latlng);
        }

        refreshLabel(totalDistRef.current, latlng);
      }

      waypointsRef.current.push(latlng);
      setWaypointCount(waypointsRef.current.length);
    },

    dblclick(e) {
      if (stateRef.current !== STATES.MEASURING) return;
      e.originalEvent._measureDblclick = true;
      map.once('click', evt => {
        evt.originalEvent._measureDblclick = true;
      });
      handleFinish();
    },

    mousemove(e) {
      if (stateRef.current !== STATES.MEASURING) return;
      if (e.originalEvent.pointerType === 'touch') return;

      const points = waypointsRef.current;
      if (points.length === 0) return;

      const prev = points[points.length - 1];
      const previewDist =
        totalDistRef.current + L.latLng(prev).distanceTo(e.latlng);

      refreshLabel(previewDist, e.latlng);
    }
  });

  const isActive = measureState !== STATES.IDLE;
  const showFinish = measureState === STATES.MEASURING && waypointCount >= 1;

  return (
    <>
      <CustomControl position="topleft" useLeafletControl>
        <button
          type="button"
          style={btnStyle(isActive, palette.secondary)}
          onClick={handleToggle}
          title={formatMessage({
            id: isActive ? 'Stop measurement' : 'Measure distance',
            defaultMessage: isActive ? 'Stop measurement' : 'Measure distance'
          })}
          aria-label={formatMessage({
            id: isActive ? 'Stop measurement' : 'Measure distance',
            defaultMessage: isActive ? 'Stop measurement' : 'Measure distance'
          })}>
          <StraightenIcon style={{ fontSize: 18 }} />
        </button>
      </CustomControl>

      {showFinish && (
        <CustomControl position="bottomleft" useLeafletControl>
          <button type="button" style={finishBtnStyle} onClick={handleFinish}>
            <CheckIcon style={{ fontSize: 15 }} />
            {formatMessage({ id: 'Finish', defaultMessage: 'Finish' })}
          </button>
        </CustomControl>
      )}
    </>
  );
};

export default MeasureControl;
