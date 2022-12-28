import { createControlComponent } from '@react-leaflet/core';
import 'leaflet.fullscreen';
import 'leaflet.fullscreen/Control.FullScreen.css';
import * as L from 'leaflet';

// We do not use the react-leaflet-fullscreen plugin (https://github.com/krvital/react-leaflet-fullscreen)
// Because it does not use the latest version of leaflet.fullscreen
const FullscreenControl = createControlComponent(props =>
  L.control.fullscreen(props)
);
export default FullscreenControl;
