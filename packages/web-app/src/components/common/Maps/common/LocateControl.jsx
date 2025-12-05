import { createControlComponent } from '@react-leaflet/core';
import { LocateControl as LeafletLocateControl } from 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';

const LocateControl = createControlComponent(props => new LeafletLocateControl(props));
export default LocateControl;
