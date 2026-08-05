import { createControlComponent } from '@react-leaflet/core';
import { FullScreen } from 'leaflet.fullscreen';
import 'leaflet.fullscreen/dist/Control.FullScreen.css';

// We do not use the react-leaflet-fullscreen plugin (https://github.com/krvital/react-leaflet-fullscreen)
// Because it does not use the latest version of leaflet.fullscreen
const FullscreenControl = createControlComponent(
  props => new FullScreen(props)
);
export default FullscreenControl;
