import { createControlComponent } from '@react-leaflet/core';
import {
  LocateControl as LeafletLocateControl,
  CompassMarker
} from 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';

// leaflet-rotate keeps marker icons screen-fixed unless `rotateWithView` is set,
// so leaflet.locatecontrol's heading arrow ignores the map bearing and stays
// visually off by the map's rotation once the compass rotates the map (the
// classic "arrow is 90° wrong" while following). Enabling rotateWithView makes
// the arrow turn with the map like any pane child, so it keeps pointing at the
// real-world heading. The guard defaults map._bearing (undefined on non-rotatable
// maps, where leaflet-rotate never initialises it) so the transform never becomes
// NaN on a locate-only map.
const RotatingCompassMarker = CompassMarker.extend({
  options: { rotateWithView: true },
  _setPos(pos) {
    if (this._map && this._map._bearing == null) this._map._bearing = 0;
    return CompassMarker.prototype._setPos.call(this, pos);
  }
});

const LocateControl = createControlComponent(
  props =>
    new LeafletLocateControl({ compassClass: RotatingCompassMarker, ...props })
);
export default LocateControl;
