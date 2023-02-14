import * as L from 'leaflet';

/*
This files is used to config all the map layers offered.

Concerning the bounds of a layer,
they represent the area on the map for which the layer is available.

If the layer is available for the entire map, we should set its bounds to
" new L.LatLngBounds(new L.LatLng(-90, -200), new L.LatLng(90, 200)) "
 */

const layers = [
  {
    name: 'OpenStreetMap Basic',
    type: 'WMTS',
    attribution:
      '« © <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap </a> contributors » under ODbL licence',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 22,
    maxNativeZoom: 18,
    bounds: new L.LatLngBounds(new L.LatLng(-90, -200), new L.LatLng(90, 200))
  },
  {
    name: 'Esri Satellite',
    type: 'WMTS',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 22,
    maxNativeZoom: 19,
    bounds: new L.LatLngBounds(new L.LatLng(50, -10), new L.LatLng(60, 2))
  },
  {
    name: 'OpenTopoMap',
    type: 'WMTS',
    attribution:
      'Map data: &copy; <a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a target="_blank" href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a target="_blank" href="https://opentopomap.org">OpenTopoMap</a> (<a target="_blank" href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    maxZoom: 22,
    maxNativeZoom: 17,
    bounds: new L.LatLngBounds(new L.LatLng(50, -10), new L.LatLng(60, 2))
  },
  {
    name: 'France - IGN SCAN 25®',
    type: 'WMTS',
    attribution: 'IGN-F/Geoportail',
    url: 'https://wxs.ign.fr/eru891fho4j0vpr2gomsjegu/geoportail/wmts?&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE=normal&TILEMATRIXSET=PM&FORMAT=image/jpeg&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    maxZoom: 22,
    maxNativeZoom: 16,
    bounds: new L.LatLngBounds(
      new L.LatLng(-5.119629, 42.163403),
      new L.LatLng(8.789063, 51.179343)
    )
  },
  {
    name: 'World - Bedrock and Structural geology',
    type: 'WMS',
    attribution:
      'BRGM - <a target="_blank" href="http://mapsref.brgm.fr/wxs/1GG/CGMW_Bedrock_and_Structural_Geology?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=World_CGMW_50M_GeologicalUnitsOnshore&format=image/png&STYLE=default">Legend ⧉</a>',
    url: 'http://mapsref.brgm.fr/wxs/1GG/CGMW_Bedrock_and_Structural_Geology?',
    layers: 'World_CGMW_50M_GeologicalUnitsOnshore',
    bounds: new L.LatLngBounds(
      new L.LatLng(-5.119629, 42.163403),
      new L.LatLng(8.789063, 51.179343)
    )
  },
  {
    name: 'Europe - Bedrock and Structural geology',
    type: 'WMS',
    attribution:
      'BRGM - <a target="_blank" href="http://mapsref.brgm.fr/wxs/1GG/GISEurope_Bedrock_and_Structural_Geology?version=1.3.0&service=WMS&request=GetLegendGraphic&sld_version=1.1.0&layer=Europe_GISEurope_1500K_BedrockAge&format=image/png&STYLE=default">Legend ⧉</a>',
    url: 'http://mapsref.brgm.fr/wxs/1GG/GISEurope_Bedrock_and_Structural_Geology?',
    layers: 'Europe_GISEurope_1500K_BedrockAge',
    bounds: new L.LatLngBounds(
      new L.LatLng(-5.119629, 42.163403),
      new L.LatLng(8.789063, 51.179343)
    )
  }
];

export default layers;
