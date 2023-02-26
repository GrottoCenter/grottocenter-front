import { createControlComponent } from '@react-leaflet/core';
import 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
import * as L from 'leaflet';

const LocateControl = createControlComponent(props => L.control.locate(props));
export default LocateControl;
