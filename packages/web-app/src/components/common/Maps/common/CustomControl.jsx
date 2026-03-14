import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import * as L from 'leaflet';

// Classes used by Leaflet to position controls.
const POSITION_CLASSES = {
  bottomleft: 'leaflet-bottom leaflet-left',
  bottomright: 'leaflet-bottom leaflet-right',
  topleft: 'leaflet-top leaflet-left',
  topright: 'leaflet-top leaflet-right'
};

const CustomControl = ({
  position = 'topright',
  containerProps,
  children,
  style,
  useLeafletControl = false,
  containerClassName
}) => {
  const controlRef = useRef(null);
  const map = useMap();
  const [container, setContainer] = useState(null);

  useEffect(() => {
    if (controlRef.current) {
      L.DomEvent.disableClickPropagation(controlRef.current);
      L.DomEvent.disableScrollPropagation(controlRef.current);
    }
  }, []);

  useEffect(() => {
    if (!useLeafletControl || !map) return;
    const control = L.control({ position });
    control.onAdd = () => {
      const div = L.DomUtil.create('div', containerClassName || 'leaflet-bar leaflet-control');
      L.DomEvent.disableClickPropagation(div);
      L.DomEvent.disableScrollPropagation(div);
      setContainer(div);
      return div;
    };
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map, position, useLeafletControl, containerClassName]);

  if (useLeafletControl) {
    if (!container) return null;
    return createPortal(children, container);
  }

  return (
    <div className={POSITION_CLASSES[position]} style={style}>
      <div ref={controlRef} className="leaflet-control leaflet-bar" {...containerProps}>
        {children}
      </div>
    </div>
  );
};

export const customControlProps = {
  position: PropTypes.oneOf(Object.keys(POSITION_CLASSES)),
  containerProps: PropTypes.any,
  children: PropTypes.node,
  style: PropTypes.object,
  useLeafletControl: PropTypes.bool,
  containerClassName: PropTypes.string
};

CustomControl.propTypes = {
  ...customControlProps
};

export default CustomControl;
